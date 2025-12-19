import * as vscode from 'vscode';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Logger } from '../utils/logger';
import { TokenManager, TokenData } from './tokenManager';
import * as http from 'http';
import * as url from 'url';

export class GoogleAuth {
  private logger: Logger;
  private tokenManager: TokenManager;
  private oauth2Client: OAuth2Client | null = null;
  
  // These are placeholder values - users need to create their own OAuth credentials
  private readonly CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
  private readonly CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
  private readonly REDIRECT_URI = 'http://localhost:3000/oauth2callback';
  private readonly SCOPES = ['https://www.googleapis.com/auth/drive.file'];

  constructor(tokenManager: TokenManager, logger: Logger) {
    this.tokenManager = tokenManager;
    this.logger = logger;
  }

  /**
   * Initialize OAuth2 client
   */
  private initializeOAuth2Client(): void {
    if (!this.oauth2Client) {
      this.oauth2Client = new google.auth.OAuth2(
        this.CLIENT_ID,
        this.CLIENT_SECRET,
        this.REDIRECT_URI
      );
    }
  }

  /**
   * Check if credentials are configured
   */
  private isConfigured(): boolean {
    return this.CLIENT_ID !== 'YOUR_CLIENT_ID.apps.googleusercontent.com' && 
           this.CLIENT_SECRET !== 'YOUR_CLIENT_SECRET';
  }

  /**
   * Sign in with Google Drive
   */
  async signIn(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        vscode.window.showErrorMessage(
          'Google OAuth credentials not configured. Please follow the setup instructions in the README to create your own Google Cloud project and update the credentials in googleAuth.ts.'
        );
        return false;
      }

      this.initializeOAuth2Client();

      // Generate authorization URL
      const authUrl = this.oauth2Client!.generateAuthUrl({
        access_type: 'offline',
        scope: this.SCOPES,
        prompt: 'consent'
      });

      this.logger.info('Opening browser for authentication');
      
      // Open browser
      vscode.env.openExternal(vscode.Uri.parse(authUrl));

      // Start local server to receive callback
      const authCode = await this.startCallbackServer();
      
      if (!authCode) {
        vscode.window.showErrorMessage('Authentication failed: No authorization code received');
        return false;
      }

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client!.getToken(authCode);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        vscode.window.showErrorMessage('Authentication failed: Invalid tokens received');
        return false;
      }

      // Store tokens
      const tokenData: TokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date || Date.now() + 3600000,
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope || this.SCOPES.join(' ')
      };

      await this.tokenManager.storeTokens(tokenData);
      this.oauth2Client!.setCredentials(tokens);

      this.logger.info('Authentication successful');
      vscode.window.showInformationMessage('Successfully signed in to Google Drive');
      
      return true;
    } catch (error) {
      this.logger.error('Authentication error', error);
      vscode.window.showErrorMessage(`Authentication failed: ${error}`);
      return false;
    }
  }

  /**
   * Start local server to receive OAuth callback
   */
  private async startCallbackServer(): Promise<string | null> {
    return new Promise((resolve) => {
      const server = http.createServer(async (req, res) => {
        if (req.url && req.url.startsWith('/oauth2callback')) {
          const queryParams = url.parse(req.url, true).query;
          const code = queryParams.code as string;

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>Authentication Successful!</h1>
                <p>You can close this window and return to VS Code.</p>
                <script>window.close();</script>
              </body>
            </html>
          `);

          server.close();
          resolve(code);
        }
      });

      server.listen(3000, () => {
        this.logger.info('Callback server started on port 3000');
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        resolve(null);
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await this.tokenManager.deleteTokens();
      this.oauth2Client = null;
      
      this.logger.info('Signed out successfully');
      vscode.window.showInformationMessage('Successfully signed out from Google Drive');
    } catch (error) {
      this.logger.error('Sign out error', error);
      throw error;
    }
  }

  /**
   * Get authenticated OAuth2 client
   */
  async getAuthenticatedClient(): Promise<OAuth2Client | null> {
    try {
      const tokens = await this.tokenManager.getTokens();
      
      if (!tokens) {
        this.logger.warn('No tokens available');
        return null;
      }

      this.initializeOAuth2Client();
      this.oauth2Client!.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope
      });

      // Check if token needs refresh
      const isExpired = await this.tokenManager.isTokenExpired();
      
      if (isExpired) {
        this.logger.info('Token expired, refreshing...');
        await this.refreshToken();
      }

      return this.oauth2Client;
    } catch (error) {
      this.logger.error('Error getting authenticated client', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshToken(): Promise<void> {
    try {
      if (!this.oauth2Client) {
        throw new Error('OAuth2 client not initialized');
      }

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('Failed to refresh token');
      }

      // Update stored tokens
      const tokenData: TokenData = {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || (await this.tokenManager.getTokens())!.refresh_token,
        expiry_date: credentials.expiry_date || Date.now() + 3600000,
        token_type: credentials.token_type || 'Bearer',
        scope: credentials.scope || this.SCOPES.join(' ')
      };

      await this.tokenManager.storeTokens(tokenData);
      this.oauth2Client.setCredentials(credentials);

      this.logger.info('Token refreshed successfully');
    } catch (error) {
      this.logger.error('Error refreshing token', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.tokenManager.hasTokens();
  }
}
