import * as vscode from 'vscode';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Logger } from '../utils/logger';
import { Config } from '../utils/config';
import { TokenManager, TokenData } from './tokenManager';
import * as http from 'http';
import * as url from 'url';

export class GoogleAuth {
  private logger: Logger;
  private tokenManager: TokenManager;
  private oauth2Client: OAuth2Client | null = null;
  private CLIENT_ID: string = '';
  private CLIENT_SECRET: string = '';
  private REDIRECT_PORT: number = 3000;
  private REDIRECT_URI: string = '';
  private readonly SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  private readonly OAUTH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  constructor(tokenManager: TokenManager, logger: Logger) {
    this.tokenManager = tokenManager;
    this.logger = logger;
    this.loadCredentials();
  }

  /**
   * Load OAuth credentials from configuration
   */
  private loadCredentials(): void {
    this.CLIENT_ID = Config.getGoogleClientId();
    this.CLIENT_SECRET = Config.getGoogleClientSecret();
    this.REDIRECT_PORT = Config.getOAuthRedirectPort();
    this.REDIRECT_URI = `http://localhost:${this.REDIRECT_PORT}/oauth2callback`;
  }

  /**
   * Check if credentials are configured
   */
  private isConfigured(): boolean {
    this.loadCredentials(); // Reload in case settings changed
    return this.CLIENT_ID.length > 0 && this.CLIENT_SECRET.length > 0;
  }

  /**
   * Prompt user to configure OAuth credentials
   */
  private async promptForCredentials(): Promise<boolean> {
    const setupChoice = await vscode.window.showInformationMessage(
      'Google OAuth credentials are required to sync with Google Drive. Would you like to set them up now?',
      'Setup Credentials',
      'Learn More',
      'Cancel'
    );

    if (setupChoice === 'Learn More') {
      await vscode.env.openExternal(vscode.Uri.parse('https://console.cloud.google.com/'));
      vscode.window.showInformationMessage(
        'To use this extension, create a Google Cloud Project, enable the Drive API, and create OAuth credentials. See the extension README for detailed instructions.'
      );
      return false;
    }

    if (setupChoice !== 'Setup Credentials') {
      return false;
    }

    // Guide user through setup
    const clientId = await vscode.window.showInputBox({
      prompt: 'Enter your Google OAuth Client ID',
      placeHolder: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Client ID is required';
        }
        if (!value.includes('.apps.googleusercontent.com')) {
          return 'Client ID should end with .apps.googleusercontent.com';
        }
        return null;
      }
    });

    if (!clientId) {
      return false;
    }

    const clientSecret = await vscode.window.showInputBox({
      prompt: 'Enter your Google OAuth Client Secret',
      placeHolder: 'YOUR_CLIENT_SECRET',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Client Secret is required';
        }
        return null;
      }
    });

    if (!clientSecret) {
      return false;
    }

    // Save credentials to settings
    await Config.setGoogleClientId(clientId.trim());
    await Config.setGoogleClientSecret(clientSecret.trim());

    // Reload credentials
    this.loadCredentials();

    vscode.window.showInformationMessage(
      'OAuth credentials saved successfully! Make sure your OAuth redirect URI is set to: ' + this.REDIRECT_URI
    );

    return true;
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
   * Sign in with Google Drive
   */
  async signIn(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        this.logger.warn('OAuth credentials not configured');
        const credentialsSet = await this.promptForCredentials();
        
        if (!credentialsSet) {
          return false;
        }
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

      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          this.logger.error(`Port ${this.REDIRECT_PORT} is already in use`);
          vscode.window.showErrorMessage(
            `Cannot start OAuth server: Port ${this.REDIRECT_PORT} is already in use. Please close any applications using this port and try again.`
          );
        } else {
          this.logger.error('Callback server error', error);
        }
        server.close();
        resolve(null);
      });

      server.listen(this.REDIRECT_PORT, () => {
        this.logger.info(`Callback server started on port ${this.REDIRECT_PORT}`);
      });

      // Timeout after configured time
      setTimeout(() => {
        server.close();
        resolve(null);
      }, this.OAUTH_TIMEOUT_MS);
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
