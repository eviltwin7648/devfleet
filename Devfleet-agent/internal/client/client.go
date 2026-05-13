package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/eviltwin7648/devfleet-agent/internal/models"
)

// BackendClient defines the interface for communicating with the DevFleet backend
type BackendClient interface {
	Register(ctx context.Context, apiKey, agentID string, info models.MachineInfo) (string, error)
	Verify(ctx context.Context, apiKey string, info models.MachineInfo) (string, error)
	SendHeartbeat(ctx context.Context, agentID string, health models.HealthInfo) error
	PullJob(ctx context.Context) (*models.Job, error)
	StreamLogs(ctx context.Context, executionID string, batch models.LogBatch) error
	ReportResult(ctx context.Context, executionID string, result models.JobResult) error
	RenewLease(ctx context.Context, jobID, executionID string) (bool, error)
}

type httpClient struct {
	baseURL string
	token   string
	client  *http.Client
}

func NewHTTPClient(baseURL, token string) BackendClient {
	baseURL = strings.TrimSpace(baseURL)
	baseURL = strings.TrimRight(baseURL, "/")
	if !strings.HasPrefix(baseURL, "http") {
		baseURL = "http://" + baseURL
	}

	return &httpClient{
		baseURL: baseURL,
		token:   token,
		client:  &http.Client{Timeout: 40 * time.Second},
	}
}

func (c *httpClient) doRequest(ctx context.Context, method, path string, body interface{}) (*http.Response, error) {
	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bodyReader)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	return c.client.Do(req)
}

func (c *httpClient) Register(ctx context.Context, apiKey, agentID string, info models.MachineInfo) (string, error) {
	payload := map[string]interface{}{
		"apiKey":   apiKey,
		"agent_id": agentID,
		"os":       info.OS,
		"arch":     info.Arch,
		"hostname": info.Hostname,
		"totalmem": info.TotalMem,
	}

	resp, err := c.doRequest(ctx, "POST", "/api/v1/agent/register", payload)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("registration failed: %s", resp.Status)
	}

	var res struct {
		AgentID string `json:"agent_id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}
	return res.AgentID, nil
}

func (c *httpClient) Verify(ctx context.Context, apiKey string, info models.MachineInfo) (string, error) {
	payload := map[string]interface{}{
		"apiKey":   apiKey,
		"hostname": info.Hostname,
		"os":       info.OS,
		"arch":     info.Arch,
	}

	resp, err := c.doRequest(ctx, "POST", "/api/v1/agent/verify", payload)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("verification failed: %s", resp.Status)
	}

	var res struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}
	return res.Token, nil
}

func (c *httpClient) SendHeartbeat(ctx context.Context, agentID string, health models.HealthInfo) error {
	payload := map[string]interface{}{
		"agent_id":  agentID,
		"cpuUsage":  health.CPUUsage,
		"memUsage":  health.MemUsage,
		"diskUsage": health.DiskUsage,
	}

	resp, err := c.doRequest(ctx, "POST", "/api/v1/agent/heartbeat", payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("heartbeat failed: %s", resp.Status)
	}

	return nil
}

func (c *httpClient) PullJob(ctx context.Context) (*models.Job, error) {
	resp, err := c.doRequest(ctx, "GET", "/api/v1/agent/jobs/pull", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pull failed: %s", resp.Status)
	}

	var res struct {
		Job *models.Job `json:"job"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}
	return res.Job, nil
}

func (c *httpClient) StreamLogs(ctx context.Context, executionID string, batch models.LogBatch) error {
	path := fmt.Sprintf("/api/v1/agent/execution/%s/logs", executionID)
	resp, err := c.doRequest(ctx, "POST", path, batch)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("streaming logs failed: %s", resp.Status)
	}
	return nil
}

func (c *httpClient) ReportResult(ctx context.Context, executionID string, result models.JobResult) error {
	path := fmt.Sprintf("/api/v1/agent/execution/%s/result", executionID)
	resp, err := c.doRequest(ctx, "POST", path, result)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("reporting result failed: %s", resp.Status)
	}
	return nil
}

func (c *httpClient) RenewLease(ctx context.Context, jobID, executionID string) (bool, error) {
	payload := map[string]string{
		"jobId":       jobID,
		"executionId": executionID,
	}
	resp, err := c.doRequest(ctx, "POST", "/api/v1/agent/jobs/renewlease", payload)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("lease renewal failed: %s", resp.Status)
	}

	var res struct {
		Cancelled bool `json:"cancelled"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return false, nil
	}

	return res.Cancelled, nil
}
