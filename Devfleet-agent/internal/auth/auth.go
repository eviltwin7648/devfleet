package auth

import (
	"context"
	"fmt"
	"strings"

	"github.com/eviltwin7648/devfleet-agent/internal/client"
	"github.com/eviltwin7648/devfleet-agent/internal/config"
	"github.com/eviltwin7648/devfleet-agent/internal/utils"
	"github.com/google/uuid"
)

type RegisterResponse struct {
	AgentID string
}

func NormalizeAPIURL(apiURL string) string {
	trimmed := strings.TrimSpace(apiURL)
	if trimmed == "" {
		return ""
	}
	if !strings.HasPrefix(trimmed, "http://") && !strings.HasPrefix(trimmed, "https://") {
		trimmed = "http://" + trimmed
	}
	return strings.TrimRight(trimmed, "/")
}

func RegisterAgent(apiKey, apiURL string) (*RegisterResponse, error) {
	apiClient := client.NewHTTPClient(apiURL, "")
	
	mi, err := utils.CollectMachineInfo()
	if err != nil {
		return nil, fmt.Errorf("failed to get machine info: %w", err)
	}

	agentID, err := getOrCreateAgentID()
	if err != nil {
		return nil, fmt.Errorf("failed to get agent ID: %w", err)
	}

	ctx := context.Background()
	newID, err := apiClient.Register(ctx, apiKey, agentID, mi)
	if err != nil {
		return nil, err
	}

	if newID != "" && newID != agentID {
		agentID = newID
	}

	return &RegisterResponse{AgentID: agentID}, nil
}

func VerifyAgent(apiKey, apiURL string) (string, error) {
	apiClient := client.NewHTTPClient(apiURL, "")
	
	mi, err := utils.CollectMachineInfo()
	if err != nil {
		return "", fmt.Errorf("failed to collect machine info: %w", err)
	}

	ctx := context.Background()
	return apiClient.Verify(ctx, apiKey, mi)
}

func getOrCreateAgentID() (string, error) {
	cfg, err := config.LoadKey()
	if err == nil && cfg.AgentID != "" {
		return cfg.AgentID, nil
	}

	id := uuid.New().String()
	if err := config.SaveKey("", id, ""); err != nil {
		return "", fmt.Errorf("failed to save agent ID: %w", err)
	}

	return id, nil
}