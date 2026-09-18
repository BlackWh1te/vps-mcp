# VPS MCP Server (v9.0.0 - Ultimate Edition)

An advanced Model Context Protocol (MCP) server that empowers AI agents to seamlessly orchestrate, manage, and deploy to Virtual Private Servers (VPS) via SSH.

What started as a simple SSH wrapper has evolved into a **fully-fledged Systems Administration, Developer Operations & AI Tooling Suite**.

## 🌟 Key Features

- **Multi-Server Orchestration**: Connect to multiple servers simultaneously (e.g., DB Server, Web Server) and route commands natively.
- **Native SFTP Tooling**: Bypass clunky bash commands for file transfers. Supports deep SFTP operations like Posix renames, symlinks, truncation, permissions, and local <-> remote transfers.
- **Paramiko-Equivalent Functionality**: Features advanced SSH protocol capabilities including local port forwarding, Agent Forwarding, and interactive PTY allocation.
- **Developer-Ready Suites**: Natively manage Git, Docker, Node.js (NVM/NPM/PM2), Python (Venv/PyTest), SQL Databases, and Local AI (Ollama) securely via structured schemas.

---

## 🛠️ Complete Tool Reference

All tools support an optional `connectionName` parameter to route commands when managing multiple VPS connections simultaneously.

### 🔌 1. Session Management
- **`connect_vps`**: Establish an SSH connection. Supports passwords, private keys, custom ports, and `agentForward`.
- **`disconnect_vps`**: Disconnect from a specific session or all sessions.
- **`list_connections`**: List all active SSH connections managed by this MCP.

### 📂 2. File System & SFTP
- **`list_directory`**, **`create_directory`**, **`change_directory`**, **`get_current_directory`**
- **`read_file`**, **`write_file`**, **`delete_item`**
- **`upload_file`**, **`download_file`**: Transfer files between your local host and the VPS.
- **`manage_archive`**: Compress or extract archives seamlessly (`zip`, `unzip`, `tar.gz`).
- **`stat_file`**, **`change_permissions`** (chmod), **`change_ownership`** (chown).
- **`rename_item`**, **`create_symlink`**, **`read_symlink`**, **`truncate_file`**.

### 💻 3. Command Execution & Tunneling
- **`execute_command`**: Run bash commands natively. Supports `usePty` for interactive shell allocation.
- **`run_background_job`**: Use `tmux` seamlessly behind the scenes to launch, list, kill, or tail logs of long-running background daemons.
- **`start_port_forward`**: Start a local TCP port forward to a remote destination (acts like `ssh -L`).
- **`stop_port_forward`**: Stop an active port forward.

### 🖥️ 4. Sysadmin & Monitoring
- **`get_system_info`**: Retrieve base OS and uptime data.
- **`get_hardware_info`**: Fetch deep hardware metrics via `lscpu`, `free -m`, `lsblk`, and `lspci`.
- **`get_processes`**: A native Task Manager! Fetches top running processes sorted by CPU or RAM.
- **`get_network_stats`**: View active network connections and listening ports via `ss -tulpn`.
- **`manage_packages`**: Automate OS package managers (`apt`, `yum`, `apk`) to install, remove, or upgrade system packages securely.
- **`manage_service`**: Wrap `systemctl` to start, stop, restart, or enable background services.
- **`manage_firewall`**: Wrap `ufw` to allow/deny specific ports and protocols.
- **`read_system_logs`**: Hook into `journalctl` to safely tail system or service logs without freezing the console.
- **`manage_cron`**: Safely list, add, or remove scheduled cron jobs.

### 🌐 5. Web Servers & Security
- **`manage_nginx`**: Test configuration syntax, reload, restart, or check NGINX status.
- **`manage_ssl`**: Issue new SSL certificates automatically using Certbot (`--nginx`) or renew existing ones.

### 🚀 6. Developer Ops (Docker & Databases)
- **`manage_docker`**: Natively list containers, start/stop/restart them, inspect configs, or securely tail logs.
- **`execute_sql`**: Execute raw SQL queries securely. Supports **MySQL**, **PostgreSQL**, and **SQLite**.
- **`dump_database`**: Generate `.sql` or Postgres backup dumps instantly utilizing native `mysqldump` / `pg_dump` securely via the MCP.
- **`manage_redis`**: Interface natively with Redis instances. Fetch keys, set/get values, flush DBs, or pass raw `redis-cli` commands.

### 📦 7. Language Environments (Node/Python/Git)
- **`manage_git`**: Clone repositories, pull updates, check status, and checkout branches securely.
- **`manage_nvm`**: Install and switch Node.js versions seamlessly (auto-sources `nvm.sh`).
- **`manage_npm`**: Install local/global packages, run NPM scripts, or audit modules.
- **`manage_pm2`**: Manage Node daemon processes via PM2. Start, stop, list, monitor logs, and save states.
- **`manage_python`**: Manage virtual environments, list pip packages, and run python scripts cleanly.
- **`manage_pytest`**: Orchestrate test suites. Includes automatic dependency installation (`pytest-cov`), targeted test running, and coverage report generation inside your specific virtual environments.

### 🤖 8. AI & API Testing Suite
- **`test_http_api`**: A built-in Postman equivalent! Natively execute API requests (`GET`, `POST`, `PUT`, `DELETE`) from the VPS. Perfect for testing internal app APIs, hitting LLM endpoints (OpenAI, Claude, Hermes), and debugging webhooks.
- **`manage_ollama`**: Spin up local AI directly on your VPS! Natively install Ollama, pull models (like `hermes`, `llama3`), run prompts, and manage the Ollama systemd server.
- **`benchmark_api`**: Load test your applications seamlessly using Apache Benchmark (`ab`). Pass concurrency and request counts to instantly gauge endpoint performance under load.

### 🏗️ 9. Infrastructure & Security Suite
- **`manage_users`**: Native control over VPS users. Create, delete, add to `sudo` groups, list all users, or seamlessly inject `authorized_keys` for SSH access directly from the MCP.
- **`search_files`**: Deep search for files wrapping `find` and `grep` natively. Search by filename patterns (`*.ts`) or scan directory contents for regex strings without worrying about bash escaping rules.
- **`analyze_disk_usage`**: Wraps `du -sh` to instantly figure out what is consuming disk space on the server. Analyze by depth and dynamically sort output to hunt down huge log files or docker images!

### 🏥 10. Reliability & Diagnostics Suite (NEW!)
- **`manage_swap`**: Does your tiny 1GB VPS crash when compiling Node apps or running Docker? Instantly create, enable, or remove swapfiles (e.g., `2G`) natively! 
- **`diagnose_network`**: Server offline? DNS issues? Instantly run `ping`, `traceroute`, or `dig` natively to figure out where connections are failing.
- **`inspect_process`**: Wraps `lsof` to securely inspect exactly which files, ports, and connections a specific process (PID) is locking or interacting with.
- **`manage_power`**: Natively run safe `reboot`, `shutdown`, or `uptime` commands to manage the physical/virtual state of your VPS node.

---

## ⚙️ Usage

Add the following configuration to your MCP client (e.g., Claude Desktop config file):

```json
{
  "mcpServers": {
    "vps-mcp": {
      "command": "npx",
      "args": ["-y", "vps-mcp"]
    }
  }
}
```

## 💖 Support

If you find this project useful, consider supporting the original author on Patreon:

[![Patreon](https://img.shields.io/badge/Patreon-Donate-FF5722)](https://patreon.com/harjjot) or click [here](https://patreon.com/harjjot) to donate.
