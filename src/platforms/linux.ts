import { execa } from 'execa';
import { MissingDependencyError, SystemCommandError } from '../errors.js';
import type { AudioDevice } from '../types.js';
import { VolumeController } from '../volume-controller.js';

export class LinuxVolumeController extends VolumeController {
  private useAmixer: boolean | null = null;

  private async checkAudioSystem(): Promise<void> {
    if (this.useAmixer !== null) return;

    try {
      await this.executeCommand('amixer', ['--version']);
      this.useAmixer = true;
    } catch {
      try {
        await this.executeCommand('pactl', ['--version']);
        this.useAmixer = false;
      } catch {
        throw new MissingDependencyError('amixer or pactl', 'linux');
      }
    }
  }

  private async executeCommand(command: string, args: string[]): Promise<string> {
    try {
      const result = await execa(command, args, {
        timeout: 5000,
      });
      return result.stdout.trim();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new SystemCommandError(`${command} ${args.join(' ')}`, error, 'linux');
      }
      throw new SystemCommandError(
        `${command} ${args.join(' ')}`,
        new Error('Unknown error'),
        'linux'
      );
    }
  }

  private async getVolumeAmixer(device: AudioDevice): Promise<number> {
    const control = device === 'output' ? 'Master' : 'Capture';
    const result = await this.executeCommand('amixer', ['get', control]);
    const match = result.match(/\[(\d+)%\]/);
    if (!match) {
      throw new SystemCommandError(
        `amixer get ${control}`,
        new Error(`Could not parse volume from amixer output for ${device}`),
        'linux'
      );
    }
    return Number.parseInt(match[1], 10);
  }

  private async setVolumeAmixer(device: AudioDevice, level: number): Promise<void> {
    const control = device === 'output' ? 'Master' : 'Capture';
    await this.executeCommand('amixer', ['set', control, `${level}%`]);
  }

  private async getMuteAmixer(device: AudioDevice): Promise<boolean> {
    const control = device === 'output' ? 'Master' : 'Capture';
    const result = await this.executeCommand('amixer', ['get', control]);
    return result.includes('[off]');
  }

  private async setMuteAmixer(device: AudioDevice, muted: boolean): Promise<void> {
    const control = device === 'output' ? 'Master' : 'Capture';
    await this.executeCommand('amixer', ['set', control, muted ? 'mute' : 'unmute']);
  }

  private async getVolumePactl(device: AudioDevice): Promise<number> {
    const target = device === 'output' ? '@DEFAULT_SINK@' : '@DEFAULT_SOURCE@';
    const command = device === 'output' ? 'get-sink-volume' : 'get-source-volume';
    const result = await this.executeCommand('pactl', [command, target]);
    const match = result.match(/(\d+)%/);
    if (!match) {
      throw new SystemCommandError(
        `pactl ${command}`,
        new Error(`Could not parse volume from pactl output for ${device}`),
        'linux'
      );
    }
    return Number.parseInt(match[1], 10);
  }

  private async setVolumePactl(device: AudioDevice, level: number): Promise<void> {
    const target = device === 'output' ? '@DEFAULT_SINK@' : '@DEFAULT_SOURCE@';
    const command = device === 'output' ? 'set-sink-volume' : 'set-source-volume';
    await this.executeCommand('pactl', [command, target, `${level}%`]);
  }

  private async getMutePactl(device: AudioDevice): Promise<boolean> {
    const target = device === 'output' ? '@DEFAULT_SINK@' : '@DEFAULT_SOURCE@';
    const command = device === 'output' ? 'get-sink-mute' : 'get-source-mute';
    const result = await this.executeCommand('pactl', [command, target]);
    return result.includes('yes');
  }

  private async setMutePactl(device: AudioDevice, muted: boolean): Promise<void> {
    const target = device === 'output' ? '@DEFAULT_SINK@' : '@DEFAULT_SOURCE@';
    const command = device === 'output' ? 'set-sink-mute' : 'set-source-mute';
    await this.executeCommand('pactl', [command, target, muted ? '1' : '0']);
  }

  async getVolume(device: AudioDevice): Promise<number> {
    await this.checkAudioSystem();

    if (this.useAmixer) {
      return this.getVolumeAmixer(device);
    }
    return this.getVolumePactl(device);
  }

  protected async doSetVolume(device: AudioDevice, level: number): Promise<void> {
    await this.checkAudioSystem();

    if (this.useAmixer) {
      await this.setVolumeAmixer(device, level);
    } else {
      await this.setVolumePactl(device, level);
    }
  }

  async getMute(device: AudioDevice): Promise<boolean> {
    await this.checkAudioSystem();

    if (this.useAmixer) {
      return this.getMuteAmixer(device);
    }

    return this.getMutePactl(device);
  }

  protected async doSetMute(device: AudioDevice, muted: boolean): Promise<void> {
    await this.checkAudioSystem();

    if (this.useAmixer) {
      await this.setMuteAmixer(device, muted);
    } else {
      await this.setMutePactl(device, muted);
    }
  }
}
