import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export class Notifications {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Show information message
   */
  info(message: string): void {
    this.logger.info(`Notification: ${message}`);
    vscode.window.showInformationMessage(`Cursor Chat Cloud: ${message}`);
  }

  /**
   * Show warning message
   */
  warn(message: string): void {
    this.logger.warn(`Notification: ${message}`);
    vscode.window.showWarningMessage(`Cursor Chat Cloud: ${message}`);
  }

  /**
   * Show error message
   */
  error(message: string, error?: any): void {
    const errorMsg = error ? `${message}: ${error.message || error}` : message;
    this.logger.error(`Notification: ${errorMsg}`);
    vscode.window.showErrorMessage(`Cursor Chat Cloud: ${errorMsg}`);
  }

  /**
   * Show error with action
   */
  async errorWithAction(message: string, action: string): Promise<boolean> {
    const result = await vscode.window.showErrorMessage(
      `Cursor Chat Cloud: ${message}`,
      action
    );
    return result === action;
  }

  /**
   * Show success message
   */
  success(message: string): void {
    this.logger.info(`Notification: ${message}`);
    vscode.window.showInformationMessage(`Cursor Chat Cloud: ${message}`);
  }
}
