import { describe, test, expect, beforeAll } from 'bun:test';
import { getVolume, setVolume, getMute, setMute } from '../../index.js';
import { ValidationError, UnsupportedPlatformError } from '../../errors.js';

describe('x-vol integration tests', () => {
  let initialOutputVolume: number;
  let initialOutputMute: boolean;
  let initialInputVolume: number;

  beforeAll(async () => {
    try {
      initialOutputVolume = await getVolume('output');
      initialOutputMute = await getMute('output');
      initialInputVolume = await getVolume('input');
    } catch (error) {
      if (error instanceof UnsupportedPlatformError) {
        console.warn('Skipping integration tests: platform not supported');
        return;
      }
      throw error;
    }
  });

  describe('volume control', () => {
    test('should get current output volume', async () => {
      const volume = await getVolume('output');
      expect(typeof volume).toBe('number');
      expect(volume).toBeGreaterThanOrEqual(0);
      expect(volume).toBeLessThanOrEqual(100);
      expect(Number.isInteger(volume)).toBe(true);
    });

    test('should get current input volume', async () => {
      const volume = await getVolume('input');
      expect(typeof volume).toBe('number');
      expect(volume).toBeGreaterThanOrEqual(0);
      expect(volume).toBeLessThanOrEqual(100);
      expect(Number.isInteger(volume)).toBe(true);
    });

    test('should set and get output volume', async () => {
      const testVolume = 25;

      await setVolume('output', testVolume);
      const newVolume = await getVolume('output');

      expect(newVolume).toBeCloseTo(testVolume, 0);
    });

    test('should handle edge case volumes', async () => {
      await setVolume('output', 0);
      let volume = await getVolume('output');
      expect(volume).toBe(0);

      await setVolume('output', 100);
      volume = await getVolume('output');
      expect(volume).toBe(100);
    });

    test('should reject invalid volume values', async () => {
      await expect(setVolume('output', -1)).rejects.toThrow(ValidationError);
      await expect(setVolume('output', 101)).rejects.toThrow(ValidationError);
      await expect(setVolume('output', 50.5)).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(setVolume('output', '50')).rejects.toThrow(ValidationError);
    });
  });

  describe('mute control', () => {
    test('should get current output mute state', async () => {
      const muted = await getMute('output');
      expect(typeof muted).toBe('boolean');
    });

    test('should set and get output mute state', async () => {
      await setMute('output', true);
      let muted = await getMute('output');
      expect(muted).toBe(true);

      await setMute('output', false);
      muted = await getMute('output');
      expect(muted).toBe(false);
    });

    test('should reject invalid mute values', async () => {
      // @ts-expect-error Testing invalid types
      await expect(setMute('output', 'true')).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(setMute('output', 1)).rejects.toThrow(ValidationError);
      // @ts-expect-error Testing invalid types
      await expect(setMute('output', null)).rejects.toThrow(ValidationError);
    });
  });

  describe('cleanup', () => {
    test('should restore initial state', async () => {
      if (typeof initialOutputVolume === 'number' && typeof initialOutputMute === 'boolean') {
        await setMute('output', initialOutputMute);
        await setVolume('output', initialOutputVolume);

        const finalVolume = await getVolume('output');
        const finalMute = await getMute('output');

        expect(finalVolume).toBeCloseTo(initialOutputVolume, 0);
        expect(finalMute).toBe(initialOutputMute);
      }
    });
  });
});
