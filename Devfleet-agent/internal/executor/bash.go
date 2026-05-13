package executor

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"time"

	"github.com/eviltwin7648/devfleet-agent/internal/models"
)

type BashExecutor struct{}

func NewBashExecutor() Executor {
	return &BashExecutor{}
}

func (e *BashExecutor) Execute(ctx context.Context, job models.Job, logWriter io.Writer) models.JobResult {
	start := time.Now()

	timeout := 10 * time.Minute
	if job.Definition.TimeoutSec > 0 {
		timeout = time.Duration(job.Definition.TimeoutSec) * time.Second
	}

	execCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	cmd := exec.CommandContext(execCtx, "bash", "-c", job.Definition.Script)

	cmd.Stdout = io.MultiWriter(os.Stdout, logWriter)
	cmd.Stderr = io.MultiWriter(os.Stderr, logWriter)

	cmd.Env = os.Environ()
	for k, v := range job.Definition.Env {
		cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", k, v))
	}

	if err := cmd.Start(); err != nil {
		return models.JobResult{
			Status:     "FAILED",
			Error:      err.Error(),
			StartedAt:  start,
			FinishedAt: time.Now(),
		}
	}

	err := cmd.Wait()
	end := time.Now()

	result := models.JobResult{
		StartedAt:  start,
		FinishedAt: end,
	}

	if execCtx.Err() == context.DeadlineExceeded {
		result.Status = "TIMEOUT"
		result.Error = "job timed out"
		return result
	}

	if execCtx.Err() == context.Canceled {
		if ctx.Err() == context.Canceled {
			result.Status = "CANCELLED"
			result.Error = "agent shutting down"
		} else {
			result.Status = "CANCELLED"
			result.Error = "job cancelled"
		}
		return result
	}

	if err != nil {
		result.Status = "FAILED"
		if cmd.ProcessState != nil {
			result.ExitCode = cmd.ProcessState.ExitCode()
		}
		result.Error = err.Error()
		return result
	}

	result.Status = "SUCCESS"
	result.ExitCode = cmd.ProcessState.ExitCode()
	return result
}
