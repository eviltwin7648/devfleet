package heartbeat

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/eviltwin7648/devfleet-agent/internal/utils"
)

func Start(token string, agentId string, apiURL string) {
	ticker := time.NewTicker(1 * time.Minute) // heartbeat interval
	defer ticker.Stop()

	for {
		if err := sendHeartbeat(token, agentId, apiURL); err != nil {
			fmt.Println("Heartbeat error:", err)
		}

		<-ticker.C
	}
}

func sendHeartbeat(token string, agentId string, apiURL string) error {
	mi, err := utils.CollectMachineInfo()
	if err != nil {
		return fmt.Errorf("failed to get machine info: %w", err)
	}

	hi, _ := utils.CollectHealthInfo()

	payload := map[string]interface{}{
		"machine": mi,
		"health":  hi,
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal heartbeat payload: %w", err)
	}

	req, err := http.NewRequest("POST", apiURL+"/api/v1/agent/heartbeat", bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send heartbeat: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("heartbeat returned status %d", resp.StatusCode)
	}

	var respData struct {
		CancelExecutions []string `json:"cancelExecutions"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&respData); err != nil {
		return nil // Ignore error decoding body if it's empty or different format
	}

	for _, execId := range respData.CancelExecutions {
		utils.CancelJob(execId)
	}

	return nil

}
