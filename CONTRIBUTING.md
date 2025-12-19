# Contributing to Cursor Chat Cloud

Thank you for your interest in contributing to Cursor Chat Cloud! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:

1. **Clear title**: Describe the issue concisely
2. **Steps to reproduce**: List the exact steps to reproduce the bug
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Environment**:
   - OS (Windows/macOS/Linux)
   - VS Code/Cursor version
   - Extension version
6. **Logs**: Include relevant logs from the Output panel

### Suggesting Features

Feature requests are welcome! Please create an issue with:

1. **Clear description**: What feature you'd like to see
2. **Use case**: Why this feature would be useful
3. **Examples**: Similar features in other tools (if applicable)
4. **Implementation ideas**: If you have thoughts on how it could work

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**:
   - Follow the code style (see below)
   - Add tests if applicable
   - Update documentation
4. **Test your changes**:
   - Build the extension: `npm run build`
   - Test in Extension Development Host (F5)
5. **Commit your changes**:
   ```bash
   git commit -m "Add: brief description of changes"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** on GitHub

## 🔧 Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- VS Code or Cursor IDE
- Git

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/skitzo2000/cursor-chat-cloud.git
   cd cursor-chat-cloud
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Watch for changes** (during development):
   ```bash
   npm run watch
   ```

5. **Run the extension**:
   - Press `F5` in VS Code
   - This opens a new Extension Development Host window
   - Test your changes there

### Project Structure

```
cursor-chat-cloud/
├── src/
│   ├── extension.ts          # Main entry point
│   ├── auth/                 # Authentication logic
│   ├── sync/                 # Sync engine and file watcher
│   ├── drive/                # Google Drive integration
│   ├── workspace/            # Workspace management
│   ├── ui/                   # UI components
│   └── utils/                # Utilities
├── dist/                     # Built extension (generated)
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
└── esbuild.js                # Build configuration
```

## 📝 Code Style

### TypeScript Guidelines

- Use TypeScript for all code
- Enable strict mode
- Use explicit types (avoid `any` when possible)
- Use async/await instead of callbacks
- Use arrow functions for inline functions
- Use meaningful variable and function names

### Formatting

- Indentation: 2 spaces
- Line length: 100 characters max
- Use single quotes for strings
- Add semicolons
- Add JSDoc comments for public methods

### Example

```typescript
/**
 * Upload file to Google Drive
 * @param filePath Local file path
 * @param fileName Name for the file in Drive
 * @returns File ID from Google Drive
 */
async uploadFile(filePath: string, fileName: string): Promise<string> {
  try {
    const fileId = await this.driveClient.uploadFile(filePath, fileName);
    this.logger.info(`Uploaded: ${fileName}`);
    return fileId;
  } catch (error) {
    this.logger.error(`Upload failed: ${fileName}`, error);
    throw error;
  }
}
```

### Naming Conventions

- **Classes**: PascalCase (e.g., `SyncEngine`, `DriveClient`)
- **Functions/Methods**: camelCase (e.g., `syncNow`, `uploadFile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `CLIENT_ID`, `REDIRECT_URI`)
- **Private members**: prefix with underscore if needed (e.g., `_authClient`)
- **Interfaces**: PascalCase (e.g., `TokenData`, `WorkspaceFile`)

## 🧪 Testing

### Manual Testing

1. Build the extension
2. Press F5 to launch Extension Development Host
3. Test the following scenarios:
   - Sign in/sign out
   - Sync now command
   - Automatic sync on file change
   - View status
   - Settings changes
   - Error handling

### Testing Checklist

- [ ] Sign in works correctly
- [ ] Files are uploaded to Google Drive
- [ ] Files are downloaded from Google Drive
- [ ] Conflict resolution works
- [ ] Status bar updates correctly
- [ ] Commands execute without errors
- [ ] Settings changes take effect
- [ ] Error messages are user-friendly
- [ ] Logs provide useful debugging info

## 📚 Documentation

### When to Update Documentation

Update documentation when:
- Adding new features
- Changing existing behavior
- Fixing bugs that affect usage
- Adding new configuration options
- Adding new commands

### Documentation Files

- **README.md**: User-facing documentation
- **CHANGELOG.md**: Version history
- **CONTRIBUTING.md**: This file
- **Code comments**: JSDoc for public APIs

## 🐛 Debugging

### View Logs

1. Open VS Code Output panel (View > Output)
2. Select "Cursor Chat Cloud" from the dropdown
3. Set log level to "debug" in settings

### Common Issues

- **Extension not activating**: Check the Extension Development Host console
- **Commands not working**: Verify command registration in extension.ts
- **Sync failures**: Check authentication and Drive API quota
- **Build errors**: Delete `node_modules` and `dist`, then reinstall

## 📋 Commit Message Guidelines

Use conventional commit format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add custom workspace path support
fix: resolve conflict resolution issue
docs: update README with troubleshooting section
refactor: simplify sync engine logic
```

## 🔍 Code Review Process

Pull requests will be reviewed for:

1. **Functionality**: Does it work as intended?
2. **Code quality**: Is the code clean and maintainable?
3. **Testing**: Has it been tested?
4. **Documentation**: Is documentation updated?
5. **Style**: Does it follow code style guidelines?
6. **Performance**: Are there any performance concerns?
7. **Security**: Are there any security issues?

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 💬 Questions?

If you have questions:
- Create a GitHub issue with the "question" label
- Tag maintainers in your PR for guidance

## 🙏 Thank You!

Your contributions help make Cursor Chat Cloud better for everyone!
