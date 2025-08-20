# x-vol

A modern, cross-platform audio volume controller for Node.js applications. Control both output (speakers) and input (microphone) volume on Windows, macOS, and Linux with a unified API.

## Features

- **Cross-platform support**: Works on Windows 11+, macOS 15+, and Ubuntu 24.02+
- **Dual device support**: Control both output (speakers/headphones) and input (microphone) devices
- **Unified API**: Same interface across all platforms with clear device specification
- **TypeScript support**: Full type definitions included
- **Modern architecture**: Built with bun, TypeScript, and biome
- **Native system integration**: Uses PowerShell on Windows, osascript on macOS, and ALSA/PulseAudio on Linux
- **Error handling**: Comprehensive error types for robust applications
- **Zero dependencies**: Self-contained implementation using only native system commands

## Installation

```bash
npm install x-vol
```

## Quick Start

```typescript
import { getVolume, setVolume, getMute, setMute } from 'x-vol';

// Get current output volume (speakers) (0-100)
const outputVolume = await getVolume('output');
console.log(`Current output volume: ${outputVolume}%`);

// Get current input volume (microphone) (0-100)
const inputVolume = await getVolume('input');
console.log(`Current input volume: ${inputVolume}%`);

// Set speaker volume to 50%
await setVolume('output', 50);

// Set microphone volume to 75%
await setVolume('input', 75);

// Check if speakers are muted
const isSpeakerMuted = await getMute('output');
console.log(`Speakers muted: ${isSpeakerMuted}`);

// Check if microphone is muted
const isMicMuted = await getMute('input');
console.log(`Microphone muted: ${isMicMuted}`);

// Mute the speakers
await setMute('output', true);

// Mute the microphone
await setMute('input', true);
```

## API Reference

### `getVolume(device: 'output' | 'input'): Promise<number>`

Returns the current volume level for the specified audio device as a number between 0 and 100.

**Parameters:**
- `device` ('output' | 'input'): Audio device type - 'output' for speakers/headphones, 'input' for microphone

### `setVolume(device: 'output' | 'input', level: number): Promise<void>`

Sets the volume level for the specified audio device. The level must be an integer between 0 and 100.

**Parameters:**
- `device` ('output' | 'input'): Audio device type - 'output' for speakers/headphones, 'input' for microphone
- `level` (number): Volume level from 0 (silent) to 100 (maximum)

**Throws:**
- `ValidationError`: If device is not 'output' or 'input'
- `ValidationError`: If level is not a valid integer between 0-100

### `getMute(device: 'output' | 'input'): Promise<boolean>`

Returns the current mute state of the specified audio device.

**Parameters:**
- `device` ('output' | 'input'): Audio device type - 'output' for speakers/headphones, 'input' for microphone

**Returns:**
- `true` if the device is muted
- `false` if the device is not muted

### `setMute(device: 'output' | 'input', muted: boolean): Promise<void>`

Sets the mute state for the specified audio device.

**Parameters:**
- `device` ('output' | 'input'): Audio device type - 'output' for speakers/headphones, 'input' for microphone
- `muted` (boolean): `true` to mute, `false` to unmute

**Throws:**
- `ValidationError`: If device is not 'output' or 'input'
- `ValidationError`: If muted is not a boolean value

## Error Handling

x-vol provides specific error types for different failure scenarios:

```typescript
import { 
  setVolume, 
  UnsupportedPlatformError, 
  MissingDependencyError, 
  SystemCommandError, 
  ValidationError 
} from 'x-vol';

try {
  await setVolume('output', 75);
} catch (error) {
  if (error instanceof UnsupportedPlatformError) {
    console.error('This platform is not supported');
  } else if (error instanceof MissingDependencyError) {
    console.error('Required system utility is missing:', error.message);
  } else if (error instanceof SystemCommandError) {
    console.error('System command failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  }
}
```

### Error Types

- **`UnsupportedPlatformError`**: Thrown when running on an unsupported operating system
- **`MissingDependencyError`**: Thrown when required system utilities are not available
- **`SystemCommandError`**: Thrown when system commands fail to execute
- **`ValidationError`**: Thrown when invalid parameters are provided

## Platform Requirements

### Windows (11+)
- PowerShell (included with Windows)
- Uses Windows Core Audio API through PowerShell

### macOS (15+)
- osascript (included with macOS)
- Uses AppleScript for system volume control

### Linux (Ubuntu 24.02+)
- ALSA utils (`amixer`) or PulseAudio (`pactl`)
- Install with: `sudo apt install alsa-utils` or `sudo apt install pulseaudio-utils`

## Development

Built with modern tools:
- **Runtime**: bun
- **Language**: TypeScript with strict mode
- **Linting & Formatting**: biome
- **Testing**: bun test

### Building

```bash
bun install
bun run build
```

### Testing

```bash
bun test
```

### Linting

```bash
bun run lint
bun run format
```

## License

MIT
