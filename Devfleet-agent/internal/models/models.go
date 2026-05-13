package models

import "time"

// MachineInfo represents the static metadata about the machine
type MachineInfo struct {
	OS       string `json:"os"`
	Arch     string `json:"arch"`
	Hostname string `json:"hostname"`
	TotalMem uint64 `json:"totalMem"`
}

// HealthInfo represents the dynamic status of the machine
type HealthInfo struct {
	CPUUsage  float64 `json:"cpuUsage"`
	MemUsage  float64 `json:"memUsage"`
	DiskUsage float64 `json:"diskUsage"`
}

// JobDefinition holds the script and config
type JobDefinition struct {
	ID         string            `json:"id"`
	Script     string            `json:"script"`
	Env        map[string]string `json:"env"`
	TimeoutSec int               `json:"timeoutSec"`
}

// Job represents a runnable job from the backend
type Job struct {
	ExecutionId string        `json:"id"`
	Status      string        `json:"status"`
	Definition  JobDefinition `json:"job"`
}

// LogEntry represents a single log line
type LogEntry struct {
	Type      string `json:"type"`
	Content   string `json:"content"`
	Timestamp int    `json:"timestamp"`
	Sequence  int    `json:"sequence"`
}

// LogBatch is a collection of log entries
type LogBatch struct {
	Logs     []LogEntry `json:"logs"`
	Sequence int        `json:"sequence"`
}

// JobResult represents the final status of a job execution
type JobResult struct {
	Status     string    `json:"status"`
	ExitCode   int       `json:"exit_code"`
	Error      string    `json:"error,omitempty"`
	Duration   string    `json:"duration,omitempty"`
	StartedAt  time.Time `json:"started_at"`
	FinishedAt time.Time `json:"finished_at"`
}
