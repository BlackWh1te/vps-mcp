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
    version: '3.0.0',
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
      
      // --- NEW SYSADMIN SUITE ---
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

      // --- BRAND NEW: COMPREHENSIVE VPS MANAGEMENT SUITE ---
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
      }
    ],
  };
});

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

        return {
          content: [
            {
              type: 'text',
              text: `Successfully connected to ${args.username}@${args.host} as '${args.connectionName}'. CWD: ${sshClient.getCwd()}`,
            },
          ],
        };
      }

      case 'list_connections': {
        const active = Array.from(connections.entries())
            .filter(([_, client]) => client.isConnected())
            .map(([name, client]) => `- ${name} (CWD: ${client.getCwd()})`);
        
        return {
            content: [{ type: 'text', text: active.length > 0 ? active.join('\n') : 'No active connections.' }]
        };
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
        return {
          content: [{ type: 'text', text: `STDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}\n\nExit Code: ${result.code}` }],
        };
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
        const client = getClient(args.connectionName);
        const cmd = "echo '--- OS ---'; uname -a; echo '--- Uptime ---'; uptime;";
        const result = await client.executeCommand(cmd, false);
        return { content: [{ type: 'text', text: result.stdout || result.stderr }] };
      }

      case 'manage_service': {
        const args = z.object({ serviceName: z.string(), action: z.enum(['start', 'stop', 'restart', 'status', 'enable', 'disable']), connectionName: z.string().optional() }).parse(request.params.arguments);
        const client = getClient(args.connectionName);
        const cmd = `sudo systemctl ${args.action} ${args.serviceName}`;
        const result = await client.executeCommand(cmd, true); // PTY true to help with sudo if needed
        return { content: [{ type: 'text', text: `Executed: ${cmd}\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}\nCode: ${result.code}` }] };
      }

      // --- BRAND NEW: COMPREHENSIVE VPS MANAGEMENT SUITE ---

      case 'get_hardware_info': {
        const args = z.object({ connectionName: z.string().optional() }).parse(request.params.arguments);
        const client = getClient(args.connectionName);
        const cmd = `echo "=== CPU ==="; lscpu; echo "\\n=== RAM ==="; free -m; echo "\\n=== DISK ==="; df -h; echo "\\n=== BLOCK DEVICES ==="; lsblk; echo "\\n=== PCI DRIVERS ==="; lspci`;
        const result = await client.executeCommand(cmd, false);
        return { content: [{ type: 'text', text: result.stdout || result.stderr }] };
      }

      case 'get_processes': {
        const args = z.object({ sortBy: z.enum(['cpu', 'mem']).default('cpu'), limit: z.number().default(20), connectionName: z.string().optional() }).parse(request.params.arguments);
        const client = getClient(args.connectionName);
        const sortFlag = args.sortBy === 'cpu' ? '-%cpu' : '-%mem';
        const cmd = `ps -eo pid,ppid,user,%cpu,%mem,start,time,command --sort=${sortFlag} | head -n ${args.limit + 1}`;
        const result = await client.executeCommand(cmd, false);
        return { content: [{ type: 'text', text: result.stdout || result.stderr }] };
      }

      case 'manage_docker': {
        const args = z.object({
            action: z.enum(['list', 'start', 'stop', 'restart', 'logs', 'inspect']),
            containerId: z.string().optional(),
            connectionName: z.string().optional()
        }).parse(request.params.arguments);
        const client = getClient(args.connectionName);
        
        let cmd = '';
        if (args.action === 'list') {
            cmd = `docker ps -a`;
        } else {
            if (!args.containerId) throw new McpError(ErrorCode.InvalidParams, `containerId is required for action '${args.action}'`);
            if (args.action === 'logs') {
                cmd = `docker logs --tail 100 ${args.containerId}`;
            } else {
                cmd = `docker ${args.action} ${args.containerId}`;
            }
        }
        
        const result = await client.executeCommand(`sudo ${cmd}`, true);
        return { content: [{ type: 'text', text: `Docker ${args.action} output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'manage_python': {
        const args = z.object({
            action: z.enum(['list_packages', 'create_venv', 'run_script']),
            target: z.string(),
            connectionName: z.string().optional()
        }).parse(request.params.arguments);
        const client = getClient(args.connectionName);
        
        let cmd = '';
        if (args.action === 'list_packages') {
            cmd = `source ${args.target}/bin/activate && pip freeze`;
        } else if (args.action === 'create_venv') {
            cmd = `python3 -m venv ${args.target}`;
        } else if (args.action === 'run_script') {
            cmd = `python3 ${args.target}`;
        }
        
        const result = await client.executeCommand(cmd, true);
        return { content: [{ type: 'text', text: `Python ${args.action} output:\n\n${result.stdout}\n${result.stderr}` }] };
      }

      case 'execute_sql': {
        const args = z.object({
            dbType: z.enum(['mysql', 'postgres', 'sqlite']),
            query: z.string(),
            dbName: z.string(),
            user: z.string().optional(),
            password: z.string().optional(),
            connectionName: z.string().optional()
        }).parse(request.params.arguments);
        
        const client = getClient(args.connectionName);
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
        
        const result = await client.executeCommand(cmd, false);
        return { content: [{ type: 'text', text: `SQL Query Output:\n\n${result.stdout}\n${result.stderr}` }] };
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
