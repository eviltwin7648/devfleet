package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Config struct {
	APIKey  string `json:"api_key"`
	AgentID string `json:"agent_id"`
	APIURL  string `json:"api_url"`
}

func ConfigPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".devfleet", "config.json")
}

func SaveKey(key, agentID, apiURL string) error {
	cfg, err := LoadKey()
	if err != nil {
		// If it doesn't exist, start fresh
		cfg = &Config{}
	}

	if key != "" {
		cfg.APIKey = key
	}
	if agentID != "" {
		cfg.AgentID = agentID
	}
	if apiURL != "" {
		cfg.APIURL = apiURL
	}

	data, err := json.MarshalIndent(cfg, "", " ")
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(ConfigPath()), 0755); err != nil {
		return err
	}
	return os.WriteFile(ConfigPath(), data, 0600)
}


func LoadKey() (*Config, error) {
	data, err := os.ReadFile(ConfigPath())

	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
