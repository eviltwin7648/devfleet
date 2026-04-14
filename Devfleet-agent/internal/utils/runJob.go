package utils

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"time"
)

type JobStatus string

const (
	JobSuccess   JobStatus = "SUCCESS"
	JobFailed    JobStatus = "FAILED"
	JobRunning   JobStatus = "RUNNING"
	JobTimeout   JobStatus = "TIMEOUT"
	JobCancelled JobStatus = "CANCELLED"
)

var (
	// ActiveJobs tracks running job executions and their cancellation functions
	activeJobs = make(map[string]context.CancelFunc)
)

// CancelJob signals a running job to stop
func CancelJob(executionId string) {
	if cancel, ok := activeJobs[executionId]; ok {
		fmt.Printf("[CancelJob] Signaling cancellation for execution ID: %s\n", executionId)
		cancel()
	}
}

type JobResult struct {

	ExitCode   int
	Stdout     string
	Stderr     string
	Duration   time.Duration
	Status     JobStatus
	StartedAt  time.Time
	FinishedAt time.Time
	Error      string
}

// JobDefinition holds the script and config, nested inside a JobExecution from the backend.
type JobDefinition struct {
	ID         string            `json:"id"`
	Script     string            `json:"script"`
	Env        map[string]string `json:"env"`
	TimeoutSec int               `json:"timeoutSec"`
}

// Job represents the JobExecution returned by the backend /jobs/pull endpoint.
// The script lives inside the nested JobDefinition (field "job").
type Job struct {
	ExecutionId string        `json:"id"`
	Status      string        `json:"status"`
	Definition  JobDefinition `json:"job"` // nested JobDefinition
}

func RunJob(job Job, token string, apiURL string) JobResult {
	start := time.Now()

	// Default timeout 10 minutes if not specified
	timeout := 10 * time.Minute
	if job.Definition.TimeoutSec > 0 {
		timeout = time.Duration(job.Definition.TimeoutSec) * time.Second
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Register the job for potential external cancellation
	activeJobs[job.ExecutionId] = cancel
	defer delete(activeJobs, job.ExecutionId)

	fmt.Printf("[RunJob] Executing script for job execution ID %s: %q\n", job.ExecutionId, job.Definition.Script)

	cmd := exec.CommandContext(ctx, "bash", "-c", job.Definition.Script)

	// Set up LogBatcher
	batcher := NewLogBatcher(job.ExecutionId, token, apiURL)
	defer batcher.Stop()

	//for streaming the logs
	stdoutWriter := NewStreamWriter(batcher, "STDOUT")
	stderrWriter := NewStreamWriter(batcher, "STDERR")

	//keep in memory to send with final job result.()
	var memStdout, memStderr bytes.Buffer
	// MultiWriter to save to Memory (for final result POST) and stream to Backend
	cmd.Stdout = os.Stdout // For agent's terminal logs if wanted, but better to io.MultiWriter
	cmd.Stdout = io.MultiWriter(&memStdout, stdoutWriter)
	cmd.Stderr = io.MultiWriter(&memStderr, stderrWriter)

	// Set environment variables
	cmd.Env = os.Environ()
	for k, v := range job.Definition.Env {
		cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", k, v))
	}

	if err := cmd.Start(); err != nil {
		return JobResult{
			Status:     JobFailed,
			Error:      err.Error(),
			StartedAt:  start,
			FinishedAt: time.Now(),
		}
	}

	err := cmd.Wait()
	end := time.Now()

	result := JobResult{
		Stdout:     memStdout.String(),
		Stderr:     memStderr.String(),
		StartedAt:  start,
		FinishedAt: end,
		Duration:   end.Sub(start),
	}

	if ctx.Err() == context.DeadlineExceeded {
		result.Status = JobTimeout
		result.Error = "job timed out"
		return result
	}

	if ctx.Err() == context.Canceled {
		result.Status = JobCancelled
		result.Error = "job cancelled by user"
		return result
	}


	if err != nil {
		result.Status = JobFailed
		if cmd.ProcessState != nil {
			result.ExitCode = cmd.ProcessState.ExitCode()
		}
		result.Error = err.Error()
		return result
	}

	result.Status = JobSuccess
	result.ExitCode = cmd.ProcessState.ExitCode()
	return result
}
