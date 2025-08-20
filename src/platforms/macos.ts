import { spawn } from 'child_process';
import { VolumeController } from '../volume-controller.js';
import { SystemCommandError } from '../errors.js';
import type { AudioDevice } from '../types.js';

export class MacOSVolumeController extends VolumeController {
  private async executeOsaScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('osascript', ['-e', script], {
        timeout: 5000,
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(
            new SystemCommandError(
              `osascript -e "${script}"`,
              new Error(stderr || `Process exited with code ${code}`),
              'macos'
            )
          );
        }
      });

      process.on('error', (error) => {
        reject(new SystemCommandError(`osascript -e "${script}"`, error, 'macos'));
      });
    });
  }

  async getVolume(device: AudioDevice): Promise<number> {
    const script = 'get volume settings';
    const result = await this.executeOsaScript(script);
    
    if (device === 'output') {
      const match = result.match(/output volume:(\d+)/);
      if (!match) {
        throw new SystemCommandError(script, new Error('Could not parse output volume'), 'macos');
      }
      const volume = parseInt(match[1], 10);
      return Math.max(0, Math.min(100, isNaN(volume) ? 0 : volume));
    } else {
      const match = result.match(/input volume:(\d+)/);
      if (!match) {
        throw new SystemCommandError(script, new Error('Could not parse input volume'), 'macos');
      }
      const volume = parseInt(match[1], 10);
      return Math.max(0, Math.min(100, isNaN(volume) ? 0 : volume));
    }
  }

  protected async doSetVolume(device: AudioDevice, level: number): Promise<void> {
    if (device === 'output') {
      const script = `set volume output volume ${level}`;
      await this.executeOsaScript(script);
    } else {
      const script = `set volume input volume ${level}`;
      await this.executeOsaScript(script);
    }
  }

  async getMute(device: AudioDevice): Promise<boolean> {
    const script = 'get volume settings';
    const result = await this.executeOsaScript(script);
    
    if (device === 'output') {
      const match = result.match(/output muted:(true|false)/);
      if (!match) {
        throw new SystemCommandError(script, new Error('Could not parse output mute state'), 'macos');
      }
      return match[1] === 'true';
    } else {
      // macOS doesn't expose input mute state through AppleScript, return false
      return false;
    }
  }

  protected async doSetMute(device: AudioDevice, muted: boolean): Promise<void> {
    if (device === 'output') {
      const script = `set volume ${muted ? 'with' : 'without'} output muted`;
      await this.executeOsaScript(script);
    } else {
      // macOS doesn't support setting input mute through AppleScript
      // This is a limitation of the platform
      console.warn('Setting input mute is not supported on macOS through AppleScript');
    }
  }
}
