import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { GoogleAuth } from '../auth/googleAuth';
import { SyncEngine } from '../sync/syncEngine';
import { Notifications } from './notifications';
import { StatusBar } from './statusBar';

export class Commands {
  private logger: Logger;
  private googleAuth: GoogleAuth;
  private syncEngine: SyncEngine;
  private notifications: Notifications;
  private statusBar: StatusBar;

  constructor(
    googleAuth: GoogleAuth,
    syncEngine: SyncEngine,
    notifications: Notifications,
    statusBar: StatusBar,
    logger: Logger
  ) {
    this.googleAuth = googleAuth;
    this.syncEngine = syncEngine;
    this.notifications = notifications;
    this.statusBar = statusBar;
    this.logger = logger;
  }

  /**
   * Register all commands
   */
  registerCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand('cursorChatCloud.signIn', () => this.signIn()),
      vscode.commands.registerCommand('cursorChatCloud.signOut', () => this.signOut()),
      vscode.commands.registerCommand('cursorChatCloud.syncNow', () => this.syncNow()),
      vscode.commands.registerCommand('cursorChatCloud.openSettings', () => this.openSettings()),
      vscode.commands.registerCommand('cursorChatCloud.viewStatus', () => this.viewStatus())
    );

    this.logger.info('Commands registered');
  }

  /**
   * Sign in command
   */
  private async signIn(): Promise<void> {
    try {
      this.logger.info('Executing sign in command');
      
      const isAuthenticated = await this.googleAuth.isAuthenticated();
      if (isAuthenticated) {
        const result = await vscode.window.showInformationMessage(
          'Already signed in to Google Drive. Sign in again?',
          'Yes', 'No'
        );
        
        if (result !== 'Yes') {
          return;
        }
      }

      const success = await this.googleAuth.signIn();
      
      if (success) {
        this.notifications.success('Successfully signed in to Google Drive');
        
        // Start auto-sync after successful sign in
        await this.syncEngine.startAutoSync();
      }
    } catch (error) {
      this.logger.error('Sign in command failed', error);
      this.notifications.error('Sign in failed', error);
    }
  }

  /**
   * Sign out command
   */
  private async signOut(): Promise<void> {
    try {
      this.logger.info('Executing sign out command');
      
      const result = await vscode.window.showWarningMessage(
        'Are you sure you want to sign out? Auto-sync will be stopped.',
        'Yes', 'No'
      );
      
      if (result !== 'Yes') {
        return;
      }

      // Stop auto-sync
      await this.syncEngine.stopAutoSync();

      // Sign out
      await this.googleAuth.signOut();
      
      this.notifications.success('Successfully signed out from Google Drive');
    } catch (error) {
      this.logger.error('Sign out command failed', error);
      this.notifications.error('Sign out failed', error);
    }
  }

  /**
   * Sync now command
   */
  private async syncNow(): Promise<void> {
    try {
      this.logger.info('Executing sync now command');
      
      const isAuthenticated = await this.googleAuth.isAuthenticated();
      if (!isAuthenticated) {
        const result = await this.notifications.errorWithAction(
          'Not signed in. Please sign in first.',
          'Sign In'
        );
        
        if (result) {
          await this.signIn();
        }
        return;
      }

      await this.syncEngine.sync();
    } catch (error) {
      this.logger.error('Sync now command failed', error);
      this.notifications.error('Sync failed', error);
    }
  }

  /**
   * Open settings command
   */
  private openSettings(): void {
    this.logger.info('Executing open settings command');
    vscode.commands.executeCommand('workbench.action.openSettings', 'cursorChatCloud');
  }

  /**
   * View status command
   */
  private viewStatus(): void {
    this.logger.info('Executing view status command');
    
    const syncInfo = this.syncEngine.getSyncInfo();
    const lastSyncTime = syncInfo.lastSync > 0 
      ? new Date(syncInfo.lastSync).toLocaleString() 
      : 'Never';
    
    const statusMessage = `
Cursor Chat Cloud Status
─────────────────────────
Status: ${syncInfo.status.toUpperCase()}
Last Sync: ${lastSyncTime}
Currently Syncing: ${syncInfo.isSyncing ? 'Yes' : 'No'}
    `.trim();

    vscode.window.showInformationMessage(statusMessage, { modal: true });
  }
}
