package executor

import (
	"context"
	"io"

	"github.com/eviltwin7648/devfleet-agent/internal/models"
)

// Executor is an interface for running different types of jobs
type Executor interface {
	Execute(ctx context.Context, job models.Job, logWriter io.Writer) models.JobResult
}
