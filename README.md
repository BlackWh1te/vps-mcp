# VPS MCP Server (v22.0.0 - Ultimate Edition)

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

### 🏢 16. The Enterprise Big Tech Architecture (NEW!)
- **manage_n8n**: Export or import specific automation workflows natively using the 
px n8n CLI backend.
- **manage_nextjs**: Purge the .next/cache directory or instantly trigger a stream-ready 
pm run build.
- **get_recent_crashes**: The ultimate Error Aggregator. One command pulls the latest 50 priority-3 error logs from both journalctl (System) and pm2 logs --err (Node) simultaneously to instantly find the root cause of any outage.
- **manage_lavalink (REST Upgraded)**: Added 
est_stats action. Instead of parsing systemctl logs, this pings Lavalink's native /v4/stats API endpoint to return active players, memory allocation, and CPU load in precise JSON formatting!

### 🌩️ 17. The God-Tier SRE Suite (NEW!)
- **manage_fail2ban**: Active Intrusion Defense. Instantly view jailed malicious IPs, and manually ban/unban addresses that are scraping or brute-forcing your server.
- **nalyze_web_traffic**: Parses /var/log/nginx/access.log to generate a live report of the top 15 IP addresses and URLs hitting your server, catching DDoS attempts instantly.
- **manage_cloud_sync**: Integrates with 
clone to automatically sync your .sql.gz database backups offsite to AWS S3, Google Drive, or Cloudflare R2 for true disaster recovery.
- **db_optimize**: Hardcore DBA tooling. Triggers VACUUM FULL ANALYZE on Postgres or OPTIMIZE TABLE on MySQL to defragment storage, and parses pg_stat_statements to find exact slow queries.
- **	ail_live_logs**: True Observability. Opens a live 	ail -f stream on any log file for a specific duration (e.g. 15 seconds) to catch bugs exactly as users trigger them in real-time.

### 🌐 18. The Ultimate WebDev Suite (NEW!)
- **
un_npx_command**: A dedicated runner for arbitrary NPX workflows. Need to scaffold a project (
px create-next-app), push a schema (
px drizzle-kit push), or initialize Tailwind? The AI can now do it natively.
- **manage_nextjs (Supercharged)**: Now supports native 
pm run lint, ANALYZE=true npm run build for Webpack bundle analysis, and a dedicated shadcn_add action to instantly inject UI components via 
px shadcn-ui@latest add <component>.
- **manage_npm**: Existing, but fully featured NPM manager for install, install_global, udit, and 
un_script.

### ⚡ 19. The Fullstack WebDev Suite (NEW!)
- **manage_pnpm**: Full support for pnpm, the insanely fast, disk-efficient package manager taking over the Next.js and Monorepo ecosystem. Run install, dd, 
emove, and store_prune natively.
- **manage_drizzle**: The modern alternative to Prisma. Automatically execute 
px drizzle-kit generate, push, migrate, and even launch the studio headlessly over SSH to manage your schema.
- **manage_vite**: Perfect for React, Vue, and Svelte SPAs. Triggers highly optimized uild and preview workflows.
- **manage_linter**: Code messy? Trigger this tool to instantly blanket your entire project with 
px eslint . --fix or 
px prettier --write ..

### 🕵️‍♂️ 20. The Deep Kernel & Forensics Suite (NEW!)
- **	race_process**: Attach strace to any running process by PID to deeply profile its system calls in real-time. Crucial for debugging frozen apps, memory leaks, or unhandled exceptions at the kernel level.
- **nalyze_sockets**: Drops down to lsof and ss to map exactly which process is holding which port, preventing hidden port conflicts.
- **udit_system_security**: Need forensics? Scan for rootkits via chkrootkit, parse raw kernel OOM (Out-of-Memory) kills from the dmesg ring buffer, or track raw failed SSH login attempts in /var/log/auth.log.
- **docker_exec**: Go beyond starting/stopping containers—execute raw commands directly *inside* isolated Docker environments.

### 🎮🤖 21. The Gaming & AI Integration Suite (NEW!)
- **manage_rcon**: Administer remote game servers (Minecraft, Rust, Source Engine, Palworld) directly via RCON.
- **	est_llm_api**: Verify local or remote LLM endpoints (like vLLM, Ollama, LMStudio) by testing their OpenAI-compatible /v1/chat/completions API endpoints with dynamic base URLs.

### 🏢 22. The Enterprise SRE & AI Skills Suite (NEW!)
- **manage_volumes**: Native block storage mapping. List lsblk, mount, and unmount drives and block devices directly.
- **nalyze_binary**: If a daemon won't start, use ldd to hunt down missing .so shared libraries, or strings to reverse engineer broken binaries.
- **query_json_logs**: Natively run jq filters across massive 10GB JSON log files without crashing the LLM context window.
- **diagnose_dns**: Native dig integration to diagnose A, TXT, MX, and CNAME propagation across global resolvers.
- **manage_kubernetes**: Native kubectl integration. Get pods, deployments, services, describe resources, and tail pod logs natively.
- **manage_vps_skills**: The ultimate AI tool. Allows the AI to write, save, list, and execute permanent custom bash/python scripts persistently in ~/.vps-mcp-skills/. The AI can now build its own permanent server-side toolset!

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
