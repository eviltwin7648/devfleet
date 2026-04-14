package jobs

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/eviltwin7648/devfleet-agent/internal/utils"
)

// StartPolling continuously long-polls the backend for jobs.
// Using ?longPoll=true means the server holds the connection open (up to 30s)
// and responds the moment a job is available — no fixed polling delay.
func StartPolling(token string, agentId string, apiURL string) {
	fmt.Println("[polling] Starting long-poll loop...")
	for {
		gotJob := poll(token, agentId, apiURL)
		if !gotJob {
			// No job or timeout — loop back immediately to long-poll again.
			// Small sleep only on error (set inside poll) to avoid hammering on failures.
		}
	}
}

// poll does a single long-poll request. Returns true if a job was found and executed.
// The server will hold the connection open for up to 30s waiting for a job,
// so we set an HTTP timeout of 35s to give it room.
func poll(token string, agentId string, apiURL string) bool {
	req, err := http.NewRequest("GET", apiURL+"/api/v1/agent/jobs/pull", nil)
	if err != nil {
		fmt.Println("[poll] Error creating request:", err)
		time.Sleep(5 * time.Second)
		return false
	}
	req.Header.Set("Authorization", "Bearer "+token)

	// 35s timeout: server holds for 30s, we give 5s extra for network overhead
	client := &http.Client{Timeout: 35 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("[poll] Request error:", err)
		time.Sleep(5 * time.Second)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Println("[poll] Unexpected status:", resp.Status)
		time.Sleep(5 * time.Second)
		return false
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("[poll] Error reading body:", err)
		return false
	}

	// Response is { "job": { ... } } or { "job": null }
	var respData struct {
		Job *utils.Job `json:"job"`
	}
	if err := json.Unmarshal(body, &respData); err != nil {
		fmt.Println("[poll] Error parsing response:", err)
		return false
	}

	if respData.Job == nil {
		// Long-poll timed out server-side with no job — immediately loop again
		return false
	}

	fmt.Printf("[poll] Received job execution ID: %s, script: %q\n", respData.Job.ExecutionId, respData.Job.Definition.Script)
	if respData.Job.Definition.Script == "" {
		fmt.Println("[poll] WARNING: job has an empty script, skipping execution")
		return false
	}

	result := utils.RunJob(*respData.Job, token, apiURL)
	fmt.Printf("[poll] Job finished — status: %s, exit code: %d\n", result.Status, result.ExitCode)

	if err := reportJobResult(token, apiURL, respData.Job.ExecutionId, result); err != nil {
		fmt.Println("[poll] Failed to report job result:", err)
	} else {
		fmt.Println("[poll] Job result reported successfully.")
	}
	return true
}

func reportJobResult(token string, apiURL string, jobID string, result utils.JobResult) error {
	payload := map[string]interface{}{
		"status":    result.Status, // "SUCCESS", "FAILED"
		"exit_code": result.ExitCode,
		"stdout":    result.Stdout, // Sending logs optionally
		"stderr":    result.Stderr,
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	url := fmt.Sprintf("%s/api/v1/agent/execution/%s/result", apiURL, jobID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("create request error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("backend returned status %s: %s", resp.Status, string(body))
	}

	return nil
}
