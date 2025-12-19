import * as chokidar from 'chokidar';
import { Logger } from '../utils/logger';

export type FileChangeHandler = (filePath: string) => void;

export class FileWatcher {
  private logger: Logger;
  private watcher: chokidar.FSWatcher | null = null;
  private changeHandler: FileChangeHandler | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY = 2000; // 2 seconds

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Start watching a directory
   */
  start(watchPath: string, handler: FileChangeHandler): void {
    if (this.watcher) {
      this.logger.warn('File watcher already running');
      return;
    }

    this.changeHandler = handler;

    this.watcher = chokidar.watch(watchPath, {
      ignored: /(^|[/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (path) => this.handleChange('add', path))
      .on('change', (path) => this.handleChange('change', path))
      .on('unlink', (path) => this.handleChange('unlink', path))
      .on('error', (error) => this.logger.error('File watcher error', error));

    this.logger.info(`Started watching: ${watchPath}`);
  }

  /**
   * Handle file change with debouncing
   */
  private handleChange(event: string, filePath: string): void {
    this.logger.debug(`File ${event}: ${filePath}`);

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      
      if (this.changeHandler) {
        this.logger.debug(`Triggering sync for: ${filePath}`);
        this.changeHandler(filePath);
      }
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (!this.watcher) {
      return;
    }

    // Clear all pending timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    await this.watcher.close();
    this.watcher = null;
    this.changeHandler = null;

    this.logger.info('Stopped file watcher');
  }

  /**
   * Check if watcher is running
   */
  isRunning(): boolean {
    return this.watcher !== null;
  }
}
