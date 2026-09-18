import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { SshClient } from './ssh.js';

dotenv.config();

const server = new Server(
  {
    name: 'vps-mcp',
    version: '6.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Manage multiple connections
const connections = new Map<string, SshClient>();

function getClient(connectionName?: string): SshClient {
    const name = connectionName || 'default';
    const client = connections.get(name);
    if (!client || !client.isConnected()) {
        throw new McpError(ErrorCode.InvalidRequest, `No active connection for '${name}'. Call connect_vps first.`);
    }
    return client;
}

const connectionProp = { connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' } };

// Define Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'connect_vps',
        description: 'Connect to a VPS via SSH. Supports managing multiple connections.',
        inputSchema: {
          type: 'object',
          properties: {
            host: { type: 'string', description: 'VPS Hostname or IP' },
            port: { type: 'number', description: 'SSH Port (default 22)' },
            username: { type: 'string', description: 'SSH Username' },
            password: { type: 'string', description: 'SSH Password (optional)' },
            privateKey: { type: 'string', description: 'SSH Private Key string or Path (optional)' },
            agentForward: { type: 'boolean', description: 'Whether to use SSH Agent forwarding' },
            connectionName: { type: 'string', description: 'Assign a name to this connection for multi-server orchestration (defaults to "default")' }
          },
          required: ['host', 'username'],
        },
      },
      {
        name: 'list_connections',
        description: 'List all active SSH connections managed by this MCP server.',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'disconnect_vps',
        description: 'Disconnect from a specific VPS session (or all if specified).',
        inputSchema: {
          type: 'object',
          properties: {
            ...connectionProp,
            all: { type: 'boolean', description: 'Disconnect all active sessions' }
          },
        },
      },
      {
        name: 'execute_command',
        description: 'Execute a shell command on the connected VPS and return the output. Uses PTY.',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'The shell command to execute' },
            usePty: { type: 'boolean', description: 'Allocate a pseudo-terminal (default true)' },
            ...connectionProp
          },
          required: ['command'],
        },
      },
      {
        name: 'list_directory',
        description: 'List contents of a directory on the VPS. Defaults to current working directory.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to list (relative to CWD or absolute).' },
            ...connectionProp
          },
        },
      },
      {
        name: 'create_directory',
        description: 'Create a new directory on the VPS.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path of the directory to create.' },
            ...connectionProp
          },
          required: ['path'],
        },
      },
      {
        name: 'read_file',
        description: 'Read the contents of a file on the VPS as text.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file.' },
            ...connectionProp
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: 'Create or overwrite a file on the VPS with text content.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file.' },
            content: { type: 'string', description: 'Content to write to the file.' },
            ...connectionProp
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'delete_item',
        description: 'Delete a file or directory on the VPS (recursive).',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file or directory to delete.' },
            ...connectionProp
          },
          required: ['path'],
        },
      },
      {
        name: 'change_directory',
        description: 'Change the current working directory on the VPS.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Target directory path.' },
            ...connectionProp
          },
          required: ['path'],
        },
      },
      {
        name: 'get_current_directory',
        description: 'Get the current working directory path.',
        inputSchema: {
          type: 'object',
          properties: { ...connectionProp },
        },
      },
      {
        name: 'upload_file',
        description: 'Upload a binary or text file from the local machine to the VPS (SFTP).',
        inputSchema: {
          type: 'object',
          properties: {
            localPath: { type: 'string', description: 'Absolute path to the local file.' },
            remotePath: { type: 'string', description: 'Path to the destination on the VPS.' },
            ...connectionProp
          },
          required: ['localPath', 'remotePath'],
        },
      },
      {
        name: 'download_file',
        description: 'Download a binary or text file from the VPS to the local machine (SFTP).',
        inputSchema: {
          type: 'object',
          properties: {
            remotePath: { type: 'string', description: 'Path to the file on the VPS.' },
            localPath: { type: 'string', description: 'Absolute path to save the file locally.' },
            ...connectionProp
          },
          required: ['remotePath', 'localPath'],
        },
      },
      {
        name: 'stat_file',
        description: 'Get file or directory attributes/stats on the VPS.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file or directory.' },
            ...connectionProp
          },
          required: ['path'],
        },
      },
      {
        name: 'change_permissions',
        description: 'Change file or directory permissions (chmod) on the VPS.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file or directory.' },
            mode: { type: 'string', description: 'Octal mode string (e.g., "755" or "644").' },
            ...connectionProp
          },
          required: ['path', 'mode'],
        },
      },
      {
        name: 'change_ownership',
        description: 'Change file or directory ownership (chown) on the VPS.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file or directory.' },
            uid: { type: 'number', description: 'User ID (UID).' },
            gid: { type: 'number', description: 'Group ID (GID).' },
            ...connectionProp
          },
          required: ['path', 'uid', 'gid'],
        },
      },
      {
        name: 'rename_item',
        description: 'Rename or move a file/directory via SFTP.',
        inputSchema: {
          type: 'object',
          properties: {
            oldPath: { type: 'string', description: 'Current path' },
            newPath: { type: 'string', description: 'New path' },
            ...connectionProp
          },
          required: ['oldPath', 'newPath']
        }
      },
      {
        name: 'create_symlink',
        description: 'Create a symbolic link via SFTP.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'The target the symlink points to' },
            linkPath: { type: 'string', description: 'The path of the new symlink' },
            ...connectionProp
          },
          required: ['targetPath', 'linkPath']
        }
      },
      {
        name: 'read_symlink',
        description: 'Read the target of a symbolic link via SFTP.',
        inputSchema: {
          type: 'object',
          properties: {
            linkPath: { type: 'string', description: 'The path of the symlink' },
            ...connectionProp
          },
          required: ['linkPath']
        }
      },
      {
        name: 'truncate_file',
        description: 'Truncate a file to a specific size via SFTP.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file' },
            size: { type: 'number', description: 'New file size in bytes' },
            ...connectionProp
          },
          required: ['path', 'size']
        }
      },
      {
        name: 'start_port_forward',
        description: 'Start a local TCP port forward to a remote destination (like ssh -L).',
        inputSchema: {
          type: 'object',
          properties: {
            localPort: { type: 'number', description: 'Local port to listen on' },
            remoteHost: { type: 'string', description: 'Remote host to forward to' },
            remotePort: { type: 'number', description: 'Remote port to forward to' },
            ...connectionProp
          },
          required: ['localPort', 'remoteHost', 'remotePort']
        }
      },
      {
        name: 'stop_port_forward',
        description: 'Stop an active local TCP port forward.',
        inputSchema: {
          type: 'object',
          properties: {
            localPort: { type: 'number', description: 'Local port that was listening' },
            ...connectionProp
          },
          required: ['localPort']
        }
      },
      
      // --- SYSADMIN COMMANDS ---
      {
        name: 'get_system_info',
        description: 'Get basic system information (OS, Uptime) from the VPS.',
        inputSchema: {
          type: 'object',
          properties: { ...connectionProp },
        }
      },
      {
        name: 'manage_service',
        description: 'Manage a systemd service (start, stop, restart, status, enable, disable).',
        inputSchema: {
          type: 'object',
          properties: {
            serviceName: { type: 'string', description: 'Name of the service' },
            action: { type: 'string', enum: ['start', 'stop', 'restart', 'status', 'enable', 'disable'] },
            ...connectionProp
          },
          required: ['serviceName', 'action']
        }
      },
      {
        name: 'get_hardware_info',
        description: 'Get full hardware and driver data from the VPS (CPU, RAM, Disk, Block Devices, PCI).',
        inputSchema: {
          type: 'object',
          properties: { ...connectionProp }
        }
      },
      {
        name: 'get_processes',
        description: 'Check Task Manager: list top running processes by CPU or RAM.',
        inputSchema: {
          type: 'object',
          properties: {
            sortBy: { type: 'string', enum: ['cpu', 'mem'], description: 'Sort processes by cpu or mem usage.' },
            limit: { type: 'number', description: 'Number of processes to return (default 20)' },
            ...connectionProp
          }
        }
      },
      {
        name: 'manage_docker',
        description: 'Manage Docker containers (list, start, stop, restart, logs, inspect).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['list', 'start', 'stop', 'restart', 'logs', 'inspect'] },
            containerId: { type: 'string', description: 'Container ID or Name (required for all actions except list)' },
            ...connectionProp
          },
          required: ['action']
        }
      },
      {
        name: 'manage_python',
        description: 'Manage Python environments (list packages, create venv, run script).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['list_packages', 'create_venv', 'run_script'] },
            target: { type: 'string', description: 'Path to venv (for list/create) or script (for run)' },
            ...connectionProp
          },
          required: ['action', 'target']
        }
      },
      {
        name: 'execute_sql',
        description: 'Execute a SQL query on a database via CLI tools (MySQL, PostgreSQL, SQLite).',
        inputSchema: {
          type: 'object',
          properties: {
            dbType: { type: 'string', enum: ['mysql', 'postgres', 'sqlite'] },
            query: { type: 'string', description: 'The SQL query to execute' },
            dbName: { type: 'string', description: 'Database name (or filepath for sqlite)' },
            user: { type: 'string', description: 'Database user (not needed for sqlite)' },
            password: { type: 'string', description: 'Database password (not needed for sqlite)' },
            ...connectionProp
          },
          required: ['dbType', 'query', 'dbName']
        }
      },

      // --- BRAND NEW: DEVELOPER & NODEJS SUITE (NVM, NPM, PM2, REDIS) ---
      {
        name: 'manage_nvm',
        description: 'Manage Node.js versions using NVM (Node Version Manager).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['install', 'use', 'list', 'current'] },
            version: { type: 'string', description: 'Node.js version (e.g., "20", "18.16.0"). Required for install/use.' },
            ...connectionProp
          },
          required: ['action']
        }
      },
      {
        name: 'manage_npm',
        description: 'Manage Node.js packages and scripts via NPM.',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['install', 'install_global', 'remove', 'run_script', 'init', 'audit'] },
            target: { type: 'string', description: 'Package name (for install/remove) or script name (for run_script).' },
            path: { type: 'string', description: 'Directory to run the npm command in. Defaults to CWD.' },
            ...connectionProp
          },
          required: ['action']
        }
      },
      {
        name: 'manage_pm2',
        description: 'Manage Node.js daemon processes using PM2.',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['list', 'start', 'stop', 'restart', 'logs', 'delete', 'save', 'flush'] },
            target: { type: 'string', description: 'App name, id, "all", or script path (for start)' },
            ...connectionProp
          },
          required: ['action']
        }
      },
      {
        name: 'manage_redis',
        description: 'Interact with Redis database via redis-cli.',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['info', 'keys', 'get', 'set', 'delete', 'flushall', 'raw'] },
            key: { type: 'string', description: 'Redis key (for get, set, delete) or pattern (for keys)' },
            value: { type: 'string', description: 'Redis value (for set)' },
            query: { type: 'string', description: 'Raw Redis command (for raw action, e.g., "HGETALL myhash")' },
            db: { type: 'number', description: 'Database index (default 0)' },
            ...connectionProp
          },
          required: ['action']
        }
      },

      // --- THE HOLY GRAIL SUITES ---
      {
        name: 'manage_git',
        description: 'Manage Git repositories (clone, pull, status, checkout).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['clone', 'pull', 'status', 'checkout'] },
            repo: { type: 'string', description: 'Repository URL (for clone)' },
            path: { type: 'string', description: 'Path to repository (for all actions)' },
            branch: { type: 'string', description: 'Branch name (for checkout)' },
            connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' }
          },
          required: ['action', 'path']
        }
      },
      {
        name: 'manage_firewall',
        description: 'Manage UFW Firewall (allow, deny, status, enable, disable).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['status', 'allow', 'deny', 'enable', 'disable'] },
            port: { type: 'string', description: 'Port number or service name (e.g. "80", "443", "ssh")' },
            protocol: { type: 'string', enum: ['tcp', 'udp', 'any'], description: 'Protocol (defaults to any)' },
            connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' }
          },
          required: ['action']
        }
      },
      {
        name: 'get_network_stats',
        description: 'View active network connections and listening ports (ss/netstat).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['listen', 'all'], description: 'Show listening ports or all connections' },
            connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' }
          },
          required: ['action']
        }
      },
      {
        name: 'manage_nginx',
        description: 'Manage NGINX Web Server (test, reload, restart, status).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['test', 'reload', 'restart', 'status'] },
            connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' }
          },
          required: ['action']
        }
      },
      {
        name: 'manage_ssl',
        description: 'Manage SSL Certificates with Certbot (issue, renew).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['issue', 'renew'] },
            domain: { type: 'string', description: 'Domain name for the certificate' },
            email: { type: 'string', description: 'Email for registration/recovery' },
            connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' }
          },
          required: ['action']
        }
      },
      {
        name: 'read_system_logs',
        description: 'Read system or service logs using journalctl.',
        inputSchema: {
          type: 'object',
          properties: {
            service: { type: 'string', description: 'Service name (e.g., nginx, docker). Leave empty for system logs.' },
            lines: { type: 'number', description: 'Number of lines to fetch (default 100)' },
            connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' }
          }
        }
      },
      {
        name: 'manage_cron',
        description: 'Manage Cron jobs (list, add, remove).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['list', 'add', 'remove'] },
            schedule: { type: 'string', description: 'Cron schedule expression (e.g., "0 0 * * *")' },
            command: { type: 'string', description: 'Command to execute (used for add, or as matching string for remove)' },
            connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' }
          },
          required: ['action']
        }
      },
      {
        name: 'manage_archive',
        description: 'Compress or extract archives (zip, tar.gz).',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['compress_zip', 'extract_zip', 'compress_tar', 'extract_tar'] },
            target: { type: 'string', description: 'Archive file path' },
            source: { type: 'string', description: 'Directory to compress, or extraction destination' },
            connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' }
          },
          required: ['action', 'target', 'source']
        }
      }

      ,{
        name: 'manage_pytest',
        description: 'Manage and run Python tests using pytest.',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['run', 'run_coverage', 'install'] },
            path: { type: 'string', description: 'Path to the test file or directory (required for run/run_coverage)' },
            args: { type: 'string', description: 'Additional pytest arguments (e.g., "-v -s")' },
            venvPath: { type: 'string', description: 'Path to virtual environment to activate first' },
            connectionName: { type: 'string', description: 'Name of the connection to use (defaults to "default")' }
          },
          required: ['action']
        }
      }

      ,{
        name: 'manage_packages',
        description: 'Install, remove, or update OS-level packages (apt, yum, apk).',
        inputSchema: {
          type: 'object',
          properties: {
            manager: { type: 'string', enum: ['apt', 'yum', 'apk'] },
            action: { type: 'string', enum: ['install', 'remove', 'update', 'upgrade'] },
            packages: { type: 'string', description: 'Space-separated list of packages (e.g., "git curl")' },
            connectionName: { type: 'string' }
          },
          required: ['manager', 'action']
        }
      },
      {
        name: 'run_background_job',
        description: 'Run, list, or kill background processes using tmux.',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['start', 'list', 'kill', 'logs'] },
            jobId: { type: 'string', description: 'Unique name for the background job/session' },
            command: { type: 'string', description: 'Command to run in background (for start)' },
            connectionName: { type: 'string' }
          },
          required: ['action']
        }
      },
      {
        name: 'dump_database',
        description: 'Securely create a database dump/backup (MySQL or PostgreSQL).',
        inputSchema: {
          type: 'object',
          properties: {
            dbType: { type: 'string', enum: ['mysql', 'postgres'] },
            dbName: { type: 'string', description: 'Database to backup' },
            outputFile: { type: 'string', description: 'Absolute path to save the backup file on the VPS' },
            user: { type: 'string', description: 'Database user' },
            password: { type: 'string', description: 'Database password' },
            connectionName: { type: 'string' }
          },
          required: ['dbType', 'dbName', 'outputFile']
        }
      }
    ],



  };
});

// Helper for NVM source
const NVM_SOURCE = `export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh";`;

// Handle Tool Calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case 'connect_vps': {
        const args = z
          .object({
            host: z.string(),
            port: z.number().default(22),
            username: z.string(),
            password: z.string().optional(),
            privateKey: z.string().optional(),
            agentForward: z.boolean().optional(),
            connectionName: z.string().default('default')
          })
          .parse(request.params.arguments);

        let sshClient = connections.get(args.connectionName);
        if (sshClient && sshClient.isConnected()) {
            sshClient.disconnect();
        }
        sshClient = new SshClient();
        connections.set(args.connectionName, sshClient);

        let agent = undefined;
        if (args.agentForward && process.env.SSH_AUTH_SOCK) {
            agent = process.env.SSH_AUTH_SOCK;
        }

        await sshClient.connect({
            host: args.host,
            port: args.port,
            username: args.username,
            password: args.password,
            privateKey: args.privateKey,
            agent: agent
        });

        return { content: [{ type: 'text', text: `Successfully connected to ${args.username}@${args.host} as '${args.connectionName}'. CWD: ${sshClient.getCwd()}` }] };
      }

      case 'list_connections': {
        const active = Array.from(connections.entries())
            .filter(([_, client]) => client.isConnected())
            .map(([name, client]) => `- ${name} (CWD: ${client.getCwd()})`);
        return { content: [{ type: 'text', text: active.length > 0 ? active.join('\n') : 'No active connections.' }] };
      }

      case 'disconnect_vps': {
        const args = z.object({ connectionName: z.string().default('default'), all: z.boolean().optional() }).parse(request.params.arguments);
        if (args.all) {
            let count = 0;
            for (const [name, client] of connections.entries()) {
                if (client.isConnected()) {
                    client.disconnect();
                    count++;
                }
            }
            connections.clear();
            return { content: [{ type: 'text', text: `Disconnected all ${count} active sessions.` }] };
        } else {
            const client = connections.get(args.connectionName);
            if (client && client.isConnected()) {
                client.disconnect();
                connections.delete(args.connectionName);
                return { content: [{ type: 'text', text: `Disconnected session '${args.connectionName}'.` }] };
            }
            return { content: [{ type: 'text', text: `No active session found named '${args.connectionName}'.` }] };
        }
      }

      case 'execute_command': {
        const args = z.object({ command: z.string(), usePty: z.boolean().default(true), connectionName: z.string().optional() }).parse(request.params.arguments);
        const result = await getClient(args.connectionName).executeCommand(args.command, args.usePty);
        return { content: [{ type: 'text', text: `STDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}\n\nExit Code: ${result.code}` }] };
      }

      case 'list_directory': {
        const args = z.object({ path: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        const files = await getClient(args.connectionName).listFiles(args.path || '.');
        const formattedList = files.map((f: any) => {
            const type = f.attrs.isDirectory() ? 'DIR' : f.attrs.isSymbolicLink() ? 'SYMLINK' : 'FILE';
            return `[${type}] ${f.filename} (Size: ${f.attrs.size})`;
        }).join('\n');
        return { content: [{ type: 'text', text: formattedList || '(Empty directory)' }] };
      }

      case 'create_directory': {
        const args = z.object({ path: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).createDirectory(args.path);
        return { content: [{ type: 'text', text: `Directory created: ${args.path}` }] };
      }

      case 'read_file': {
        const args = z.object({ path: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        const content = await getClient(args.connectionName).readFile(args.path);
        return { content: [{ type: 'text', text: content }] };
      }

      case 'write_file': {
        const args = z.object({ path: z.string(), content: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).writeFile(args.path, args.content);
        return { content: [{ type: 'text', text: `File written: ${args.path}` }] };
      }

      case 'delete_item': {
        const args = z.object({ path: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).deleteItem(args.path);
        return { content: [{ type: 'text', text: `Item deleted: ${args.path}` }] };
      }

      case 'change_directory': {
        const args = z.object({ path: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        const newCwd = await getClient(args.connectionName).changeDirectory(args.path);
        return { content: [{ type: 'text', text: `Changed directory to: ${newCwd}` }] };
      }

      case 'get_current_directory': {
        const args = z.object({ connectionName: z.string().optional() }).parse(request.params.arguments);
        return { content: [{ type: 'text', text: getClient(args.connectionName).getCwd() }] };
      }

      case 'upload_file': {
        const args = z.object({ localPath: z.string(), remotePath: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).uploadFile(args.localPath, args.remotePath);
        return { content: [{ type: 'text', text: `File uploaded from local ${args.localPath} to remote ${args.remotePath}` }] };
      }

      case 'download_file': {
        const args = z.object({ remotePath: z.string(), localPath: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).downloadFile(args.remotePath, args.localPath);
        return { content: [{ type: 'text', text: `File downloaded from remote ${args.remotePath} to local ${args.localPath}` }] };
      }

      case 'stat_file': {
        const args = z.object({ path: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        const stats = await getClient(args.connectionName).statFile(args.path);
        return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
      }

      case 'change_permissions': {
        const args = z.object({ path: z.string(), mode: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).changePermissions(args.path, args.mode);
        return { content: [{ type: 'text', text: `Permissions for ${args.path} changed to ${args.mode}` }] };
      }

      case 'change_ownership': {
        const args = z.object({ path: z.string(), uid: z.number(), gid: z.number(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).changeOwnership(args.path, args.uid, args.gid);
        return { content: [{ type: 'text', text: `Ownership for ${args.path} changed to UID:${args.uid} GID:${args.gid}` }] };
      }

      case 'rename_item': {
        const args = z.object({ oldPath: z.string(), newPath: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).renameItem(args.oldPath, args.newPath);
        return { content: [{ type: 'text', text: `Renamed ${args.oldPath} to ${args.newPath}` }] };
      }

      case 'create_symlink': {
        const args = z.object({ targetPath: z.string(), linkPath: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).createSymlink(args.targetPath, args.linkPath);
        return { content: [{ type: 'text', text: `Created symlink ${args.linkPath} pointing to ${args.targetPath}` }] };
      }

      case 'read_symlink': {
        const args = z.object({ linkPath: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        const target = await getClient(args.connectionName).readSymlink(args.linkPath);
        return { content: [{ type: 'text', text: `Symlink points to: ${target}` }] };
      }

      case 'truncate_file': {
        const args = z.object({ path: z.string(), size: z.number(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).truncateFile(args.path, args.size);
        return { content: [{ type: 'text', text: `File ${args.path} truncated to ${args.size} bytes` }] };
      }

      case 'start_port_forward': {
        const args = z.object({ localPort: z.number(), remoteHost: z.string(), remotePort: z.number(), connectionName: z.string().optional() }).parse(request.params.arguments);
        await getClient(args.connectionName).startLocalPortForward(args.localPort, args.remoteHost, args.remotePort);
        return { content: [{ type: 'text', text: `Started port forwarding: 127.0.0.1:${args.localPort} -> ${args.remoteHost}:${args.remotePort}` }] };
      }

      case 'stop_port_forward': {
        const args = z.object({ localPort: z.number(), connectionName: z.string().optional() }).parse(request.params.arguments);
        getClient(args.connectionName).stopLocalPortForward(args.localPort);
        return { content: [{ type: 'text', text: `Stopped port forwarding on local port ${args.localPort}` }] };
      }

      // --- SYSADMIN COMMANDS ---
      case 'get_system_info': {
        const args = z.object({ connectionName: z.string().optional() }).parse(request.params.arguments);
        const cmd = "echo '--- OS ---'; uname -a; echo '--- Uptime ---'; uptime;";
        const result = await getClient(args.connectionName).executeCommand(cmd, false);
        return { content: [{ type: 'text', text: result.stdout || result.stderr }] };
      }

      case 'manage_service': {
        const args = z.object({ serviceName: z.string(), action: z.enum(['start', 'stop', 'restart', 'status', 'enable', 'disable']), connectionName: z.string().optional() }).parse(request.params.arguments);
        const cmd = `sudo systemctl ${args.action} ${args.serviceName}`;
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `Executed: ${cmd}\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}\nCode: ${result.code}` }] };
      }

      case 'get_hardware_info': {
        const args = z.object({ connectionName: z.string().optional() }).parse(request.params.arguments);
        const cmd = `echo "=== CPU ==="; lscpu; echo "\\n=== RAM ==="; free -m; echo "\\n=== DISK ==="; df -h; echo "\\n=== BLOCK DEVICES ==="; lsblk; echo "\\n=== PCI DRIVERS ==="; lspci`;
        const result = await getClient(args.connectionName).executeCommand(cmd, false);
        return { content: [{ type: 'text', text: result.stdout || result.stderr }] };
      }

      case 'get_processes': {
        const args = z.object({ sortBy: z.enum(['cpu', 'mem']).default('cpu'), limit: z.number().default(20), connectionName: z.string().optional() }).parse(request.params.arguments);
        const sortFlag = args.sortBy === 'cpu' ? '-%cpu' : '-%mem';
        const cmd = `ps -eo pid,ppid,user,%cpu,%mem,start,time,command --sort=${sortFlag} | head -n ${args.limit + 1}`;
        const result = await getClient(args.connectionName).executeCommand(cmd, false);
        return { content: [{ type: 'text', text: result.stdout || result.stderr }] };
      }

      case 'manage_docker': {
        const args = z.object({ action: z.enum(['list', 'start', 'stop', 'restart', 'logs', 'inspect']), containerId: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = args.action === 'list' ? `docker ps -a` : `docker ${args.action === 'logs' ? 'logs --tail 100' : args.action} ${args.containerId}`;
        const result = await getClient(args.connectionName).executeCommand(`sudo ${cmd}`, true);
        return { content: [{ type: 'text', text: `Docker ${args.action} output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_python': {
        const args = z.object({ action: z.enum(['list_packages', 'create_venv', 'run_script']), target: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        if (args.action === 'list_packages') cmd = `source ${args.target}/bin/activate && pip freeze`;
        else if (args.action === 'create_venv') cmd = `python3 -m venv ${args.target}`;
        else if (args.action === 'run_script') cmd = `python3 ${args.target}`;
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `Python ${args.action} output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'execute_sql': {
        const args = z.object({ dbType: z.enum(['mysql', 'postgres', 'sqlite']), query: z.string(), dbName: z.string(), user: z.string().optional(), password: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        if (args.dbType === 'mysql') {
            const u = args.user ? `-u ${args.user}` : '';
            const p = args.password ? `-p${args.password}` : '';
            cmd = `mysql ${u} ${p} -D ${args.dbName} -e "${args.query.replace(/"/g, '\\"')}"`;
        } else if (args.dbType === 'postgres') {
            const u = args.user ? `-U ${args.user}` : '';
            const passEnv = args.password ? `PGPASSWORD='${args.password}' ` : '';
            cmd = `${passEnv}psql ${u} -d ${args.dbName} -c "${args.query.replace(/"/g, '\\"')}"`;
        } else if (args.dbType === 'sqlite') {
            cmd = `sqlite3 ${args.dbName} "${args.query.replace(/"/g, '\\"')}"`;
        }
        const result = await getClient(args.connectionName).executeCommand(cmd, false);
        return { content: [{ type: 'text', text: `SQL Query Output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      // --- NODE.JS / DEVELOPER SUITE ---
      case 'manage_nvm': {
        const args = z.object({ action: z.enum(['install', 'use', 'list', 'current']), version: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        if (args.action === 'list' || args.action === 'current') {
            cmd = `${NVM_SOURCE} nvm ${args.action}`;
        } else {
            if (!args.version) throw new McpError(ErrorCode.InvalidParams, `Version required for ${args.action}`);
            cmd = `${NVM_SOURCE} nvm ${args.action} ${args.version}`;
        }
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `NVM ${args.action} output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_npm': {
        const args = z.object({ action: z.enum(['install', 'install_global', 'remove', 'run_script', 'init', 'audit']), target: z.string().optional(), path: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = `${NVM_SOURCE} `;
        if (args.path) cmd += `cd "${args.path}" && `;
        
        switch (args.action) {
            case 'install': cmd += `npm install ${args.target || ''}`; break;
            case 'install_global': cmd += `npm install -g ${args.target}`; break;
            case 'remove': cmd += `npm uninstall ${args.target}`; break;
            case 'run_script': cmd += `npm run ${args.target}`; break;
            case 'init': cmd += `npm init -y`; break;
            case 'audit': cmd += `npm audit`; break;
        }
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `NPM ${args.action} output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_pm2': {
        const args = z.object({ action: z.enum(['list', 'start', 'stop', 'restart', 'logs', 'delete', 'save', 'flush']), target: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = `${NVM_SOURCE} npx pm2 ${args.action}`;
        if (['start', 'stop', 'restart', 'logs', 'delete'].includes(args.action)) {
            if (!args.target) throw new McpError(ErrorCode.InvalidParams, `Target required for ${args.action}`);
            cmd += ` ${args.target}`;
        }
        if (args.action === 'logs') cmd += ` --lines 100 --nostream`;
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `PM2 ${args.action} output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_redis': {
        const args = z.object({ action: z.enum(['info', 'keys', 'get', 'set', 'delete', 'flushall', 'raw']), key: z.string().optional(), value: z.string().optional(), query: z.string().optional(), db: z.number().default(0), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = `redis-cli -n ${args.db} `;
        switch (args.action) {
            case 'info': cmd += `INFO`; break;
            case 'keys': cmd += `KEYS "${args.key || '*'}"`; break;
            case 'get': cmd += `GET "${args.key}"`; break;
            case 'set': cmd += `SET "${args.key}" "${args.value}"`; break;
            case 'delete': cmd += `DEL "${args.key}"`; break;
            case 'flushall': cmd += `FLUSHALL`; break;
            case 'raw': cmd += args.query; break;
        }
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `Redis ${args.action} output:\n\n${result.stdout}\n${result.stderr}` }] };
      }


      // --- THE HOLY GRAIL SUITES ---
      case 'manage_git': {
        const args = z.object({ action: z.enum(['clone', 'pull', 'status', 'checkout']), repo: z.string().optional(), path: z.string(), branch: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        if (args.action === 'clone') {
            if (!args.repo) throw new McpError(ErrorCode.InvalidParams, "repo is required for clone");
            cmd = `git clone ${args.repo} "${args.path}"`;
        } else {
            cmd = `cd "${args.path}" && git ${args.action}`;
            if (args.action === 'checkout') {
                if (!args.branch) throw new McpError(ErrorCode.InvalidParams, "branch is required for checkout");
                cmd += ` ${args.branch}`;
            }
        }
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `Git ${args.action}:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_firewall': {
        const args = z.object({ action: z.enum(['status', 'allow', 'deny', 'enable', 'disable']), port: z.string().optional(), protocol: z.enum(['tcp', 'udp', 'any']).default('any'), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = `sudo ufw ${args.action}`;
        if (['allow', 'deny'].includes(args.action)) {
            if (!args.port) throw new McpError(ErrorCode.InvalidParams, "port is required for allow/deny");
            cmd += ` ${args.port}${args.protocol !== 'any' ? '/' + args.protocol : ''}`;
        }
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `UFW Firewall:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'get_network_stats': {
        const args = z.object({ action: z.enum(['listen', 'all']), connectionName: z.string().optional() }).parse(request.params.arguments);
        const flags = args.action === 'listen' ? '-tulpn' : '-tupn';
        const result = await getClient(args.connectionName).executeCommand(`sudo ss ${flags}`, true);
        return { content: [{ type: 'text', text: `Network Stats:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_nginx': {
        const args = z.object({ action: z.enum(['test', 'reload', 'restart', 'status']), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        if (args.action === 'test') cmd = `sudo nginx -t`;
        else cmd = `sudo systemctl ${args.action} nginx`;
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `NGINX ${args.action}:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_ssl': {
        const args = z.object({ action: z.enum(['issue', 'renew']), domain: z.string().optional(), email: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        if (args.action === 'issue') {
            if (!args.domain || !args.email) throw new McpError(ErrorCode.InvalidParams, "domain and email required to issue SSL");
            cmd = `sudo certbot --nginx -d ${args.domain} --non-interactive --agree-tos -m ${args.email}`;
        } else {
            cmd = `sudo certbot renew`;
        }
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `Certbot ${args.action}:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'read_system_logs': {
        const args = z.object({ service: z.string().optional(), lines: z.number().default(100), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = `sudo journalctl -n ${args.lines} --no-pager`;
        if (args.service) cmd += ` -u ${args.service}`;
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `System Logs:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_cron': {
        const args = z.object({ action: z.enum(['list', 'add', 'remove']), schedule: z.string().optional(), command: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        if (args.action === 'list') cmd = `crontab -l`;
        else if (args.action === 'add') {
            if (!args.schedule || !args.command) throw new McpError(ErrorCode.InvalidParams, "schedule and command required");
            cmd = `(crontab -l 2>/dev/null; echo "${args.schedule} ${args.command}") | crontab -`;
        } else if (args.action === 'remove') {
            if (!args.command) throw new McpError(ErrorCode.InvalidParams, "command required to remove cron");
            cmd = `crontab -l | grep -v "${args.command}" | crontab -`;
        }
        const result = await getClient(args.connectionName).executeCommand(cmd, false);
        return { content: [{ type: 'text', text: `Cron ${args.action}:\n\n${result.stdout || 'Success'}\n${result.stderr}` }] };
      }

      case 'manage_archive': {
        const args = z.object({ action: z.enum(['compress_zip', 'extract_zip', 'compress_tar', 'extract_tar']), target: z.string(), source: z.string(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        if (args.action === 'compress_zip') cmd = `zip -r "${args.target}" "${args.source}"`;
        else if (args.action === 'extract_zip') cmd = `unzip "${args.target}" -d "${args.source}"`;
        else if (args.action === 'compress_tar') cmd = `tar -czvf "${args.target}" -C "${args.source}" .`;
        else if (args.action === 'extract_tar') cmd = `tar -xzvf "${args.target}" -C "${args.source}"`;
        const result = await getClient(args.connectionName).executeCommand(cmd, false);
        return { content: [{ type: 'text', text: `Archive ${args.action}:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_pytest': {
        const args = z.object({
            action: z.enum(['run', 'run_coverage', 'install']),
            path: z.string().optional(),
            args: z.string().default(''),
            venvPath: z.string().optional(),
            connectionName: z.string().optional()
        }).parse(request.params.arguments);

        let cmd = '';
        const prefix = args.venvPath ? `source "${args.venvPath}/bin/activate" && ` : '';

        if (args.action === 'install') {
            cmd = `${prefix}pip install pytest pytest-cov`;
        } else {
            if (!args.path) throw new McpError(ErrorCode.InvalidParams, "path is required for run/run_coverage");
            if (args.action === 'run') {
                cmd = `${prefix}pytest ${args.args} "${args.path}"`;
            } else if (args.action === 'run_coverage') {
                cmd = `${prefix}pytest --cov="${args.path}" ${args.args} "${args.path}"`;
            }
        }
        
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `PyTest ${args.action} output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_packages': {
        const args = z.object({ manager: z.enum(['apt', 'yum', 'apk']), action: z.enum(['install', 'remove', 'update', 'upgrade']), packages: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        const mngr = args.manager === 'apt' ? 'apt-get' : args.manager;
        const autoYes = args.manager === 'apk' ? '' : '-y';
        
        if (args.action === 'update' || args.action === 'upgrade') {
            cmd = `sudo ${mngr} ${args.action} ${autoYes}`;
        } else {
            if (!args.packages) throw new McpError(ErrorCode.InvalidParams, "packages required for install/remove");
            cmd = `sudo ${mngr} ${args.action} ${autoYes} ${args.packages}`;
        }
        
        const result = await getClient(args.connectionName).executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `Package Manager Output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'run_background_job': {
        const args = z.object({ action: z.enum(['start', 'list', 'kill', 'logs']), jobId: z.string().optional(), command: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        
        if (args.action === 'list') {
            cmd = `tmux ls`;
        } else {
            if (!args.jobId) throw new McpError(ErrorCode.InvalidParams, "jobId required");
            if (args.action === 'start') {
                if (!args.command) throw new McpError(ErrorCode.InvalidParams, "command required to start");
                cmd = `tmux new-session -d -s "${args.jobId}" '${args.command}'`;
            } else if (args.action === 'kill') {
                cmd = `tmux kill-session -t "${args.jobId}"`;
            } else if (args.action === 'logs') {
                cmd = `tmux capture-pane -t "${args.jobId}" -p`;
            }
        }
        
        const result = await getClient(args.connectionName).executeCommand(cmd, false);
        return { content: [{ type: 'text', text: `Background Job ${args.action}:\n\n${result.stdout || 'Success'}\n${result.stderr}` }] };
      }

      case 'dump_database': {
        const args = z.object({ dbType: z.enum(['mysql', 'postgres']), dbName: z.string(), outputFile: z.string(), user: z.string().optional(), password: z.string().optional(), connectionName: z.string().optional() }).parse(request.params.arguments);
        let cmd = '';
        
        if (args.dbType === 'mysql') {
            const u = args.user ? `-u ${args.user}` : '';
            const p = args.password ? `-p${args.password}` : '';
            cmd = `mysqldump ${u} ${p} ${args.dbName} > "${args.outputFile}"`;
        } else {
            const u = args.user ? `-U ${args.user}` : '';
            const passEnv = args.password ? `PGPASSWORD='${args.password}' ` : '';
            cmd = `${passEnv}pg_dump ${u} -d ${args.dbName} -F c -f "${args.outputFile}"`;
        }
        
        const result = await getClient(args.connectionName).executeCommand(cmd, false);
        return { content: [{ type: 'text', text: `Database Dump:\n\n${result.stdout || 'Successfully dumped ' + args.dbName + ' to ' + args.outputFile}\n${result.stderr}` }] };
      }
      default:



        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.message}`);
    }
    return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
    }
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('VPS MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
