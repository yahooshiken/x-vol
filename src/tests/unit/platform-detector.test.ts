import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { MissingDependencyError, UnsupportedPlatformError } from '../../errors.js';
import { PlatformDetector } from '../../platform-detector.js';

describe('PlatformDetector', () => {
  beforeEach(() => {
    // Reset cached values
    // @ts-expect-error Accessing private static members for testing
    PlatformDetector.cachedPlatform = null;
    // @ts-expect-error Accessing private static members for testing
    PlatformDetector.cachedDependencies.clear();
  });

  describe('detectPlatform', () => {
    test('should detect Windows platform', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const platform = PlatformDetector.detectPlatform();
      expect(platform).toBe('windows');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should detect macOS platform', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const platform = PlatformDetector.detectPlatform();
      expect(platform).toBe('macos');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should detect Linux platform', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const platform = PlatformDetector.detectPlatform();
      expect(platform).toBe('linux');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should throw error for unsupported platform', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'freebsd' });

      expect(() => PlatformDetector.detectPlatform()).toThrow(UnsupportedPlatformError);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should cache platform detection result', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const platform1 = PlatformDetector.detectPlatform();
      const platform2 = PlatformDetector.detectPlatform();

      expect(platform1).toBe('linux');
      expect(platform2).toBe('linux');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('checkDependency', () => {
    test('should return true for existing command', async () => {
      const result = await PlatformDetector.checkDependency('node');
      expect(result).toBe(true);
    });

    test('should return false for non-existing command', async () => {
      const result = await PlatformDetector.checkDependency('nonexistentcommand123');
      expect(result).toBe(false);
    });

    test('should cache dependency check results', async () => {
      const result1 = await PlatformDetector.checkDependency('node');
      const result2 = await PlatformDetector.checkDependency('node');

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });
});
