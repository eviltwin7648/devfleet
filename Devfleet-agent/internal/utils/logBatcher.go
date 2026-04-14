//for every 1 second or 32KB of logs send to the Backend with the sequence number

//there is one hole in the system (if the request fails i lose logs, need to work something)

// each log should have its own sequence number
package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type LogEntry struct {
	Type      string `json:"type"`
	Content   string `json:"content"`
	Timestamp int    `json:"timestamp"`
	Sequence  int    `json:"sequence"`
}

type LogBatch struct {
	Logs     []LogEntry `json:"logs"`
	Sequence int        `json:"sequence"`
}

type LogBatcher struct {
	jobExecutionId string
	token          string
	url            string
	mu             sync.Mutex
	entries        []LogEntry
	bytes          int
	batchSeq       int
	logSeq         int
	//only one client (connection reuse)
	client *http.Client
	stop   chan struct{}
}

func NewLogBatcher(jobExecutionId string, token string, apiURL string) *LogBatcher {
	url := fmt.Sprintf("%s/api/v1/agent/execution/%s/logs", apiURL, jobExecutionId)

	b := &LogBatcher{
		jobExecutionId: jobExecutionId,
		token:          token,
		url:            url,
		stop:           make(chan struct{}),
		client:         &http.Client{Timeout: 5 * time.Second},
	}

	go b.flushLoop()
	return b
}

func (b *LogBatcher) WriteLog(logType, message string) {
	b.mu.Lock()
	b.logSeq++
	b.entries = append(b.entries, LogEntry{
		Type:      logType,
		Content:   message,
		Timestamp: int(time.Now().Unix()),
		Sequence:  b.logSeq,
	})
	b.bytes += len(message)

	shouldFlush := b.bytes >= 32*1024
	b.mu.Unlock()
	if shouldFlush {
		b.flush()
	}
}

func (b *LogBatcher) flushLoop() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			b.flush()
		case <-b.stop:
			b.flush()
			return
		}
	}
}

func (b *LogBatcher) flush() {
	b.mu.Lock()
	if len(b.entries) == 0 {
		b.mu.Unlock()
		return
	}

	batch := b.entries
	b.entries = nil
	b.bytes = 0
	b.batchSeq++
	seq := b.batchSeq
	b.mu.Unlock()

	payload := LogBatch{Logs: batch, Sequence: seq}
	jsonBody, err := json.Marshal(payload)
	if err != nil {
		fmt.Printf("[LogBatcher] Failed to marshal logs: %v\n", err)
		return
	}
	req, err := http.NewRequest("POST", b.url, bytes.NewBuffer(jsonBody))
	if err != nil {
		fmt.Printf("[LogBatcher] Failed to create request: %v\n", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+b.token)

	resp, err := b.client.Do(req)
	if err != nil {
		fmt.Printf("[LogBatcher] Failed to send logs: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// because the StatusOK only checks for 200. server coulld return something else(200-299)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		fmt.Printf("[LogBatcher] Failed to send logs: %v\n", resp.StatusCode)
		return
	}
}

func (b *LogBatcher) Stop() {
	close(b.stop)
}

type StreamWriter struct {
	batcher *LogBatcher
	logType string
}

func NewStreamWriter(batcher *LogBatcher, logType string) *StreamWriter {
	return &StreamWriter{
		batcher: batcher,
		logType: logType,
	}
}

// some sort of binding to the io.Writer interface
func (w *StreamWriter) Write(p []byte) (n int, err error) {
	w.batcher.WriteLog(w.logType, string(p))
	return len(p), nil
}
