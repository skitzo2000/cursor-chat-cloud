import * as vscode from 'vscode';

export class Config {
  static getAutoSync(): boolean {
    return vscode.workspace.getConfiguration('cursorChatCloud').get('autoSync', true);
  }

  static getSyncInterval(): number {
    return vscode.workspace.getConfiguration('cursorChatCloud').get('syncInterval', 5);
  }

  static getCustomWorkspacePath(): string {
    return vscode.workspace.getConfiguration('cursorChatCloud').get('customWorkspacePath', '');
  }

  static getShowNotifications(): boolean {
    return vscode.workspace.getConfiguration('cursorChatCloud').get('showNotifications', true);
  }

  static getLogLevel(): string {
    return vscode.workspace.getConfiguration('cursorChatCloud').get('logLevel', 'info');
  }

  static getDriveFolderPath(): string {
    return vscode.workspace.getConfiguration('cursorChatCloud').get('driveFolderPath', '/apps/CcCloud');
  }
}
