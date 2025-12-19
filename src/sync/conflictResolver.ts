import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '../utils/logger';

export interface ConflictInfo {
  localPath: string;
  localModified: number;
  remoteModified: number;
  resolution: 'local' | 'remote';
}

export class ConflictResolver {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Resolve conflict between local and remote files
   * Strategy: Newest wins, backup older version
   */
  async resolveConflict(
    localPath: string,
    localModified: number,
    remoteModified: number
  ): Promise<ConflictInfo> {
    this.logger.info(`Resolving conflict for ${localPath}`);
    
    const resolution: 'local' | 'remote' = localModified > remoteModified ? 'local' : 'remote';
    
    // Create backup of the older version
    if (resolution === 'remote') {
      await this.createBackup(localPath, localModified);
    }

    const conflictInfo: ConflictInfo = {
      localPath,
      localModified,
      remoteModified,
      resolution
    };

    this.logger.info(`Conflict resolved: ${resolution} version is newer`);
    return conflictInfo;
  }

  /**
   * Create backup of file
   */
  private async createBackup(filePath: string, timestamp: number): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath);
      const backupName = `${basename}.backup-${timestamp}`;
      const backupPath = path.join(dir, backupName);

      await fs.promises.copyFile(filePath, backupPath);
      this.logger.info(`Created backup: ${backupPath}`);
    } catch (error) {
      this.logger.error(`Error creating backup for ${filePath}`, error);
      // Don't throw - backup is nice to have but not critical
    }
  }

  /**
   * Show conflict notification to user
   */
  showConflictNotification(conflicts: ConflictInfo[]): void {
    if (conflicts.length === 0) {
      return;
    }

    const message = `Resolved ${conflicts.length} sync conflict(s). Backups created for older versions.`;
    vscode.window.showInformationMessage(message);
    
    this.logger.info(`Notified user about ${conflicts.length} conflicts`);
  }
}
