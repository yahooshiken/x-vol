import { describe, test, expect, beforeEach } from 'bun:test';
import { VolumeController } from '../../volume-controller.js';
import { ValidationError } from '../../errors.js';
import type { AudioDevice } from '../../types.js';

class TestVolumeController extends VolumeController {
  async getVolume(device: AudioDevice): Promise<number> {
    return 50;
  }

  async getMute(device: AudioDevice): Promise<boolean> {
    return false;
  }

  protected async doSetVolume(device: AudioDevice, level: number): Promise<void> {
    // Mock implementation
  }

  protected async doSetMute(device: AudioDevice, muted: boolean): Promise<void> {
    // Mock implementation
  }
}

describe('VolumeController', () => {
  let controller: TestVolumeController;

  beforeEach(() => {
    controller = new TestVolumeController();
  });

  describe('setVolume', () => {
    test('should accept valid volume levels for output device', async () => {
      await expect(controller.setVolume('output', 0)).resolves.toBeUndefined();
      await expect(controller.setVolume('output', 50)).resolves.toBeUndefined();
      await expect(controller.setVolume('output', 100)).resolves.toBeUndefined();
    });

    test('should accept valid volume levels for input device', async () => {
      await expect(controller.setVolume('input', 0)).resolves.toBeUndefined();
      await expect(controller.setVolume('input', 50)).resolves.toBeUndefined();
      await expect(controller.setVolume('input', 100)).resolves.toBeUndefined();
    });

    test('should reject invalid device types', async () => {
      // @ts-expect-error Testing invalid types
      await expect(controller.setVolume('speaker', 50)).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(controller.setVolume('microphone', 50)).rejects.toThrow(ValidationError);
    });

    test('should reject non-number values', async () => {
      // @ts-expect-error Testing invalid types
      await expect(controller.setVolume('output', '50')).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(controller.setVolume('output', null)).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(controller.setVolume('output', undefined)).rejects.toThrow(ValidationError);
    });

    test('should reject non-integer values', async () => {
      await expect(controller.setVolume('output', 50.5)).rejects.toThrow(ValidationError);
      await expect(controller.setVolume('output', Math.PI)).rejects.toThrow(ValidationError);
    });

    test('should reject values outside 0-100 range', async () => {
      await expect(controller.setVolume('output', -1)).rejects.toThrow(ValidationError);
      await expect(controller.setVolume('output', 101)).rejects.toThrow(ValidationError);
      await expect(controller.setVolume('output', -100)).rejects.toThrow(ValidationError);
      await expect(controller.setVolume('output', 1000)).rejects.toThrow(ValidationError);
    });
  });

  describe('setMute', () => {
    test('should accept boolean values for output device', async () => {
      await expect(controller.setMute('output', true)).resolves.toBeUndefined();
      await expect(controller.setMute('output', false)).resolves.toBeUndefined();
    });

    test('should accept boolean values for input device', async () => {
      await expect(controller.setMute('input', true)).resolves.toBeUndefined();
      await expect(controller.setMute('input', false)).resolves.toBeUndefined();
    });

    test('should reject invalid device types', async () => {
      // @ts-expect-error Testing invalid types
      await expect(controller.setMute('speaker', true)).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(controller.setMute('microphone', true)).rejects.toThrow(ValidationError);
    });

    test('should reject non-boolean values', async () => {
      // @ts-expect-error Testing invalid types
      await expect(controller.setMute('output', 'true')).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(controller.setMute('output', 1)).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(controller.setMute('output', 0)).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(controller.setMute('output', null)).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(controller.setMute('output', undefined)).rejects.toThrow(ValidationError);
    });
  });
});
