import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { SyncStatus } from '../sync/syncEngine';

export class StatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private logger: Logger;
  private lastSyncTime: number = 0;

  constructor(logger: Logger) {
    this.logger = logger;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'cursorChatCloud.syncNow';
    this.updateStatus(SyncStatus.IDLE);
    this.statusBarItem.show();
  }

  /**
   * Update status bar based on sync status
   */
  updateStatus(status: SyncStatus, lastSync?: number): void {
    if (lastSync) {
      this.lastSyncTime = lastSync;
    }

    switch (status) {
      case SyncStatus.IDLE:
        this.statusBarItem.text = '$(cloud-upload) Synced';
        this.statusBarItem.backgroundColor = undefined;
        break;
      case SyncStatus.SYNCING:
        this.statusBarItem.text = '$(sync~spin) Syncing';
        this.statusBarItem.backgroundColor = undefined;
        break;
      case SyncStatus.ERROR:
        this.statusBarItem.text = '$(error) Sync Error';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;
      case SyncStatus.OFFLINE:
        this.statusBarItem.text = '$(cloud-offline) Offline';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        break;
    }

    this.updateTooltip();
    this.logger.debug(`Status bar updated: ${status}`);
  }

  /**
   * Update tooltip with last sync time
   */
  private updateTooltip(): void {
    if (this.lastSyncTime > 0) {
      const timeAgo = this.getTimeAgo(this.lastSyncTime);
      this.statusBarItem.tooltip = `Cursor Chat Cloud\nLast sync: ${timeAgo}\nClick to sync now`;
    } else {
      this.statusBarItem.tooltip = 'Cursor Chat Cloud\nClick to sync now';
    }
  }

  /**
   * Get human-readable time ago
   */
  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  }

  /**
   * Show status bar
   */
  show(): void {
    this.statusBarItem.show();
  }

  /**
   * Hide status bar
   */
  hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * Dispose status bar
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
