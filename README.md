# Cursor Chat Cloud

Automatically sync your Cursor chat workspaces across multiple machines using Google Drive. Never lose your AI chat history when switching between devices!

## ✨ Features

- 🔄 **Automatic Synchronization**: Seamlessly sync workspace chats in the background
- ☁️ **Google Drive Integration**: Secure cloud storage using your own Google Drive
- 🔒 **Secure Authentication**: OAuth 2.0 with token encryption via VS Code SecretStorage
- 🖥️ **Cross-Platform**: Works on Windows, macOS, and Linux
- ⚡ **Real-time Sync**: File watcher detects changes and syncs automatically
- 🔔 **Smart Notifications**: Get notified about sync status and conflicts
- 🔧 **Customizable**: Configure sync intervals, paths, and notification preferences
- 🛡️ **Conflict Resolution**: Automatic conflict resolution with backup creation

## 📋 Prerequisites

Before using this extension, you need to:

1. **Have Cursor IDE installed** on your machine
2. **Create a Google Cloud Project** and enable the Drive API (see setup guide below)
3. **Have VS Code or Cursor** version 1.80.0 or higher

## 🚀 Installation

### Option 1: From VSIX (Recommended for development)
1. Download the latest `.vsix` file from releases
2. Open VS Code/Cursor
3. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
4. Click the "..." menu at the top
5. Select "Install from VSIX..."
6. Choose the downloaded `.vsix` file

### Option 2: From source
```bash
git clone https://github.com/skitzo2000/cursor-chat-cloud.git
cd cursor-chat-cloud
npm install
npm run build
```

## 🔧 Google Cloud Setup

This extension requires you to set up your own Google Cloud project for security and privacy. Follow these steps:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Cursor Chat Cloud"
   - User support email: Your email
   - Developer contact: Your email
4. Add the following scope:
   - `https://www.googleapis.com/auth/drive.file`
5. Save and continue

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add these Authorized redirect URIs:
   ```
   http://localhost:3000/oauth2callback
   ```
5. Click "Create"
6. **Copy the Client ID and Client Secret**

### Step 4: Update Extension Configuration

You have two options to configure the OAuth credentials:

#### Option A: Environment Variables (Recommended for development)

Set these environment variables before building:
```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export OAUTH_REDIRECT_PORT="3000"  # Optional, defaults to 3000
```

Then build the extension:
```bash
npm run build
```

#### Option B: Update Source Code (For packaged distribution)

1. Open the extension source code
2. Navigate to `src/auth/googleAuth.ts`
3. Replace the placeholder values:
   ```typescript
   private readonly CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
   private readonly CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
   ```
4. Rebuild the extension:
   ```bash
   npm run build
   ```

**Security Note**: Never commit your actual credentials to version control. Use environment variables for development and secure secret management for production deployments.

## 📖 Usage

### First Time Setup

1. Install and configure the extension (see above)
2. Open VS Code/Cursor
3. You'll see a notification to sign in
4. Click "Sign In" or use Command Palette:
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: `Cursor Chat Cloud: Sign in with Google Drive`
5. Browser will open for Google OAuth
6. Grant permissions
7. Return to VS Code - sync will start automatically!

### Daily Usage

Once set up, the extension works automatically:

- ✅ Syncs on startup
- ✅ Syncs when files change
- ✅ Syncs periodically (default: every 5 minutes)
- ✅ Status shown in the status bar (bottom right)

### Manual Sync

Click the cloud icon in the status bar or use the command:
```
Cursor Chat Cloud: Sync Now
```

### View Sync Status

Use the command:
```
Cursor Chat Cloud: View Sync Status
```

## ⚙️ Configuration

Access settings via `File > Preferences > Settings` and search for "Cursor Chat Cloud":

| Setting | Description | Default |
|---------|-------------|---------|
| `cursorChatCloud.autoSync` | Enable automatic synchronization | `true` |
| `cursorChatCloud.syncInterval` | Sync interval in minutes | `5` |
| `cursorChatCloud.customWorkspacePath` | Custom path to Cursor workspaces | `""` |
| `cursorChatCloud.showNotifications` | Show sync notifications | `true` |
| `cursorChatCloud.logLevel` | Logging level (debug/info/warn/error) | `info` |

### Default Workspace Paths

The extension automatically detects Cursor workspace locations:

- **Windows**: `%APPDATA%\Cursor\User\workspaceStorage`
- **macOS**: `~/Library/Application Support/Cursor/User/workspaceStorage`
- **Linux**: `~/.config/Cursor/User/workspaceStorage`

## 🎯 Commands

Access all commands via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `Cursor Chat Cloud: Sign in with Google Drive` - Authenticate with Google
- `Cursor Chat Cloud: Sign out` - Sign out and stop syncing
- `Cursor Chat Cloud: Sync Now` - Manually trigger sync
- `Cursor Chat Cloud: Open Settings` - Open extension settings
- `Cursor Chat Cloud: View Sync Status` - View detailed sync information

## 🔔 Status Bar Icons

The extension shows its status in the status bar:

- `☁️ Synced` - Everything is up to date
- `🔄 Syncing` - Sync in progress
- `❌ Sync Error` - Error occurred
- `📡 Offline` - Not authenticated

## 🐛 Troubleshooting

### Issue: "Cursor workspace path not found"

**Solution**: 
- Ensure Cursor is installed
- Check the path in settings matches your Cursor installation
- Set a custom path in settings if needed

### Issue: "Authentication failed"

**Solution**:
- Verify your Google Cloud credentials are correct
- Check that the OAuth redirect URI is configured
- Ensure the Drive API is enabled
- Try signing out and signing in again

### Issue: "Sync failed: quota exceeded"

**Solution**:
- Google Drive API has usage limits
- Wait a few minutes and try again
- Consider reducing sync frequency in settings

### Issue: Files not syncing

**Solution**:
- Check if you're signed in
- View logs: Command Palette > "Cursor Chat Cloud" output channel
- Verify workspace path exists
- Check internet connection

### Enable Debug Logging

1. Open settings
2. Set `cursorChatCloud.logLevel` to `debug`
3. View logs in Output panel (View > Output > "Cursor Chat Cloud")

## 🔐 Privacy & Security

- **Your Data**: All workspace data stays in YOUR Google Drive account
- **Credentials**: OAuth tokens stored securely using VS Code SecretStorage API
- **Minimal Permissions**: Only requests `drive.file` scope (access only to files created by this app)
- **No Telemetry**: This extension does not collect or send any usage data
- **Open Source**: Full source code available for inspection

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/skitzo2000/cursor-chat-cloud.git
cd cursor-chat-cloud

# Install dependencies
npm install

# Build the extension
npm run build

# Watch for changes
npm run watch
```

### Testing

Press `F5` in VS Code to launch the extension in a new Extension Development Host window.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [ibrahim317/cursor-chat-transfer](https://github.com/ibrahim317/cursor-chat-transfer)
- Built with [googleapis](https://github.com/googleapis/google-api-nodejs-client)
- Uses [chokidar](https://github.com/paulmillr/chokidar) for file watching

## 📊 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 💬 Support

- Report issues: [GitHub Issues](https://github.com/skitzo2000/cursor-chat-cloud/issues)
- Feature requests: [GitHub Issues](https://github.com/skitzo2000/cursor-chat-cloud/issues)

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Note**: This extension is not affiliated with or endorsed by Cursor or Anysphere, Inc.
