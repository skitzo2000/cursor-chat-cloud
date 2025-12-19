import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Logger } from '../utils/logger';
import * as fs from 'fs';
import { Readable } from 'stream';

export class DriveClient {
  private logger: Logger;
  private drive: drive_v3.Drive | null = null;
  private auth: OAuth2Client | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Initialize Drive client with OAuth2 client
   */
  initialize(auth: OAuth2Client): void {
    this.auth = auth;
    this.drive = google.drive({ version: 'v3', auth });
    this.logger.info('Drive client initialized');
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.drive !== null && this.auth !== null;
  }

  /**
   * Create or find the app folder in Google Drive
   */
  async ensureAppFolder(): Promise<string> {
    if (!this.drive) {
      throw new Error('Drive client not initialized');
    }

    try {
      // Search for existing folder
      const response = await this.drive.files.list({
        q: "name='CursorChatCloud' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (response.data.files && response.data.files.length > 0) {
        const folderId = response.data.files[0].id!;
        this.logger.info(`Found existing app folder: ${folderId}`);
        return folderId;
      }

      // Create folder if it doesn't exist
      const folderMetadata: drive_v3.Schema$File = {
        name: 'CursorChatCloud',
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      const folderId = folder.data.id!;
      this.logger.info(`Created app folder: ${folderId}`);
      return folderId;
    } catch (error) {
      this.logger.error('Error ensuring app folder', error);
      throw error;
    }
  }

  /**
   * Create or find workspaces subfolder
   */
  async ensureWorkspacesFolder(parentFolderId: string): Promise<string> {
    if (!this.drive) {
      throw new Error('Drive client not initialized');
    }

    try {
      // Search for existing folder
      const response = await this.drive.files.list({
        q: `name='workspaces' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (response.data.files && response.data.files.length > 0) {
        const folderId = response.data.files[0].id!;
        this.logger.info(`Found existing workspaces folder: ${folderId}`);
        return folderId;
      }

      // Create folder if it doesn't exist
      const folderMetadata: drive_v3.Schema$File = {
        name: 'workspaces',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      const folderId = folder.data.id!;
      this.logger.info(`Created workspaces folder: ${folderId}`);
      return folderId;
    } catch (error) {
      this.logger.error('Error ensuring workspaces folder', error);
      throw error;
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    filePath: string,
    fileName: string,
    parentFolderId: string,
    existingFileId?: string
  ): Promise<string> {
    if (!this.drive) {
      throw new Error('Drive client not initialized');
    }

    try {
      const fileMetadata: drive_v3.Schema$File = {
        name: fileName,
        parents: existingFileId ? undefined : [parentFolderId]
      };

      const media = {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(filePath)
      };

      let response;
      
      if (existingFileId) {
        // Update existing file
        response = await this.drive.files.update({
          fileId: existingFileId,
          requestBody: fileMetadata,
          media: media,
          fields: 'id, modifiedTime'
        });
        this.logger.debug(`Updated file: ${fileName} (${existingFileId})`);
      } else {
        // Create new file
        response = await this.drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, modifiedTime'
        });
        this.logger.debug(`Uploaded file: ${fileName}`);
      }

      return response.data.id!;
    } catch (error) {
      this.logger.error(`Error uploading file ${fileName}`, error);
      throw error;
    }
  }

  /**
   * Download file from Google Drive
   */
  async downloadFile(fileId: string, destPath: string): Promise<void> {
    if (!this.drive) {
      throw new Error('Drive client not initialized');
    }

    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const dest = fs.createWriteStream(destPath);
      
      await new Promise<void>((resolve, reject) => {
        (response.data as any as Readable)
          .pipe(dest)
          .on('finish', resolve)
          .on('error', reject);
      });

      this.logger.debug(`Downloaded file: ${fileId} to ${destPath}`);
    } catch (error) {
      this.logger.error(`Error downloading file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folderId: string): Promise<drive_v3.Schema$File[]> {
    if (!this.drive) {
      throw new Error('Drive client not initialized');
    }

    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, modifiedTime, size, mimeType)',
        spaces: 'drive',
        pageSize: 1000
      });

      const files = response.data.files || [];
      this.logger.debug(`Listed ${files.length} files in folder ${folderId}`);
      return files;
    } catch (error) {
      this.logger.error(`Error listing files in folder ${folderId}`, error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<drive_v3.Schema$File> {
    if (!this.drive) {
      throw new Error('Drive client not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, modifiedTime, size, mimeType, parents'
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting metadata for file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.drive) {
      throw new Error('Drive client not initialized');
    }

    try {
      await this.drive.files.delete({ fileId });
      this.logger.debug(`Deleted file: ${fileId}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Find file by name in folder
   */
  async findFileByName(fileName: string, parentFolderId: string): Promise<drive_v3.Schema$File | null> {
    if (!this.drive) {
      throw new Error('Drive client not initialized');
    }

    try {
      const response = await this.drive.files.list({
        q: `name='${fileName}' and '${parentFolderId}' in parents and trashed=false`,
        fields: 'files(id, name, modifiedTime, size)',
        spaces: 'drive'
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0];
      }

      return null;
    } catch (error) {
      this.logger.error(`Error finding file ${fileName}`, error);
      throw error;
    }
  }
}
