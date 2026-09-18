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
    version: '1.2.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const sshClient = new SshClient();

// Define Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'connect_vps',
        description: 'Connect to a VPS via SSH.',
        inputSchema: {
          type: 'object',
          properties: {
            host: { type: 'string', description: 'VPS Hostname or IP' },
            port: { type: 'number', description: 'SSH Port (default 22)' },
            username: { type: 'string', description: 'SSH Username' },
            password: { type: 'string', description: 'SSH Password (optional)' },
            privateKey: { type: 'string', description: 'SSH Private Key string or Path (optional)' },
            agentForward: { type: 'boolean', description: 'Whether to use SSH Agent forwarding' }
          },
          required: ['host', 'username'],
        },
      },
      {
        name: 'disconnect_vps',
        description: 'Disconnect from the current VPS session and stop all port forwards.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'execute_command',
        description: 'Execute a shell command on the connected VPS and return the output. Uses PTY.',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'The shell command to execute' },
            usePty: { type: 'boolean', description: 'Allocate a pseudo-terminal (default true)' }
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
          },
          required: ['path'],
        },
      },
      {
        name: 'get_current_directory',
        description: 'Get the current working directory path.',
        inputSchema: {
          type: 'object',
          properties: {},
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
          },
          required: ['path', 'uid', 'gid'],
        },
      },
      // NEW PARAMIKO EQUIVALENTS
      {
        name: 'rename_item',
        description: 'Rename or move a file/directory via SFTP.',
        inputSchema: {
          type: 'object',
          properties: {
            oldPath: { type: 'string', description: 'Current path' },
            newPath: { type: 'string', description: 'New path' },
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
          },
          required: ['localPort']
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
            agentForward: z.boolean().optional()
          })
          .parse(request.params.arguments);

        if (sshClient.isConnected()) {
            sshClient.disconnect();
        }

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
              text: `Successfully connected to ${args.username}@${args.host}. CWD: ${sshClient.getCwd()}`,
            },
          ],
        };
      }

      case 'disconnect_vps': {
        sshClient.disconnect();
        return { content: [{ type: 'text', text: 'Disconnected from VPS and stopped all port forwards.' }] };
      }

      case 'execute_command': {
        const args = z.object({ command: z.string(), usePty: z.boolean().default(true) }).parse(request.params.arguments);
        const result = await sshClient.executeCommand(args.command, args.usePty);
        return {
          content: [
            {
              type: 'text',
              text: `STDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}\n\nExit Code: ${result.code}`,
            },
          ],
        };
      }

      case 'list_directory': {
        const args = z.object({ path: z.string().optional() }).parse(request.params.arguments);
        const files = await sshClient.listFiles(args.path || '.');
        const formattedList = files.map(f => {
            const type = f.attrs.isDirectory() ? 'DIR' : f.attrs.isSymbolicLink() ? 'SYMLINK' : 'FILE';
            return `[${type}] ${f.filename} (Size: ${f.attrs.size})`;
        }).join('\n');
        return { content: [{ type: 'text', text: formattedList || '(Empty directory)' }] };
      }

      case 'create_directory': {
        const args = z.object({ path: z.string() }).parse(request.params.arguments);
        await sshClient.createDirectory(args.path);
        return { content: [{ type: 'text', text: `Directory created: ${args.path}` }] };
      }

      case 'read_file': {
        const args = z.object({ path: z.string() }).parse(request.params.arguments);
        const content = await sshClient.readFile(args.path);
        return { content: [{ type: 'text', text: content }] };
      }

      case 'write_file': {
        const args = z.object({ path: z.string(), content: z.string() }).parse(request.params.arguments);
        await sshClient.writeFile(args.path, args.content);
        return { content: [{ type: 'text', text: `File written: ${args.path}` }] };
      }

      case 'delete_item': {
        const args = z.object({ path: z.string() }).parse(request.params.arguments);
        await sshClient.deleteItem(args.path);
        return { content: [{ type: 'text', text: `Item deleted: ${args.path}` }] };
      }

      case 'change_directory': {
        const args = z.object({ path: z.string() }).parse(request.params.arguments);
        const newCwd = await sshClient.changeDirectory(args.path);
        return { content: [{ type: 'text', text: `Changed directory to: ${newCwd}` }] };
      }

      case 'get_current_directory': {
        return { content: [{ type: 'text', text: sshClient.getCwd() }] };
      }

      case 'upload_file': {
        const args = z.object({ localPath: z.string(), remotePath: z.string() }).parse(request.params.arguments);
        await sshClient.uploadFile(args.localPath, args.remotePath);
        return { content: [{ type: 'text', text: `File uploaded from local ${args.localPath} to remote ${args.remotePath}` }] };
      }

      case 'download_file': {
        const args = z.object({ remotePath: z.string(), localPath: z.string() }).parse(request.params.arguments);
        await sshClient.downloadFile(args.remotePath, args.localPath);
        return { content: [{ type: 'text', text: `File downloaded from remote ${args.remotePath} to local ${args.localPath}` }] };
      }

      case 'stat_file': {
        const args = z.object({ path: z.string() }).parse(request.params.arguments);
        const stats = await sshClient.statFile(args.path);
        return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
      }

      case 'change_permissions': {
        const args = z.object({ path: z.string(), mode: z.string() }).parse(request.params.arguments);
        await sshClient.changePermissions(args.path, args.mode);
        return { content: [{ type: 'text', text: `Permissions for ${args.path} changed to ${args.mode}` }] };
      }

      case 'change_ownership': {
        const args = z.object({ path: z.string(), uid: z.number(), gid: z.number() }).parse(request.params.arguments);
        await sshClient.changeOwnership(args.path, args.uid, args.gid);
        return { content: [{ type: 'text', text: `Ownership for ${args.path} changed to UID:${args.uid} GID:${args.gid}` }] };
      }

      case 'rename_item': {
        const args = z.object({ oldPath: z.string(), newPath: z.string() }).parse(request.params.arguments);
        await sshClient.renameItem(args.oldPath, args.newPath);
        return { content: [{ type: 'text', text: `Renamed ${args.oldPath} to ${args.newPath}` }] };
      }

      case 'create_symlink': {
        const args = z.object({ targetPath: z.string(), linkPath: z.string() }).parse(request.params.arguments);
        await sshClient.createSymlink(args.targetPath, args.linkPath);
        return { content: [{ type: 'text', text: `Created symlink ${args.linkPath} pointing to ${args.targetPath}` }] };
      }

      case 'read_symlink': {
        const args = z.object({ linkPath: z.string() }).parse(request.params.arguments);
        const target = await sshClient.readSymlink(args.linkPath);
        return { content: [{ type: 'text', text: `Symlink points to: ${target}` }] };
      }

      case 'truncate_file': {
        const args = z.object({ path: z.string(), size: z.number() }).parse(request.params.arguments);
        await sshClient.truncateFile(args.path, args.size);
        return { content: [{ type: 'text', text: `File ${args.path} truncated to ${args.size} bytes` }] };
      }

      case 'start_port_forward': {
        const args = z.object({ localPort: z.number(), remoteHost: z.string(), remotePort: z.number() }).parse(request.params.arguments);
        await sshClient.startLocalPortForward(args.localPort, args.remoteHost, args.remotePort);
        return { content: [{ type: 'text', text: `Started port forwarding: 127.0.0.1:${args.localPort} -> ${args.remoteHost}:${args.remotePort}` }] };
      }

      case 'stop_port_forward': {
        const args = z.object({ localPort: z.number() }).parse(request.params.arguments);
        sshClient.stopLocalPortForward(args.localPort);
        return { content: [{ type: 'text', text: `Stopped port forwarding on local port ${args.localPort}` }] };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.message}`);
    }
    return {
        content: [
            {
                type: 'text',
                text: `Error: ${error.message}`,
            }
        ],
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
