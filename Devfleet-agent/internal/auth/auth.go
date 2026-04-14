package auth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"github.com/google/uuid"
	"github.com/eviltwin7648/devfleet-agent/internal/utils"
	"github.com/eviltwin7648/devfleet-agent/internal/config"
)

type registerPayload struct {
	AgentID  string `json:"agent_id"`
	OS       string `json:"os"`
	Arch     string `json:"arch"`
	Hostname string `json:"hostname"`
	TotalMem uint64 `json:"totalmem"`
	ApiKey   string `json:"apiKey"`
}

type registerResponse struct {
	Username string `json:"username"`
	AgentID  string `json:"agent_id"`
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

func RegisterAgent(apiKey, apiURL string) (*registerResponse, error) {
	mi, err := utils.CollectMachineInfo()
	if err != nil {
		return nil, fmt.Errorf("failed to get machine info: %w", err)
	}
	apiURL = NormalizeAPIURL(apiURL)
	if apiURL == "" {
		return nil, fmt.Errorf("API URL cannot be empty")
	}

	agentID, err := getOrCreateAgentID()
	if err != nil {
		return nil, fmt.Errorf("failed to get agent ID: %w", err)
	}

	payload := registerPayload{
		AgentID:  agentID,
		OS:       mi.OS,
		Arch:     mi.Arch,
		Hostname: mi.Hostname,
		TotalMem: mi.TotalMem,
		ApiKey:   apiKey,
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("could not marshal request body: %w", err)
	}

	resp, err := http.Post(
		apiURL+"/api/v1/agent/register",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("registration failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var data registerResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &data, nil
}

func VerifyAgent(apiKey, apiURL string) (string, error) {
	mi, err := utils.CollectMachineInfo()
	if err != nil {
		return "", fmt.Errorf("failed to collect machine info: %w", err)
	}
	apiURL = NormalizeAPIURL(apiURL)
	if apiURL == "" {
		return "", fmt.Errorf("API URL cannot be empty")
	}

	payload := map[string]interface{}{
		"apiKey":   apiKey,
		"hostname": mi.Hostname,
		"os":       mi.OS,
		"arch":     mi.Arch,
	}
	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal verify payload: %w", err)
	}

	resp, err := http.Post(
		apiURL+"/api/v1/agent/verify",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	if err != nil {
		return "", fmt.Errorf("error while verifying agent: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("agent verification failed with status: %s", resp.Status)
	}

	var result struct {
		Message string `json:"message"`
		Token   string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode verify response: %w", err)
	}

	fmt.Println("Agent Verified Successfully. Token received.")
	return result.Token, nil
}

func getOrCreateAgentID() (string, error) {
	cfg, err := config.LoadKey()

	if err == nil && cfg.AgentID != "" {
		return cfg.AgentID, nil
	}

	id := uuid.New().String()

	err = config.SaveKey("", id, "")
	if err != nil {
		return "", fmt.Errorf("failed to save agent ID: %w", err)
	}

	return id, nil
}