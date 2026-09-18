# VPS MCP Server (v15.0.0 - Ultimate Edition)

An advanced Model Context Protocol (MCP) server that empowers AI agents to seamlessly orchestrate, manage, and deploy to Virtual Private Servers (VPS) via SSH.

What started as a simple SSH wrapper has evolved into a **fully-fledged Systems Administration, Developer Operations & AI Tooling Suite**.

## 🌟 Key Features

- **Multi-Server Orchestration**: Connect to multiple servers simultaneously (e.g., DB Server, Web Server) and route commands natively.
- **Native SFTP Tooling**: Bypass clunky bash commands for file transfers. Supports deep SFTP operations like Posix renames, symlinks, truncation, permissions, and local <-> remote transfers.
- **Paramiko-Equivalent Functionality**: Features advanced SSH protocol capabilities including local port forwarding, Agent Forwarding, and interactive PTY allocation.
- **Developer-Ready Suites**: Natively manage Git, Docker, Node.js (NVM/NPM/PM2), Python (Venv/PyTest), SQL Databases, and Local AI (Ollama) securely via structured schemas.

### 🛠️ 12. Systems & SSH Expansion Suite (NEW!)
- **manage_ssh_keys**: Automatically generate and retrieve RSA or Ed25519 SSH keys directly on the VPS. Perfect for linking your VPS securely to GitHub or GitLab.
- **patch_file**: Apply native Unified Diffs (.patch) directly to source files on the server using the Unix patch command without overwriting the entire file.
- **manage_environment**: Safely inject or remove exported environment variables (like API Keys or $PATH extensions) directly into ~/.bashrc or globally via /etc/environment.

### 🎵 13. The G SERVER Suite (NEW!)
- **manage_lavalink**: A highly specialized tool requested to manage Lavalink music nodes. Run status to see the exact RAM usage of the Java process, logs to dump journalctl, or 
estart to bounce the music node without needing raw SSH tunnels!

### 💎 14. The AI Dream Compliance Suite (NEW!)
- **search_files**: Need to instantly find \VIEWS_REGISTERED\? This tool runs raw \grep -rn\ directly on the VPS to pinpoint code snippets across thousands of files.
- **manage_prisma**: Run \generate\, \db_push\, or \migrate_deploy\ to automatically sync your Next.js application schemas.
- **execute_sql (Schema Update)**: Added a new \get_schema\ action that instantly dumps the exact structure, tables, and column names of the database.

### 🤖 15. The Perfect DevOps & Discord Suite (NEW!)
- **manage_env_file**: Read .env files dynamically as parsed JSON, or safely inject/update tokens (like \DISCORD_TOKEN\) without ever corrupting the bash syntax.
- **manage_discord**: Natively validate if a Discord Bot token is alive, or force-clear stuck slash commands across the Discord API directly from the MCP.
- **Python Package Manager (manage_python)**: Added \install_package\ to instantly pip install missing dependencies (like \discord.py\) straight into your isolated \env\.

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

### 🏥 10. Reliability & Diagnostics Suite
- **`manage_swap`**: Does your tiny 1GB VPS crash when compiling Node apps or running Docker? Instantly create, enable, or remove swapfiles (e.g., `2G`) natively! 
- **`diagnose_network`**: Server offline? DNS issues? Instantly run `ping`, `traceroute`, or `dig` natively to figure out where connections are failing.
- **`inspect_process`**: Wraps `lsof` to securely inspect exactly which files, ports, and connections a specific process (PID) is locking or interacting with.
- **`manage_power`**: Natively run safe `reboot`, `shutdown`, or `uptime` commands to manage the physical/virtual state of your VPS node.

### 📡 11. Network & ISP Suite (NEW!)
- **`test_network_speed`**: Dynamically downloads and executes `speedtest-cli` to benchmark your server's exact Upload and Download bandwidth speeds against nearby speedtest nodes.
- **`check_public_ip`**: Fetches the precise Public IP address and associated Geo-IP location metrics (ISP, City, Country, Org) of the VPS node.
- **`scan_ports`**: Penetration testing and firewall auditing straight from the server! Quickly scan open ports on external targets (or `localhost`) using `netcat`.
- **`lookup_whois`**: Perform native WHOIS lookups to trace domain registrations directly from the VPS shell.

---

## 🔌 Universal AI Compatibility

This server is built on the official **Model Context Protocol (MCP)** standard using standard `stdio` transport. This means it is entirely LLM-agnostic and will seamlessly plug into almost any modern AI assistant, IDE, or CLI tool!

**Natively Supported Clients:**
- **Antigravity** (Google)
- **Claude Desktop** & **Claude Code (CLI)**
- **Cursor IDE** & **Windsurf**
- **Qwen** & Alibaba AI Agents
- **Codex** & OpenAI MCP Adapters
- **Any custom CLI** that supports the MCP `stdio` protocol!

### Example Configurations

**For UI Clients (Claude Desktop, Cursor, Antigravity, etc.):**
Add this to your MCP configuration JSON:
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

**For CLI Clients (Claude Code, Custom CLIs):**
Many CLI tools allow you to pass the server directly as a sub-process argument or via npx:
```bash
npx -y vps-mcp
```
*(The server runs headlessly and routes all tool requests instantly via standard input/output).*

## 💖 Support

If you find this project useful, consider supporting the original author on Patreon:

[![Patreon](https://img.shields.io/badge/Patreon-Donate-FF5722)](https://patreon.com/harjjot) or click [here](https://patreon.com/harjjot) to donate.
