import { Client, ConnectConfig, SFTPWrapper } from 'ssh2';
import * as net from 'net';

export class SshClient {
  private client: Client;
  private sftp: SFTPWrapper | null = null;
  private connected: boolean = false;
  private cwd: string = '';
  private activeForwards: Map<number, net.Server> = new Map();

  constructor() {
    this.client = new Client();
  }

  connect(config: ConnectConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client
        .on('ready', () => {
          this.connected = true;
          this.client.sftp((err, sftp) => {
            if (err) {
              this.client.end();
              reject(err);
              return;
            }
            this.sftp = sftp;
            
            this.client.exec('pwd', (err, stream) => {
                if (err) {
                    this.cwd = '~';
                    resolve();
                    return;
                }
                let output = '';
                stream.on('data', (data: any) => { output += data.toString(); })
                      .on('close', () => {
                          this.cwd = output.trim();
                          resolve();
                      });
            });
          });
        })
        .on('error', (err) => {
          this.connected = false;
          reject(err);
        })
        .on('end', () => {
          this.connected = false;
          this.sftp = null;
          this.stopAllForwards();
        })
        .connect(config);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.connected) {
      this.stopAllForwards();
      this.client.end();
      this.connected = false;
      this.sftp = null;
    }
  }

  getCwd(): string {
    return this.cwd;
  }

  private resolvePath(path: string): string {
      return path.startsWith('/') ? path : (this.cwd ? `${this.cwd}/${path}` : path);
  }

  async executeCommand(command: string, usePty: boolean = true, timeoutMs: number = 0): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve, reject) => {
      if (!this.connected) return reject(new Error('Not connected to VPS'));

      const wrappedCommand = this.cwd ? `cd "${this.cwd}" && ${command}` : command;

      this.client.exec(wrappedCommand, { pty: usePty }, (err, stream) => {
        if (err) return reject(err);
        
        let stdout = '';
        let stderr = '';
        let timeout: NodeJS.Timeout | null = null;
        let isFinished = false;

        if (timeoutMs > 0) {
            timeout = setTimeout(() => {
                if (!isFinished) {
                    isFinished = true;
                    stream.close();
                    resolve({ stdout: stdout + '\n[TIMEOUT EXCEEDED]', stderr, code: 124 });
                }
            }, timeoutMs);
        }

        stream
          .on('close', (code: number, signal: any) => {
            if (isFinished) return;
            isFinished = true;
            if (timeout) clearTimeout(timeout);
            resolve({ stdout, stderr, code });
          })
          .on('data', (data: any) => { stdout += data.toString(); })
          .stderr.on('data', (data: any) => { stderr += data.toString(); });
      });
    });
  }

  async changeDirectory(path: string): Promise<string> {
      const result = await this.executeCommand(`cd "${path}" && pwd`);
      if (result.code !== 0) throw new Error(`Failed to change directory: ${result.stderr || result.stdout || 'Unknown error'}`);
      this.cwd = result.stdout.trim().split('\n').pop() || '';
      return this.cwd;
  }

  listFiles(path: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.sftp) return reject(new Error('SFTP not available'));
      this.sftp.readdir(this.resolvePath(path), (err, list) => {
        if (err) reject(err);
        else resolve(list);
      });
    });
  }

  createDirectory(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sftp) return reject(new Error('SFTP not available'));
      this.sftp.mkdir(this.resolvePath(path), (err) => {
          if (err) reject(err);
          else resolve();
      });
    });
  }

  readFile(path: string): Promise<string> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.readFile(this.resolvePath(path), (err, buffer) => {
              if (err) reject(err);
              else resolve(buffer.toString());
          });
      });
  }

  writeFile(path: string, content: string): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.writeFile(this.resolvePath(path), content, (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  }

  async deleteItem(path: string): Promise<void> {
      const result = await this.executeCommand(`rm -rf "${path}"`);
      if (result.code !== 0) throw new Error(`Failed to delete item: ${result.stderr || result.stdout}`);
  }

  uploadFile(localPath: string, remotePath: string): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.fastPut(localPath, this.resolvePath(remotePath), (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  }

  downloadFile(remotePath: string, localPath: string): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.fastGet(this.resolvePath(remotePath), localPath, (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  }

  statFile(path: string): Promise<any> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.stat(this.resolvePath(path), (err, stats) => {
              if (err) reject(err);
              else resolve(stats);
          });
      });
  }

  changePermissions(path: string, mode: string | number): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          const numericMode = typeof mode === "string" ? parseInt(mode, 8) : mode;
          this.sftp.chmod(this.resolvePath(path), numericMode, (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  }

  changeOwnership(path: string, uid: number, gid: number): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.chown(this.resolvePath(path), uid, gid, (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  }

  // --- NEW PARAMIKO ADVANCED EQUIVALENTS ---

  renameItem(oldPath: string, newPath: string): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.rename(this.resolvePath(oldPath), this.resolvePath(newPath), (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  }

  createSymlink(targetPath: string, linkPath: string): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.symlink(targetPath, this.resolvePath(linkPath), (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  }

  readSymlink(linkPath: string): Promise<string> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.readlink(this.resolvePath(linkPath), (err, target) => {
              if (err) reject(err);
              else resolve(target);
          });
      });
  }

  truncateFile(path: string, size: number): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.sftp) return reject(new Error('SFTP not available'));
          this.sftp.setstat(this.resolvePath(path), { size }, (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  }

  startLocalPortForward(localPort: number, remoteHost: string, remotePort: number): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.connected) return reject(new Error('Not connected to VPS'));
          if (this.activeForwards.has(localPort)) return reject(new Error(`Port ${localPort} is already being forwarded`));

          const server = net.createServer((socket) => {
              this.client.forwardOut(
                  socket.remoteAddress || '127.0.0.1',
                  socket.remotePort || 0,
                  remoteHost,
                  remotePort,
                  (err, stream) => {
                      if (err) {
                          socket.end();
                          return;
                      }
                      socket.pipe(stream);
                      stream.pipe(socket);
                  }
              );
          });

          server.on('error', (err) => {
              this.activeForwards.delete(localPort);
              reject(err);
          });

          server.listen(localPort, '127.0.0.1', () => {
              this.activeForwards.set(localPort, server);
              resolve();
          });
      });
  }

  stopLocalPortForward(localPort: number): void {
      const server = this.activeForwards.get(localPort);
      if (server) {
          server.close();
          this.activeForwards.delete(localPort);
      } else {
          throw new Error(`No active port forward found on local port ${localPort}`);
      }
  }

  stopAllForwards(): void {
      for (const [port, server] of this.activeForwards.entries()) {
          server.close();
      }
      this.activeForwards.clear();
  }
}
