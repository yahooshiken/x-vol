import type { VolumeController as IVolumeController, AudioDevice } from './types.js';
import { ValidationError } from './errors.js';

export abstract class VolumeController implements IVolumeController {
  protected validateVolumeLevel(level: number): void {
    if (typeof level !== 'number') {
      throw new ValidationError('Volume level must be a number', level);
    }

    if (!Number.isInteger(level)) {
      throw new ValidationError('Volume level must be an integer', level);
    }

    if (level < 0 || level > 100) {
      throw new ValidationError('Volume level must be between 0 and 100', level);
    }
  }

  protected validateMuteState(muted: boolean): void {
    if (typeof muted !== 'boolean') {
      throw new ValidationError('Mute state must be a boolean', muted);
    }
  }

  protected validateAudioDevice(device: AudioDevice): void {
    if (device !== 'output' && device !== 'input') {
      throw new ValidationError('Audio device must be "output" or "input"', device);
    }
  }

  async setVolume(device: AudioDevice, level: number): Promise<void> {
    this.validateAudioDevice(device);
    this.validateVolumeLevel(level);
    return this.doSetVolume(device, level);
  }

  async setMute(device: AudioDevice, muted: boolean): Promise<void> {
    this.validateAudioDevice(device);
    this.validateMuteState(muted);
    return this.doSetMute(device, muted);
  }

  abstract getVolume(device: AudioDevice): Promise<number>;
  abstract getMute(device: AudioDevice): Promise<boolean>;
  protected abstract doSetVolume(device: AudioDevice, level: number): Promise<void>;
  protected abstract doSetMute(device: AudioDevice, muted: boolean): Promise<void>;
}
