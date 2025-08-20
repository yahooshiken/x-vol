export type Platform = 'windows' | 'macos' | 'linux';
export type AudioDevice = 'output' | 'input';

export interface VolumeInfo {
  level: number;
  muted: boolean;
}

export interface VolumeController {
  getVolume(device: AudioDevice): Promise<number>;
  setVolume(device: AudioDevice, level: number): Promise<void>;
  getMute(device: AudioDevice): Promise<boolean>;
  setMute(device: AudioDevice, muted: boolean): Promise<void>;
}

export interface ErrorInfo {
  code: string;
  message: string;
  platform?: Platform;
  command?: string;
  originalError?: Error;
}
