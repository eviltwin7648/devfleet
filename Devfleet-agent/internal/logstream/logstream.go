package logstream

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/eviltwin7648/devfleet-agent/internal/client"
	"github.com/eviltwin7648/devfleet-agent/internal/models"
)

const (
	MaxMemoryBufferSize = 50 * 1024 * 1024 // 50MB
	BatchSizeThreshold  = 32 * 1024        // 32KB
)

type LogBatcher struct {
	executionID string
	client      client.BackendClient
	mu          sync.Mutex

	// Accumulating batch
	entries []models.LogEntry
	bytes   int

	// Memory queue for retries
	queue            []models.LogBatch
	totalQueuedBytes int

	batchSeq int
	logSeq   int
	stop     chan struct{}
	wg       sync.WaitGroup

	// Disk spill
	spillDir string
	workCond *sync.Cond
}

func NewLogBatcher(executionID string, apiClient client.BackendClient) *LogBatcher {
	home, _ := os.UserHomeDir()
	spillDir := filepath.Join(home, ".devfleet", "logs", executionID)

	b := &LogBatcher{
		executionID: executionID,
		client:      apiClient,
		stop:        make(chan struct{}),
		spillDir:    spillDir,
	}
	b.workCond = sync.NewCond(&b.mu)

	b.wg.Add(2)
	go b.flushLoop()
	go b.sendWorker()

	return b
}

func (b *LogBatcher) WriteLog(logType, message string) {
	b.mu.Lock()
	b.logSeq++
	b.entries = append(b.entries, models.LogEntry{
		Type:      logType,
		Content:   message,
		Timestamp: int(time.Now().Unix()),
		Sequence:  b.logSeq,
	})
	b.bytes += len(message)

	shouldFlush := b.bytes >= BatchSizeThreshold
	b.mu.Unlock()
	if shouldFlush {
		b.flush()
	}
}

func (b *LogBatcher) flushLoop() {
	defer b.wg.Done()
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
	defer b.mu.Unlock()

	if len(b.entries) == 0 {
		return
	}

	b.batchSeq++
	batch := models.LogBatch{
		Logs:     b.entries,
		Sequence: b.batchSeq,
	}

	batchSize := b.bytes
	b.entries = nil
	b.bytes = 0

	if b.totalQueuedBytes+batchSize > MaxMemoryBufferSize {
		err := b.spillToDisk(batch)
		if err != nil {
			fmt.Printf("[LogBatcher] Disk spill failed: %v\n", err)
			// If disk fails too, we lose logs. valid for now
		}
	} else {
		b.queue = append(b.queue, batch)
		b.totalQueuedBytes += batchSize
	}

	b.workCond.Signal()
}

func (b *LogBatcher) spillToDisk(batch models.LogBatch) error {
	if err := os.MkdirAll(b.spillDir, 0755); err != nil {
		return err
	}

	filename := filepath.Join(b.spillDir, fmt.Sprintf("batch_%010d.json", batch.Sequence))
	data, err := json.Marshal(batch)
	if err != nil {
		return err
	}

	return os.WriteFile(filename, data, 0644)
}

func (b *LogBatcher) sendWorker() {
	defer b.wg.Done()

	backoff := 1 * time.Second
	maxBackoff := 30 * time.Second

	for {
		b.mu.Lock()
		for len(b.queue) == 0 && !b.isStopping() {
			// Check disk if memory is empty
			if b.hasDiskBatches() {
				batch, size, err := b.loadOldestFromDisk()
				if err == nil {
					b.queue = append(b.queue, *batch)
					b.totalQueuedBytes += size
					break
				}
			}
			b.workCond.Wait()
		}

		if len(b.queue) == 0 && b.isStopping() {
			b.mu.Unlock()
			return
		}

		batch := b.queue[0]
		b.mu.Unlock()

		// Attempt to send
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		err := b.client.StreamLogs(ctx, b.executionID, batch)
		cancel()

		if err == nil {
			// Success!
			b.mu.Lock()
			b.queue = b.queue[1:]
			// Recalculate size properly or keep track better.
			// For simplicity, we can just estimate size of removed batch
			removedSize := 0
			for _, entry := range batch.Logs {
				removedSize += len(entry.Content)
			}
			b.totalQueuedBytes -= removedSize
			if b.totalQueuedBytes < 0 {
				b.totalQueuedBytes = 0
			}

			// If it was a disk batch, cleanup
			b.cleanupDisk(batch.Sequence)

			backoff = 1 * time.Second
			b.mu.Unlock()
		} else {
			// Failure - wait and retry
			fmt.Printf("[LogBatcher] Failed to stream logs (seq %d): %v. Retrying in %v...\n", batch.Sequence, err, backoff)

			select {
			case <-time.After(backoff):
				backoff *= 2
				if backoff > maxBackoff {
					backoff = maxBackoff
				}
			case <-b.stop:
				// If stopping, maybe spill remaining memory to disk?
				b.spillAllRemaining()
				return
			}
		}
	}
}

func (b *LogBatcher) isStopping() bool {
	select {
	case <-b.stop:
		return true
	default:
		return false
	}
}

func (b *LogBatcher) hasDiskBatches() bool {
	files, err := os.ReadDir(b.spillDir)
	if err != nil || len(files) == 0 {
		return false
	}
	for _, f := range files {
		if !f.IsDir() && strings.HasPrefix(f.Name(), "batch_") && strings.HasSuffix(f.Name(), ".json") {
			return true
		}
	}
	return false
}

func (b *LogBatcher) loadOldestFromDisk() (*models.LogBatch, int, error) {
	files, err := os.ReadDir(b.spillDir)
	if err != nil || len(files) == 0 {
		return nil, 0, fmt.Errorf("no disk batches")
	}

	var batchFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasPrefix(f.Name(), "batch_") && strings.HasSuffix(f.Name(), ".json") {
			batchFiles = append(batchFiles, f.Name())
		}
	}

	if len(batchFiles) == 0 {
		return nil, 0, fmt.Errorf("no disk batches")
	}

	sort.Strings(batchFiles)
	oldest := batchFiles[0]

	data, err := os.ReadFile(filepath.Join(b.spillDir, oldest))
	if err != nil {
		return nil, 0, err
	}

	var batch models.LogBatch
	if err := json.Unmarshal(data, &batch); err != nil {
		return nil, 0, err
	}

	return &batch, len(data), nil
}

func (b *LogBatcher) cleanupDisk(seq int) {
	filename := filepath.Join(b.spillDir, fmt.Sprintf("batch_%010d.json", seq))
	os.Remove(filename)
}

func (b *LogBatcher) spillAllRemaining() {
	b.mu.Lock()
	defer b.mu.Unlock()

	for _, batch := range b.queue {
		b.spillToDisk(batch)
	}
	b.queue = nil
	b.totalQueuedBytes = 0
}

func (b *LogBatcher) Stop() {
	close(b.stop)
	b.mu.Lock()
	b.workCond.Broadcast() // Wake up worker if it's waiting
	b.mu.Unlock()
	b.wg.Wait()
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

func (w *StreamWriter) Write(p []byte) (n int, err error) {
	w.batcher.WriteLog(w.logType, string(p))
	return len(p), nil
}

func Bind(executionID string, apiClient client.BackendClient) (*LogBatcher, io.Writer, io.Writer) {
	batcher := NewLogBatcher(executionID, apiClient)
	stdout := NewStreamWriter(batcher, "STDOUT")
	stderr := NewStreamWriter(batcher, "STDERR")
	return batcher, stdout, stderr
}
