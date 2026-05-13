package utils

import (
	"os"
	"runtime"

	"github.com/eviltwin7648/devfleet-agent/internal/models"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

// CollectMachineInfo gathers system metadata
func CollectMachineInfo() (models.MachineInfo, error) {
	hostname, _ := os.Hostname()

	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return models.MachineInfo{}, err
	}

	return models.MachineInfo{
		OS:       runtime.GOOS,
		Arch:     runtime.GOARCH,
		Hostname: hostname,
		TotalMem: memInfo.Total,
	}, nil
}

func CollectHealthInfo() (models.HealthInfo, error) {
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return models.HealthInfo{}, err
	}

	cpuPercents, err := cpu.Percent(0, false)
	cpuUsage := 0.0
	if err == nil && len(cpuPercents) > 0 {
		cpuUsage = cpuPercents[0]
	}

	diskUsage := 0.0
	diskInfo, err := disk.Usage("/")
	if err == nil {
		diskUsage = diskInfo.UsedPercent
	}

	return models.HealthInfo{
		CPUUsage:  cpuUsage,
		MemUsage:  memInfo.UsedPercent,
		DiskUsage: diskUsage,
	}, nil
}
