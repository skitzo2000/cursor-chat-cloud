export interface WorkspaceFile {
  path: string;
  lastModified: number;
  size: number;
  hash?: string;
}

export interface WorkspaceData {
  workspaceId: string;
  files: WorkspaceFile[];
  lastSynced?: number;
}

export interface SyncMetadata {
  localPath: string;
  remotePath: string;
  localModified: number;
  remoteModified?: number;
  fileId?: string;
  conflicted?: boolean;
}
