// jobheartbeat every 30 second to renew lease
package heartbeat

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/eviltwin7648/devfleet-agent/internal/utils"
)

type JobHeartbeatPayload struct {
	JobId       string `json:"jobId"`
	ExecutionId string `json:"executionId"`
}

func startJobHeartbeat(Job utils.Job, token, apiURL string) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		err := jobHeartBeat(Job, token, apiURL)
		if err != nil {
			fmt.Println("JobHeartbeat Error", err)
		}
	}
}

func jobHeartBeat(Job utils.Job, token, apiURL string) error {
	payload := JobHeartbeatPayload{
		JobId:       Job.Definition.ID,
		ExecutionId: Job.ExecutionId,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", apiURL+"/api/v1/agent/jobs/renewlease", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	var client = &http.Client{
		Timeout: 5 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return fmt.Errorf("heartbeat failed: %s", resp.Status)
	}
	defer resp.Body.Close()
	return nil
}
