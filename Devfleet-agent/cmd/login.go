package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/eviltwin7648/devfleet-agent/internal/auth"
	"github.com/eviltwin7648/devfleet-agent/internal/config"
	"github.com/spf13/cobra"
)

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Login to the service",
	RunE: func(cmd *cobra.Command, args []string) error {
		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Enter your DevFleet API URL: ")
		apiURL, _ := reader.ReadString('\n')
		apiURL = auth.NormalizeAPIURL(strings.TrimSpace(apiURL))

		if apiURL == "" {
			return fmt.Errorf("API URL cannot be empty")
		}

		fmt.Print("Enter your Agent API Key: ")
		key, _ := reader.ReadString('\n')
		key = strings.TrimSpace(key)

		if key == "" {
			return fmt.Errorf("API key cannot be empty")
		}

		data, err := auth.RegisterAgent(key, apiURL)
		if err != nil {
			return err
		}
		if err := config.SaveKey(key, data.AgentID, apiURL); err != nil {
			return fmt.Errorf("failed to save key: %w", err)

		}
		fmt.Println("Welcome", data.Username)
		fmt.Println("API key saved successfully")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(loginCmd)
}
