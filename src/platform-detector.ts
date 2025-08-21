import { execa } from 'execa';
import type { Platform } from './types.js';
import { UnsupportedPlatformError, MissingDependencyError } from './errors.js';

export class PlatformDetector {
  private static cachedPlatform: Platform | null = null;
  private static cachedDependencies: Map<string, boolean> = new Map();

  static detectPlatform(): Platform {
    if (this.cachedPlatform) {
      return this.cachedPlatform;
    }

    const platform = process.platform;

    switch (platform) {
      case 'win32':
        this.cachedPlatform = 'windows';
        break;
      case 'darwin':
        this.cachedPlatform = 'macos';
        break;
      case 'linux':
        this.cachedPlatform = 'linux';
        break;
      default:
        throw new UnsupportedPlatformError(platform);
    }

    return this.cachedPlatform;
  }

  static async checkDependency(command: string): Promise<boolean> {
    if (this.cachedDependencies.has(command)) {
      return this.cachedDependencies.get(command)!;
    }

    try {
      let args = ['--version'];
      if (command === 'osascript') {
        args = ['-e', 'return 1'];
      } else if (command === 'powershell') {
        args = ['-Command', '$PSVersionTable.PSVersion'];
      }

      await execa(command, args, {
        stdio: 'ignore',
        timeout: 5000,
      });

      this.cachedDependencies.set(command, true);
      return true;
    } catch {
      this.cachedDependencies.set(command, false);
      return false;
    }
  }

  static async validatePlatformDependencies(): Promise<void> {
    const platform = this.detectPlatform();

    switch (platform) {
      case 'windows':
        if (!(await this.checkDependency('powershell'))) {
          throw new MissingDependencyError('powershell', platform);
        }
        break;
      case 'macos':
        if (!(await this.checkDependency('osascript'))) {
          throw new MissingDependencyError('osascript', platform);
        }
        break;
      case 'linux':
        const hasAmixer = await this.checkDependency('amixer');
        const hasPactl = await this.checkDependency('pactl');

        if (!hasAmixer && !hasPactl) {
          throw new MissingDependencyError('amixer or pactl', platform);
        }
        break;
    }
  }
}
