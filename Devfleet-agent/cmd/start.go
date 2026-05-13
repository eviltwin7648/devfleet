package cmd

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"

	"github.com/eviltwin7648/devfleet-agent/internal/auth"
	"github.com/eviltwin7648/devfleet-agent/internal/client"
	"github.com/eviltwin7648/devfleet-agent/internal/config"
	"github.com/eviltwin7648/devfleet-agent/internal/executor"
	"github.com/eviltwin7648/devfleet-agent/internal/heartbeat"
	"github.com/eviltwin7648/devfleet-agent/internal/jobs"
	"github.com/spf13/cobra"
)

var bootstrapToken string
var bootstrapAPIURL string

func promptAPIURL() string {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("Enter your DevFleet API URL: ")
	apiURL, _ := reader.ReadString('\n')
	return auth.NormalizeAPIURL(strings.TrimSpace(apiURL))
}

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the DevFleet agent",
	Run: func(cmd *cobra.Command, args []string) {
		apiURL := auth.NormalizeAPIURL(bootstrapAPIURL)

		// 1. Initial Config Load & Validation
		cfg, err := config.LoadKey()
		if err != nil {
			// If no config file, we must have a token to start
			if bootstrapToken == "" {
				fmt.Println("No authentication found. Please provide an API key using the --token flag to register.")
				os.Exit(1)
			}
			cfg = &config.Config{APIURL: apiURL}
		}

		// 2. Ensure API URL exists
		if cfg.APIURL == "" {
			cfg.APIURL = promptAPIURL()
			if cfg.APIURL == "" {
				fmt.Println("API URL cannot be empty.")
				os.Exit(1)
			}
		}

		// 3. Handle Registration / Re-linking
		if bootstrapToken != "" {
			fmt.Println("Registering/Linking agent...")
			res, err := auth.RegisterAgent(bootstrapToken, cfg.APIURL)
			if err != nil {
				fmt.Println("Registration failed:", err)
				os.Exit(1)
			}
			cfg.APIKey = bootstrapToken
			cfg.AgentID = res.AgentID
			if err := config.SaveKey(cfg.APIKey, cfg.AgentID, cfg.APIURL); err != nil {
				fmt.Println("Failed to save config:", err)
				os.Exit(1)
			}
			fmt.Println("Registration successful.")
		}

		// 4. Final verification of required fields
		if cfg.APIKey == "" || cfg.AgentID == "" {
			fmt.Println("Missing API Key or Agent ID. Run with --token <YOUR_KEY> to register.")
			os.Exit(1)
		}

		// Verify & Get JWT (with retry on failure)
		var jwtToken string
		for {
			var verifyErr error
			jwtToken, verifyErr = auth.VerifyAgent(cfg.APIKey, cfg.APIURL)
			if verifyErr == nil {
				break
			}

			fmt.Printf("\nAuthentication failed: %v\n", verifyErr)
			fmt.Printf("Current API URL: %s\n", cfg.APIURL)
			fmt.Println("Please provide a correct DevFleet API URL (or Ctrl+C to quit).")
			
			newURL := promptAPIURL()
			if newURL == "" {
				fmt.Println("API URL cannot be empty.")
				os.Exit(1)
			}
			
			cfg.APIURL = newURL
			// Save the corrected URL to config
			if err := config.SaveKey(cfg.APIKey, cfg.AgentID, cfg.APIURL); err != nil {
				fmt.Printf("Warning: Failed to save updated URL to config: %v\n", err)
			}
			fmt.Println("Config updated. Retrying authentication...")
		}

		// Initialize Dependencies
		apiClient := client.NewHTTPClient(cfg.APIURL, jwtToken)
		bashExec := executor.NewBashExecutor()
		jobManager := jobs.NewJobManager(apiClient, bashExec, cfg.AgentID)

		// Setup Context and Graceful Shutdown
		ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		var wg sync.WaitGroup

		fmt.Println("Agent started. Press Ctrl+C to shut down.")

		// Run Loops
		wg.Add(2)
		go heartbeat.Start(ctx, apiClient, cfg.AgentID, &wg)
		go jobManager.StartPolling(ctx, &wg)

		// Wait for shutdown signal
		<-ctx.Done()
		fmt.Println("\nShutting down gracefully...")

		wg.Wait()
		fmt.Println("Shutdown complete.")
	},
}

func init() {
	startCmd.Flags().StringVar(&bootstrapToken, "token", "", "agent API key used for one-time bootstrap registration")
	startCmd.Flags().StringVar(&bootstrapAPIURL, "api-url", "", "DevFleet API base URL used during registration")
	rootCmd.AddCommand(startCmd)
}
