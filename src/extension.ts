import * as vscode from 'vscode';
import { Logger } from './utils/logger';
import { TokenManager } from './auth/tokenManager';
import { GoogleAuth } from './auth/googleAuth';
import { DriveClient } from './drive/driveClient';
import { DriveStorage } from './drive/driveStorage';
import { WorkspaceManager } from './workspace/workspaceManager';
import { SyncEngine, SyncStatus } from './sync/syncEngine';
import { StatusBar } from './ui/statusBar';
import { Commands } from './ui/commands';
import { Notifications } from './ui/notifications';

let logger: Logger;
let statusBar: StatusBar;
let syncEngine: SyncEngine;
let googleAuth: GoogleAuth;

export async function activate(context: vscode.ExtensionContext) {
  try {
    // Initialize logger
    logger = new Logger('Cursor Chat Cloud');
    logger.info('Extension activating...');

    // Initialize components
    const tokenManager = new TokenManager(context, logger);
    googleAuth = new GoogleAuth(tokenManager, logger);
    const driveClient = new DriveClient(logger);
    const driveStorage = new DriveStorage(driveClient, logger);
    const workspaceManager = new WorkspaceManager(logger);
    syncEngine = new SyncEngine(driveStorage, workspaceManager, logger);
    
    // Initialize UI
    statusBar = new StatusBar(logger);
    const notifications = new Notifications(logger);
    const commands = new Commands(googleAuth, syncEngine, notifications, statusBar, logger);

    // Register commands
    commands.registerCommands(context);

    // Check if authenticated
    const isAuthenticated = await googleAuth.isAuthenticated();
    
    if (isAuthenticated) {
      logger.info('User is authenticated, initializing sync...');
      
      try {
        // Get authenticated client
        const authClient = await googleAuth.getAuthenticatedClient();
        
        if (authClient) {
          // Initialize drive client
          driveClient.initialize(authClient);
          
          // Initialize drive storage
          await driveStorage.initialize();
          
          // Start auto-sync
          await syncEngine.startAutoSync();
          
          logger.info('Extension activated successfully');
        } else {
          logger.warn('Failed to get authenticated client');
          statusBar.updateStatus(SyncStatus.OFFLINE);
          notifications.warn('Failed to authenticate. Please sign in again.');
        }
      } catch (error) {
        logger.error('Error during initialization', error);
        statusBar.updateStatus(SyncStatus.ERROR);
        notifications.error('Failed to initialize sync', error);
      }
    } else {
      logger.info('User not authenticated');
      statusBar.updateStatus(SyncStatus.OFFLINE);
      
      // Prompt user to sign in
      const result = await vscode.window.showInformationMessage(
        'Cursor Chat Cloud: Sign in to Google Drive to start syncing',
        'Sign In',
        'Later'
      );
      
      if (result === 'Sign In') {
        await vscode.commands.executeCommand('cursorChatCloud.signIn');
      }
    }

    // Listen for configuration changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration('cursorChatCloud')) {
          logger.info('Configuration changed, restarting sync...');
          
          if (isAuthenticated) {
            await syncEngine.stopAutoSync();
            await syncEngine.startAutoSync();
          }
        }
      })
    );

    // Update status bar periodically
    const statusUpdateInterval = setInterval(() => {
      const syncInfo = syncEngine.getSyncInfo();
      statusBar.updateStatus(syncInfo.status, syncInfo.lastSync);
    }, 1000);

    context.subscriptions.push(
      new vscode.Disposable(() => clearInterval(statusUpdateInterval))
    );

  } catch (error) {
    logger?.error('Extension activation failed', error);
    vscode.window.showErrorMessage(`Cursor Chat Cloud: Activation failed - ${error}`);
  }
}

export async function deactivate() {
  logger?.info('Extension deactivating...');
  
  try {
    // Stop auto-sync
    if (syncEngine) {
      await syncEngine.stopAutoSync();
    }

    // Dispose UI components
    if (statusBar) {
      statusBar.dispose();
    }

    if (logger) {
      logger.dispose();
    }

    logger?.info('Extension deactivated');
  } catch (error) {
    logger?.error('Error during deactivation', error);
  }
}
