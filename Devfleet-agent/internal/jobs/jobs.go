package jobs

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/eviltwin7648/devfleet-agent/internal/client"
	"github.com/eviltwin7648/devfleet-agent/internal/executor"
	"github.com/eviltwin7648/devfleet-agent/internal/logstream"
	"github.com/eviltwin7648/devfleet-agent/internal/models"
)

type JobManager struct {
	client   client.BackendClient
	exec     executor.Executor
	agentID  string
	active   map[string]context.CancelFunc
	mu       sync.Mutex
}

func NewJobManager(apiClient client.BackendClient, exec executor.Executor, agentID string) *JobManager {
	return &JobManager{
		client:  apiClient,
		exec:    exec,
		agentID: agentID,
		active:  make(map[string]context.CancelFunc),
	}
}

func (m *JobManager) CancelExecution(executionID string) {
	m.mu.Lock()
	cancel, ok := m.active[executionID]
	m.mu.Unlock()
	if ok {
		fmt.Printf("[manager] Cancelling execution %s\n", executionID)
		cancel()
	}
}

func (m *JobManager) StartPolling(ctx context.Context, wg *sync.WaitGroup) {
	defer wg.Done()
	fmt.Println("[polling] Starting long-poll loop...")
	for {
		select {
		case <-ctx.Done():
			fmt.Println("[polling] Stopping loop...")
			return
		default:
			if err := m.poll(ctx); err != nil {
				fmt.Printf("[polling] Error: %v. Retrying in 5s...\n", err)
				time.Sleep(5 * time.Second)
			}
		}
	}
}

func (m *JobManager) poll(ctx context.Context) error {
	job, err := m.client.PullJob(ctx)
	if err != nil {
		return err
	}

	if job == nil {
		return nil
	}

	fmt.Printf("[poll] Received job execution ID: %s\n", job.ExecutionId)
	
	jobCtx, jobCancel := context.WithCancel(ctx)
	m.mu.Lock()
	m.active[job.ExecutionId] = jobCancel
	m.mu.Unlock()
	defer func() {
		m.mu.Lock()
		delete(m.active, job.ExecutionId)
		m.mu.Unlock()
		jobCancel()
	}()

	batcher, stdout, _ := logstream.Bind(job.ExecutionId, m.client)
	defer batcher.Stop()

	leaseCtx, leaseCancel := context.WithCancel(jobCtx)
	defer leaseCancel()
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-leaseCtx.Done():
				return
			case <-ticker.C:
				cancelled, err := m.client.RenewLease(leaseCtx, job.Definition.ID, job.ExecutionId)
				if err != nil {
					fmt.Printf("[poll] Lease renewal failed: %v\n", err)
				}
				if cancelled {
					fmt.Printf("[poll] Job %s marked as cancelled on server, stopping...\n", job.ExecutionId)
					m.CancelExecution(job.ExecutionId)
					return
				}
			}
		}
	}()

	result := m.exec.Execute(jobCtx, *job, stdout)
	
	fmt.Printf("[poll] Job finished — status: %s, exit code: %d\n", result.Status, result.ExitCode)

	report := models.JobResult{
		Status:     string(result.Status),
		ExitCode:   result.ExitCode,
		Error:      result.Error,
		StartedAt:  result.StartedAt,
		FinishedAt: result.FinishedAt,
	}

	if err := m.client.ReportResult(ctx, job.ExecutionId, report); err != nil {
		fmt.Printf("[poll] Failed to report result: %v\n", err)
	} else {
		fmt.Println("[poll] Result reported successfully.")
	}

	return nil
}
