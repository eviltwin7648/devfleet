package utils

import (
	"os"
	"runtime"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

type MachineInfo struct {
	OS       string `json:"os"`
	Arch     string `json:"arch"`
	Hostname string `json:"hostname"`
	TotalMem uint64 `json:"totalMem"`
}

// CollectMachineInfo gathers system metadata used during login, verify, heartbeat
func CollectMachineInfo() (MachineInfo, error) {
	hostname, _ := os.Hostname()

	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return MachineInfo{}, err
	}

	return MachineInfo{
		OS:       runtime.GOOS,
		Arch:     runtime.GOARCH,
		Hostname: hostname,
		TotalMem: memInfo.Total,
	}, nil
}

type HealthInfo struct {
	CPUUsage  float64 `json:"cpuUsage"`
	MemUsage  float64 `json:"memUsage"`
	DiskUsage float64 `json:"diskUsage"`
}

func CollectHealthInfo() (HealthInfo, error) {
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return HealthInfo{}, err
	}

	// We pass 0 as interval so it returns immediately (returns % since last call)
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

	return HealthInfo{
		CPUUsage:  cpuUsage,
		MemUsage:  memInfo.UsedPercent,
		DiskUsage: diskUsage,
	}, nil
}
