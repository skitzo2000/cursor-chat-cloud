import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '../utils/logger';
import { DriveStorage } from '../drive/driveStorage';
import { WorkspaceManager } from '../workspace/workspaceManager';
import { ConflictResolver, ConflictInfo } from './conflictResolver';
import { FileWatcher } from './fileWatcher';
import { Config } from '../utils/config';

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  ERROR = 'error',
  OFFLINE = 'offline'
}

export class SyncEngine {
  private logger: Logger;
  private driveStorage: DriveStorage;
  private workspaceManager: WorkspaceManager;
  private conflictResolver: ConflictResolver;
  private fileWatcher: FileWatcher;
  private status: SyncStatus = SyncStatus.IDLE;
  private lastSyncTime: number = 0;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  constructor(
    driveStorage: DriveStorage,
    workspaceManager: WorkspaceManager,
    logger: Logger
  ) {
    this.driveStorage = driveStorage;
    this.workspaceManager = workspaceManager;
    this.logger = logger;
    this.conflictResolver = new ConflictResolver(logger);
    this.fileWatcher = new FileWatcher(logger);
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  /**
   * Start automatic sync
   */
  async startAutoSync(): Promise<void> {
    if (!Config.getAutoSync()) {
      this.logger.info('Auto-sync is disabled');
      return;
    }

    // Initial sync
    await this.sync();

    // Start periodic sync
    const intervalMinutes = Config.getSyncInterval();
    const intervalMs = intervalMinutes * 60 * 1000;

    this.syncInterval = setInterval(() => {
      this.sync().catch(error => {
        this.logger.error('Auto-sync failed', error);
      });
    }, intervalMs);

    this.logger.info(`Started auto-sync with ${intervalMinutes} minute interval`);

    // Start file watcher
    const workspacePath = this.workspaceManager.getWorkspacePath();
    this.fileWatcher.start(workspacePath, (filePath) => {
      this.handleFileChange(filePath);
    });
  }

  /**
   * Stop automatic sync
   */
  async stopAutoSync(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    await this.fileWatcher.stop();
    
    this.logger.info('Stopped auto-sync');
  }

  /**
   * Handle file change from watcher
   */
  private async handleFileChange(filePath: string): Promise<void> {
    if (!Config.getAutoSync()) {
      return;
    }

    this.logger.debug(`Handling file change: ${filePath}`);
    
    // Trigger sync
    await this.sync();
  }

  /**
   * Perform sync operation
   */
  async sync(): Promise<void> {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      this.logger.debug('Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    this.status = SyncStatus.SYNCING;

    try {
      this.logger.info('Starting sync...');

      // Validate workspace path
      const isValid = await this.workspaceManager.validateWorkspacePath();
      if (!isValid) {
        this.status = SyncStatus.ERROR;
        return;
      }

      // Get workspace folders
      const workspaceFolders = await this.workspaceManager.getWorkspaceFolders();
      
      if (workspaceFolders.length === 0) {
        this.logger.info('No workspace folders found');
        this.status = SyncStatus.IDLE;
        this.lastSyncTime = Date.now();
        return;
      }

      // Get cloud files
      const cloudFiles = await this.driveStorage.listWorkspaceFiles();
      const cloudFileMap = new Map(cloudFiles.map(f => [f.name, f]));

      const conflicts: ConflictInfo[] = [];

      // Sync each workspace folder
      for (const folder of workspaceFolders) {
        const files = await this.workspaceManager.getWorkspaceFiles(folder);
        
        for (const file of files) {
          await this.syncFile(file, folder, cloudFileMap, conflicts);
        }
      }

      // Download new files from cloud that don't exist locally
      for (const [fileName, cloudFile] of cloudFileMap) {
        const localPath = path.join(this.workspaceManager.getWorkspacePath(), fileName);
        const exists = await this.fileExists(localPath);
        
        if (!exists) {
          await this.downloadFromCloud(cloudFile.id, localPath);
        }
      }

      // Show conflict notifications
      if (conflicts.length > 0) {
        this.conflictResolver.showConflictNotification(conflicts);
      }

      this.status = SyncStatus.IDLE;
      this.lastSyncTime = Date.now();
      
      this.logger.info('Sync completed successfully');
      
      if (Config.getShowNotifications()) {
        vscode.window.showInformationMessage('Cursor Chat Cloud: Sync completed');
      }
    } catch (error) {
      this.logger.error('Sync failed', error);
      this.status = SyncStatus.ERROR;
      
      if (Config.getShowNotifications()) {
        vscode.window.showErrorMessage(`Cursor Chat Cloud: Sync failed - ${error}`);
      }
      
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync individual file
   */
  private async syncFile(
    filePath: string,
    workspaceFolder: string,
    cloudFileMap: Map<string, { id: string; name: string; modifiedTime: string; size?: string }>,
    conflicts: ConflictInfo[]
  ): Promise<void> {
    const fileName = path.basename(filePath);
    const cloudFile = cloudFileMap.get(fileName);

    const localMeta = await this.workspaceManager.getFileMetadata(filePath);
    if (!localMeta) {
      return;
    }

    if (cloudFile) {
      // File exists in both local and cloud - check for conflicts
      const cloudModified = new Date(cloudFile.modifiedTime).getTime();
      const localModified = localMeta.lastModified;

      // Remove from map as we're handling it
      cloudFileMap.delete(fileName);

      if (Math.abs(cloudModified - localModified) < 1000) {
        // Files are in sync (within 1 second tolerance)
        this.logger.debug(`File in sync: ${fileName}`);
        return;
      }

      // Resolve conflict
      const conflict = await this.conflictResolver.resolveConflict(
        filePath,
        localModified,
        cloudModified
      );

      conflicts.push(conflict);

      if (conflict.resolution === 'remote') {
        // Download from cloud
        await this.downloadFromCloud(cloudFile.id, filePath);
      } else {
        // Upload to cloud
        await this.uploadToCloud(filePath, fileName);
      }
    } else {
      // File only exists locally - upload
      await this.uploadToCloud(filePath, fileName);
    }
  }

  /**
   * Upload file to cloud
   */
  private async uploadToCloud(localPath: string, fileName: string): Promise<void> {
    try {
      const relativePath = fileName;
      await this.driveStorage.uploadWorkspaceFile(localPath, relativePath);
      this.logger.debug(`Uploaded to cloud: ${fileName}`);
    } catch (error) {
      this.logger.error(`Failed to upload ${fileName}`, error);
    }
  }

  /**
   * Download file from cloud
   */
  private async downloadFromCloud(fileId: string, localPath: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(localPath);
      await fs.promises.mkdir(dir, { recursive: true });

      await this.driveStorage.downloadWorkspaceFile(fileId, localPath);
      this.logger.debug(`Downloaded from cloud: ${path.basename(localPath)}`);
    } catch (error) {
      this.logger.error(`Failed to download to ${localPath}`, error);
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get sync status information
   */
  getSyncInfo(): { status: SyncStatus; lastSync: number; isSyncing: boolean } {
    return {
      status: this.status,
      lastSync: this.lastSyncTime,
      isSyncing: this.isSyncing
    };
  }
}
