import { execa } from 'execa';
import { MissingDependencyError, UnsupportedPlatformError } from './errors.js';
import type { Platform } from './types.js';

export class PlatformDetector {
  private static cachedPlatform: Platform | null = null;
  private static cachedDependencies: Map<string, boolean> = new Map();

  static detectPlatform(): Platform {
    if (PlatformDetector.cachedPlatform) {
      return PlatformDetector.cachedPlatform;
    }

    const platform = process.platform;

    switch (platform) {
      case 'win32':
        PlatformDetector.cachedPlatform = 'windows';
        break;
      case 'darwin':
        PlatformDetector.cachedPlatform = 'macos';
        break;
      case 'linux':
        PlatformDetector.cachedPlatform = 'linux';
        break;
      default:
        throw new UnsupportedPlatformError(platform);
    }

    return PlatformDetector.cachedPlatform;
  }

  static async checkDependency(command: string): Promise<boolean> {
    if (PlatformDetector.cachedDependencies.has(command)) {
      return PlatformDetector.cachedDependencies.get(command) ?? false;
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

      PlatformDetector.cachedDependencies.set(command, true);
      return true;
    } catch {
      PlatformDetector.cachedDependencies.set(command, false);
      return false;
    }
  }

  static async validatePlatformDependencies(): Promise<void> {
    const platform = PlatformDetector.detectPlatform();

    switch (platform) {
      case 'windows': {
        if (!(await PlatformDetector.checkDependency('powershell'))) {
          throw new MissingDependencyError('powershell', platform);
        }
        break;
      }
      case 'macos': {
        if (!(await PlatformDetector.checkDependency('osascript'))) {
          throw new MissingDependencyError('osascript', platform);
        }
        break;
      }
      case 'linux': {
        const hasAmixer = await PlatformDetector.checkDependency('amixer');
        const hasPactl = await PlatformDetector.checkDependency('pactl');

        if (!hasAmixer && !hasPactl) {
          throw new MissingDependencyError('amixer or pactl', platform);
        }
        break;
      }
    }
  }
}
