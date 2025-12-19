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
2. **Have a Google/Gmail account** for cloud storage
3. **Create a Google Cloud Project** with OAuth credentials (see setup guide below)
4. **Have VS Code or Cursor** version 1.80.0 or higher

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

To use this extension, you need to create your own Google Cloud Project and OAuth credentials. This is required because Google Drive API access requires OAuth authentication.

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Cursor Chat Cloud" (or your preferred name)
   - User support email: Your email
   - Developer contact: Your email
4. Add the following scope:
   - `https://www.googleapis.com/auth/drive.file`
5. Save and continue

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URI:
   ```
   http://localhost:3000/oauth2callback
   ```
   (You can change the port in extension settings if needed)
5. Click "Create"
6. **Copy the Client ID and Client Secret** - you'll need these for the extension

## 📖 Usage

### First Time Setup

1. Complete the Google Cloud Setup steps above
2. Install the extension
3. Open VS Code/Cursor
4. When prompted (or use Command Palette: `Cursor Chat Cloud: Sign in with Google Drive`):
   - Enter your Google OAuth Client ID
   - Enter your Google OAuth Client Secret
5. Browser will open for Google OAuth
6. Sign in with your Gmail/Google account
7. Grant permissions to access Google Drive
8. Return to VS Code - sync will start automatically!

**Note:** Your OAuth credentials (Client ID and Secret) are stored securely in VS Code settings and identify your application to Google. Your actual Google account credentials are never stored - only OAuth tokens managed by Google.

The extension will create a folder in your Google Drive at `/apps/CcCloud` (configurable in settings) to store your synced workspace data.

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
| `cursorChatCloud.driveFolderPath` | Path to Google Drive folder for sync data | `/apps/CcCloud` |
| `cursorChatCloud.googleClientId` | Google OAuth Client ID | `""` |
| `cursorChatCloud.oauthRedirectPort` | OAuth redirect callback port | `3000` |
| `cursorChatCloud.showNotifications` | Show sync notifications | `true` |
| `cursorChatCloud.logLevel` | Logging level (debug/info/warn/error) | `info` |

**Note:** The OAuth Client Secret is stored securely using VS Code's SecretStorage API and is not visible in settings.

### Default Workspace Paths

The extension automatically detects Cursor workspace locations:

- **Windows**: `%APPDATA%\Cursor\User\workspaceStorage`
- **macOS**: `~/Library/Application Support/Cursor/User/workspaceStorage`
- **Linux**: `~/.config/Cursor/User/workspaceStorage`

## 🎯 Commands

Access all commands via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `Cursor Chat Cloud: Sign in with Google Drive` - Authenticate with Google (prompts for credentials if not configured)
- `Cursor Chat Cloud: Configure OAuth Credentials` - Set up or update your OAuth credentials
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
- Verify your OAuth Client ID and Client Secret are correct
- Make sure you completed the Google Cloud setup steps
- Check that the OAuth redirect URI is configured correctly in Google Cloud Console
- Ensure you're using a valid Gmail/Google account
- Check that you granted permissions when signing in
- Try reconfiguring credentials: `Cursor Chat Cloud: Configure OAuth Credentials`
- If the issue persists, check the extension logs for details

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
- **Your Credentials**: Your OAuth Client ID and Secret are stored locally in VS Code settings and identify YOUR application to Google
- **OAuth Tokens**: Access tokens are stored securely using VS Code SecretStorage API
- **Minimal Permissions**: Only requests `drive.file` scope (access only to files created by this app)
- **No Telemetry**: This extension does not collect or send any usage data
- **Open Source**: Full source code available for inspection

**Important**: Keep your OAuth Client Secret private. Do not share it publicly or commit it to version control.

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
