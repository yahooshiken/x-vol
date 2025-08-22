import { execa } from 'execa';
import { MissingDependencyError, UnsupportedPlatformError } from './errors.js';
import type { Platform } from './types.js';

let cachedPlatform: Platform | null = null;
const cachedDependencies: Map<string, boolean> = new Map();

export function resetCache(): void {
  cachedPlatform = null;
  cachedDependencies.clear();
}

export function detectPlatform(): Platform {
  if (cachedPlatform) {
    return cachedPlatform;
  }

  const platform = process.platform;

  switch (platform) {
    case 'win32':
      cachedPlatform = 'windows';
      break;
    case 'darwin':
      cachedPlatform = 'macos';
      break;
    case 'linux':
      cachedPlatform = 'linux';
      break;
    default:
      throw new UnsupportedPlatformError(platform);
  }

  return cachedPlatform;
}

export async function checkDependency(command: string): Promise<boolean> {
  if (cachedDependencies.has(command)) {
    return cachedDependencies.get(command) ?? false;
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

    cachedDependencies.set(command, true);
    return true;
  } catch {
    cachedDependencies.set(command, false);
    return false;
  }
}

export async function validatePlatformDependencies(): Promise<void> {
  const platform = detectPlatform();

  switch (platform) {
    case 'windows': {
      if (!(await checkDependency('powershell'))) {
        throw new MissingDependencyError('powershell', platform);
      }
      break;
    }
    case 'macos': {
      if (!(await checkDependency('osascript'))) {
        throw new MissingDependencyError('osascript', platform);
      }
      break;
    }
    case 'linux': {
      const hasAmixer = await checkDependency('amixer');
      const hasPactl = await checkDependency('pactl');

      if (!hasAmixer && !hasPactl) {
        throw new MissingDependencyError('amixer or pactl', platform);
      }
      break;
    }
  }
}
