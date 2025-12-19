import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { Logger } from '../utils/logger';
import { Config } from '../utils/config';

export class WorkspaceManager {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Get the default Cursor workspace storage path based on the OS
   */
  getDefaultWorkspacePath(): string {
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
      case 'win32':
        return path.join(process.env.APPDATA || '', 'Cursor', 'User', 'workspaceStorage');
      case 'darwin':
        return path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'User', 'workspaceStorage');
      case 'linux':
        return path.join(homeDir, '.config', 'Cursor', 'User', 'workspaceStorage');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Get the workspace path to use (custom or default)
   */
  getWorkspacePath(): string {
    const customPath = Config.getCustomWorkspacePath();
    
    if (customPath && customPath.trim() !== '') {
      this.logger.info(`Using custom workspace path: ${customPath}`);
      return customPath;
    }

    const defaultPath = this.getDefaultWorkspacePath();
    this.logger.info(`Using default workspace path: ${defaultPath}`);
    return defaultPath;
  }

  /**
   * Check if the workspace path exists
   */
  async workspacePathExists(): Promise<boolean> {
    try {
      const workspacePath = this.getWorkspacePath();
      await fs.promises.access(workspacePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      this.logger.warn('Workspace path does not exist or is not accessible', error);
      return false;
    }
  }

  /**
   * Get all workspace folders
   */
  async getWorkspaceFolders(): Promise<string[]> {
    const workspacePath = this.getWorkspacePath();
    
    try {
      const exists = await this.workspacePathExists();
      if (!exists) {
        this.logger.warn('Workspace path does not exist');
        return [];
      }

      const entries = await fs.promises.readdir(workspacePath, { withFileTypes: true });
      const folders = entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(workspacePath, entry.name));

      this.logger.debug(`Found ${folders.length} workspace folders`);
      return folders;
    } catch (error) {
      this.logger.error('Error reading workspace folders', error);
      return [];
    }
  }

  /**
   * Get all files in a workspace folder
   */
  async getWorkspaceFiles(workspaceFolder: string): Promise<string[]> {
    try {
      const files: string[] = [];
      await this.walkDirectory(workspaceFolder, files);
      this.logger.debug(`Found ${files.length} files in ${workspaceFolder}`);
      return files;
    } catch (error) {
      this.logger.error(`Error reading files from ${workspaceFolder}`, error);
      return [];
    }
  }

  private async walkDirectory(dir: string, fileList: string[]): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.walkDirectory(fullPath, fileList);
      } else if (entry.isFile()) {
        fileList.push(fullPath);
      }
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<{ lastModified: number; size: number } | null> {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        lastModified: stats.mtimeMs,
        size: stats.size
      };
    } catch (error) {
      this.logger.error(`Error getting metadata for ${filePath}`, error);
      return null;
    }
  }

  /**
   * Validate workspace path and show error if invalid
   */
  async validateWorkspacePath(): Promise<boolean> {
    const exists = await this.workspacePathExists();
    
    if (!exists) {
      const workspacePath = this.getWorkspacePath();
      vscode.window.showErrorMessage(
        `Cursor workspace path not found: ${workspacePath}. Please ensure Cursor is installed or set a custom workspace path in settings.`
      );
      return false;
    }

    return true;
  }
}
