package heartbeat

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/eviltwin7648/devfleet-agent/internal/client"
	"github.com/eviltwin7648/devfleet-agent/internal/utils"
)

func Start(ctx context.Context, apiClient client.BackendClient, agentID string, wg *sync.WaitGroup) {
	defer wg.Done()
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	if err := sendHeartbeat(ctx, apiClient, agentID); err != nil {
		fmt.Println("[heartbeat] Initial error:", err)
	}

	for {
		select {
		case <-ctx.Done():
			fmt.Println("[heartbeat] Stopping loop...")
			return
		case <-ticker.C:
			if err := sendHeartbeat(ctx, apiClient, agentID); err != nil {
				fmt.Println("[heartbeat] Error:", err)
			}
		}
	}
}

func sendHeartbeat(ctx context.Context, apiClient client.BackendClient, agentID string) error {
	hi, err := utils.CollectHealthInfo()
	if err != nil {
		return fmt.Errorf("failed to collect health: %w", err)
	}

	err = apiClient.SendHeartbeat(ctx, agentID, hi)
	if err != nil {
		return err
	}

	return nil
}
