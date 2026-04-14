package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "devfleet-agent",
	Short: "A CLI agent for Devfleet Servie",
	Long:  `devfleet-agent is a command-line tool that interacts with the DevFleet API to manage jobs and report system metrics.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Welcome to Devfleet Agent. Use 'devfleet-agent login' to get started")
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
