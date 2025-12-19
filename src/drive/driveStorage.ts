import { Logger } from '../utils/logger';
import { DriveClient } from './driveClient';
import * as path from 'path';

export class DriveStorage {
  private logger: Logger;
  private driveClient: DriveClient;
  private appFolderId: string | null = null;
  private workspacesFolderId: string | null = null;

  constructor(driveClient: DriveClient, logger: Logger) {
    this.driveClient = driveClient;
    this.logger = logger;
  }

  /**
   * Initialize folder structure
   */
  async initialize(): Promise<void> {
    try {
      if (!this.driveClient.isInitialized()) {
        throw new Error('Drive client not initialized');
      }

      this.appFolderId = await this.driveClient.ensureAppFolder();
      this.workspacesFolderId = await this.driveClient.ensureWorkspacesFolder(this.appFolderId);
      
      this.logger.info('Drive storage initialized');
    } catch (error) {
      this.logger.error('Error initializing drive storage', error);
      throw error;
    }
  }

  /**
   * Get workspaces folder ID
   */
  getWorkspacesFolderId(): string | null {
    return this.workspacesFolderId;
  }

  /**
   * Upload workspace file
   */
  async uploadWorkspaceFile(localPath: string, relativePath: string): Promise<string> {
    if (!this.workspacesFolderId) {
      throw new Error('Drive storage not initialized');
    }

    try {
      const fileName = path.basename(relativePath);
      const existingFile = await this.driveClient.findFileByName(fileName, this.workspacesFolderId);
      
      const fileId = await this.driveClient.uploadFile(
        localPath,
        fileName,
        this.workspacesFolderId,
        existingFile?.id
      );

      this.logger.info(`Uploaded workspace file: ${relativePath}`);
      return fileId;
    } catch (error) {
      this.logger.error(`Error uploading workspace file ${relativePath}`, error);
      throw error;
    }
  }

  /**
   * Download workspace file
   */
  async downloadWorkspaceFile(fileId: string, localPath: string): Promise<void> {
    try {
      await this.driveClient.downloadFile(fileId, localPath);
      this.logger.info(`Downloaded workspace file to: ${localPath}`);
    } catch (error) {
      this.logger.error(`Error downloading workspace file to ${localPath}`, error);
      throw error;
    }
  }

  /**
   * List all workspace files in cloud
   */
  async listWorkspaceFiles(): Promise<Array<{ id: string; name: string; modifiedTime: string; size?: string }>> {
    if (!this.workspacesFolderId) {
      throw new Error('Drive storage not initialized');
    }

    try {
      const files = await this.driveClient.listFiles(this.workspacesFolderId);
      
      return files.map(file => ({
        id: file.id!,
        name: file.name!,
        modifiedTime: file.modifiedTime!,
        size: file.size
      }));
    } catch (error) {
      this.logger.error('Error listing workspace files', error);
      throw error;
    }
  }

  /**
   * Get file metadata from cloud
   */
  async getFileMetadata(fileId: string): Promise<{ modifiedTime: number; size: number }> {
    try {
      const metadata = await this.driveClient.getFileMetadata(fileId);
      
      return {
        modifiedTime: new Date(metadata.modifiedTime!).getTime(),
        size: parseInt(metadata.size || '0', 10)
      };
    } catch (error) {
      this.logger.error(`Error getting file metadata for ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Delete workspace file from cloud
   */
  async deleteWorkspaceFile(fileId: string): Promise<void> {
    try {
      await this.driveClient.deleteFile(fileId);
      this.logger.info(`Deleted workspace file: ${fileId}`);
    } catch (error) {
      this.logger.error(`Error deleting workspace file ${fileId}`, error);
      throw error;
    }
  }
}
