import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

const TOKEN_KEY = 'cursorChatCloud.tokens';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

export class TokenManager {
  private logger: Logger;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext, logger: Logger) {
    this.context = context;
    this.logger = logger;
  }

  /**
   * Store tokens securely
   */
  async storeTokens(tokens: TokenData): Promise<void> {
    try {
      await this.context.secrets.store(TOKEN_KEY, JSON.stringify(tokens));
      this.logger.info('Tokens stored successfully');
    } catch (error) {
      this.logger.error('Error storing tokens', error);
      throw error;
    }
  }

  /**
   * Retrieve tokens
   */
  async getTokens(): Promise<TokenData | null> {
    try {
      const tokensJson = await this.context.secrets.get(TOKEN_KEY);
      
      if (!tokensJson) {
        this.logger.debug('No tokens found');
        return null;
      }

      const tokens = JSON.parse(tokensJson) as TokenData;
      this.logger.debug('Tokens retrieved successfully');
      return tokens;
    } catch (error) {
      this.logger.error('Error retrieving tokens', error);
      return null;
    }
  }

  /**
   * Delete tokens
   */
  async deleteTokens(): Promise<void> {
    try {
      await this.context.secrets.delete(TOKEN_KEY);
      this.logger.info('Tokens deleted successfully');
    } catch (error) {
      this.logger.error('Error deleting tokens', error);
      throw error;
    }
  }

  /**
   * Check if tokens exist
   */
  async hasTokens(): Promise<boolean> {
    const tokens = await this.getTokens();
    return tokens !== null;
  }

  /**
   * Check if tokens are expired
   */
  async isTokenExpired(): Promise<boolean> {
    const tokens = await this.getTokens();
    
    if (!tokens) {
      return true;
    }

    const now = Date.now();
    const expiryDate = tokens.expiry_date;
    
    // Add a buffer of 5 minutes
    const buffer = 5 * 60 * 1000;
    
    return now >= (expiryDate - buffer);
  }
}
