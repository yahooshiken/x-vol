import type { ErrorInfo, Platform } from './types.js';

export class XVolError extends Error {
  public readonly code: string;
  public readonly platform?: Platform;
  public readonly command?: string;
  public readonly originalError?: Error;

  constructor(info: ErrorInfo) {
    super(info.message);
    this.name = this.constructor.name;
    this.code = info.code;
    this.platform = info.platform;
    this.command = info.command;
    this.originalError = info.originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class UnsupportedPlatformError extends XVolError {
  constructor(platform: string) {
    super({
      code: 'UNSUPPORTED_PLATFORM',
      message: `Platform '${platform}' is not supported. Supported platforms: windows, macos, linux`,
    });
  }
}

export class SystemCommandError extends XVolError {
  constructor(command: string, originalError: Error, platform?: Platform) {
    super({
      code: 'SYSTEM_COMMAND_ERROR',
      message: `System command failed: ${command}. ${originalError.message}`,
      platform,
      command,
      originalError,
    });
  }
}

export class ValidationError extends XVolError {
  constructor(message: string, value?: unknown) {
    super({
      code: 'VALIDATION_ERROR',
      message: `Validation failed: ${message}${value !== undefined ? ` (received: ${value})` : ''}`,
    });
  }
}

export class MissingDependencyError extends XVolError {
  constructor(dependency: string, platform?: Platform) {
    super({
      code: 'MISSING_DEPENDENCY',
      message: `Required system utility '${dependency}' is not available. Please install it to use x-vol on this system.`,
      platform,
    });
  }
}
