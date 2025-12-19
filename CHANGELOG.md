# Changelog

All notable changes to the "Cursor Chat Cloud" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-19

### Added
- Initial release of Cursor Chat Cloud
- Google Drive OAuth 2.0 authentication
- Automatic workspace synchronization
- Real-time file watching with debouncing
- Bidirectional sync with conflict resolution
- Cross-platform support (Windows, macOS, Linux)
- Status bar indicator with sync status
- Configurable sync intervals
- Custom workspace path support
- Comprehensive error handling and logging
- User notifications for sync events
- Command palette integration
- Settings configuration panel

### Features
- **Authentication**: Secure OAuth 2.0 flow with token refresh
- **Sync Engine**: Timestamp-based conflict resolution with backups
- **File Watcher**: Detects changes and triggers sync automatically
- **Drive Integration**: Efficient upload/download with Google Drive API v3
- **UI Components**: Status bar, commands, and notifications
- **Configuration**: Auto-sync toggle, sync interval, custom paths, notification preferences
- **Logging**: Configurable log levels with output channel

### Commands
- `Cursor Chat Cloud: Sign in with Google Drive`
- `Cursor Chat Cloud: Sign out`
- `Cursor Chat Cloud: Sync Now`
- `Cursor Chat Cloud: Open Settings`
- `Cursor Chat Cloud: View Sync Status`

### Documentation
- Comprehensive README with setup instructions
- Google Cloud setup guide
- Troubleshooting section
- Contributing guidelines
- MIT License
