import { PlatformDetector } from './platform-detector.js';
import { WindowsVolumeController } from './platforms/windows.js';
import { MacOSVolumeController } from './platforms/macos.js';
import { LinuxVolumeController } from './platforms/linux.js';
import type { VolumeController, AudioDevice } from './types.js';

let cachedController: VolumeController | null = null;

function createVolumeController(): VolumeController {
  if (cachedController) {
    return cachedController;
  }

  const platform = PlatformDetector.detectPlatform();

  switch (platform) {
    case 'windows':
      cachedController = new WindowsVolumeController();
      break;
    case 'macos':
      cachedController = new MacOSVolumeController();
      break;
    case 'linux':
      cachedController = new LinuxVolumeController();
      break;
  }

  return cachedController;
}

export async function getVolume(device: AudioDevice): Promise<number> {
  await PlatformDetector.validatePlatformDependencies();
  const controller = createVolumeController();
  return controller.getVolume(device);
}

export async function setVolume(device: AudioDevice, level: number): Promise<void> {
  await PlatformDetector.validatePlatformDependencies();
  const controller = createVolumeController();
  return controller.setVolume(device, level);
}

export async function getMute(device: AudioDevice): Promise<boolean> {
  await PlatformDetector.validatePlatformDependencies();
  const controller = createVolumeController();
  return controller.getMute(device);
}

export async function setMute(device: AudioDevice, muted: boolean): Promise<void> {
  await PlatformDetector.validatePlatformDependencies();
  const controller = createVolumeController();
  return controller.setMute(device, muted);
}

export * from './types.js';
export * from './errors.js';
