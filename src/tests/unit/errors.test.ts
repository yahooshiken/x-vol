import { describe, expect, test } from 'bun:test';
import {
  MissingDependencyError,
  SystemCommandError,
  UnsupportedPlatformError,
  ValidationError,
  XVolError,
} from '../../errors.js';

describe('XVolError', () => {
  test('should create error with all properties', () => {
    const originalError = new Error('Original error');
    const error = new XVolError({
      code: 'TEST_ERROR',
      message: 'Test error message',
      platform: 'windows',
      command: 'test command',
      originalError,
    });

    expect(error.name).toBe('XVolError');
    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.platform).toBe('windows');
    expect(error.command).toBe('test command');
    expect(error.originalError).toBe(originalError);
  });
});

describe('UnsupportedPlatformError', () => {
  test('should create error for unsupported platform', () => {
    const unsupportedPlatform = 'freebsd';
    const error = new UnsupportedPlatformError(unsupportedPlatform);

    expect(error.name).toBe('UnsupportedPlatformError');
    expect(error.code).toBe('UNSUPPORTED_PLATFORM');
    expect(error.message).toContain('freebsd');
    expect(error.message).toContain('not supported');
  });
});

describe('SystemCommandError', () => {
  test('should create error for system command failure', () => {
    const originalError = new Error('Command failed');
    const error = new SystemCommandError('test command', originalError, 'linux');

    expect(error.name).toBe('SystemCommandError');
    expect(error.code).toBe('SYSTEM_COMMAND_ERROR');
    expect(error.message).toContain('test command');
    expect(error.message).toContain('Command failed');
    expect(error.platform).toBe('linux');
    expect(error.command).toBe('test command');
    expect(error.originalError).toBe(originalError);
  });
});

describe('ValidationError', () => {
  test('should create error for validation failure', () => {
    const error = new ValidationError('Invalid value', 150);

    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toContain('Invalid value');
    expect(error.message).toContain('150');
  });

  test('should create error without value', () => {
    const error = new ValidationError('Invalid input');

    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toContain('Invalid input');
    expect(error.message).not.toContain('received:');
  });
});

describe('MissingDependencyError', () => {
  test('should create error for missing dependency', () => {
    const error = new MissingDependencyError('amixer', 'linux');

    expect(error.name).toBe('MissingDependencyError');
    expect(error.code).toBe('MISSING_DEPENDENCY');
    expect(error.message).toContain('amixer');
    expect(error.message).toContain('not available');
    expect(error.platform).toBe('linux');
  });

  test('should create error without platform', () => {
    const error = new MissingDependencyError('powershell');

    expect(error.name).toBe('MissingDependencyError');
    expect(error.code).toBe('MISSING_DEPENDENCY');
    expect(error.message).toContain('powershell');
    expect(error.platform).toBeUndefined();
  });
});
