package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/eviltwin7648/devfleet-agent/internal/auth"
	"github.com/eviltwin7648/devfleet-agent/internal/config"
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
		if bootstrapToken != "" {
			if apiURL == "" {
				apiURL = promptAPIURL()
			}
			if apiURL == "" {
				fmt.Println("API URL cannot be empty.")
				os.Exit(1)
			}
			fmt.Println("Registering agent using provided API key...")
			data, err := auth.RegisterAgent(bootstrapToken, apiURL)
			if err != nil {
				fmt.Println("Registration failed:", err)
				os.Exit(1)
			}
			if err := config.SaveKey(bootstrapToken, data.AgentID, apiURL); err != nil {
				fmt.Println("Failed to save key:", err)
				os.Exit(1)
			}
			fmt.Println("Registration successful. Starting agent...")
		}

		token, err := config.LoadKey()
		if err != nil {
			fmt.Println("No auth token found. Run `devfleet-agent login` first.")
			os.Exit(1)
		}
		if token.APIURL == "" {
			token.APIURL = promptAPIURL()
			if token.APIURL == "" {
				fmt.Println("API URL cannot be empty.")
				os.Exit(1)
			}
			if err := config.SaveKey(token.APIKey, token.AgentID, token.APIURL); err != nil {
				fmt.Println("Failed to save API URL:", err)
				os.Exit(1)
			}
		}
		// Verify and get JWT
		jwtToken, err := auth.VerifyAgent(token.APIKey, token.APIURL)
		if err != nil {
			fmt.Println("Authentication failed:", err)
			os.Exit(1)
		}

		fmt.Println("Authentication successful. Running agent...")

		// Start your loops:
		go heartbeat.Start(jwtToken, token.AgentID, token.APIURL)
		go jobs.StartPolling(jwtToken, token.AgentID, token.APIURL)

		select {} // keep running
	},
}

func init() {
	startCmd.Flags().StringVar(&bootstrapToken, "token", "", "agent API key used for one-time bootstrap registration")
	startCmd.Flags().StringVar(&bootstrapAPIURL, "api-url", "", "DevFleet API base URL used during registration")
	rootCmd.AddCommand(startCmd)
}
