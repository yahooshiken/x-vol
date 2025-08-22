import { detectPlatform, validatePlatformDependencies } from './platform-detector.js';
import { LinuxVolumeController } from './platforms/linux.js';
import { MacOSVolumeController } from './platforms/macos.js';
import { WindowsVolumeController } from './platforms/windows.js';
import type { AudioDevice, VolumeController } from './types.js';

let cachedController: VolumeController | null = null;

function createVolumeController(): VolumeController {
  if (cachedController) {
    return cachedController;
  }

  const platform = detectPlatform();

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
  await validatePlatformDependencies();
  const controller = createVolumeController();
  return controller.getVolume(device);
}

export async function setVolume(device: AudioDevice, level: number): Promise<void> {
  await validatePlatformDependencies();
  const controller = createVolumeController();
  return controller.setVolume(device, level);
}

export async function getMute(device: AudioDevice): Promise<boolean> {
  await validatePlatformDependencies();
  const controller = createVolumeController();
  return controller.getMute(device);
}

export async function setMute(device: AudioDevice, muted: boolean): Promise<void> {
  await validatePlatformDependencies();
  const controller = createVolumeController();
  return controller.setMute(device, muted);
}

export * from './types.js';
export * from './errors.js';
