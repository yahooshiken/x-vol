import { execa } from 'execa';
import { SystemCommandError } from '../errors.js';
import type { AudioDevice } from '../types.js';
import { VolumeController } from '../volume-controller.js';

export class WindowsVolumeController extends VolumeController {
  private async executeCommand(
    action: string,
    device: AudioDevice,
    value?: number | boolean
  ): Promise<string> {
    let command: string;

    switch (action) {
      case 'get-volume':
        command =
          device === 'output'
            ? `try { [Math]::Round([Audio]::Volume * 100) } catch { Write-Output "0" }`
            : `try { [Math]::Round([AudioInput]::Volume * 100) } catch { Write-Output "0" }`;
        break;
      case 'set-volume':
        command =
          device === 'output'
            ? `[Audio]::Volume = ${(value as number) / 100}`
            : `[AudioInput]::Volume = ${(value as number) / 100}`;
        break;
      case 'get-mute':
        command = device === 'output' ? '[Audio]::Mute' : '[AudioInput]::Mute';
        break;
      case 'set-mute':
        command =
          device === 'output'
            ? `[Audio]::Mute = [bool]::Parse("${value}")`
            : `[AudioInput]::Mute = [bool]::Parse("${value}")`;
        break;
      default:
        throw new SystemCommandError(
          `Unknown action: ${action}`,
          new Error('Invalid action'),
          'windows'
        );
    }

    const fullScript = `
      Add-Type -TypeDefinition @'
      using System;
      using System.Runtime.InteropServices;
      [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
      interface IAudioEndpointVolume {
          int RegisterControlChangeNotify(IntPtr pNotify);
          int UnregisterControlChangeNotify(IntPtr pNotify);
          int GetChannelCount(out uint pnChannelCount);
          int SetMasterVolumeLevel(float fLevelDB, Guid pguidEventContext);
          int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
          int GetMasterVolumeLevel(out float pfLevelDB);
          int GetMasterVolumeLevelScalar(out float pfLevel);
          int SetChannelVolumeLevel(uint nChannel, float fLevelDB, Guid pguidEventContext);
          int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, Guid pguidEventContext);
          int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
          int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
          int SetMute(bool bMute, Guid pguidEventContext);
          int GetMute(out bool pbMute);
          int GetVolumeStepInfo(out uint pnStep, out uint pnStepCount);
          int VolumeStepUp(Guid pguidEventContext);
          int VolumeStepDown(Guid pguidEventContext);
          int QueryHardwareSupport(out uint pdwHardwareSupportMask);
          int GetVolumeRange(out float pflVolumeMindB, out float pflVolumeMaxdB, out float pflVolumeIncrementdB);
      }
      [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
      interface IMMDevice {
          int Activate(ref Guid id, uint dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
      }
      [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
      interface IMMDeviceEnumerator {
          int EnumAudioEndpoints(int dataFlow, int dwStateMask, out IntPtr ppDevices);
          int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppEndpoint);
      }
      [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
      class MMDeviceEnumerator { }
      public class Audio {
          static IAudioEndpointVolume Vol() {
              var deviceEnumerator = (IMMDeviceEnumerator)(new MMDeviceEnumerator());
              IMMDevice speakers;
              deviceEnumerator.GetDefaultAudioEndpoint(0, 0, out speakers);
              Guid IID_IAudioEndpointVolume = typeof(IAudioEndpointVolume).GUID;
              object o;
              speakers.Activate(ref IID_IAudioEndpointVolume, 0, IntPtr.Zero, out o);
              return (IAudioEndpointVolume)o;
          }
          public static float Volume {
              get { float v; Vol().GetMasterVolumeLevelScalar(out v); return v; }
              set { Vol().SetMasterVolumeLevelScalar(value, Guid.Empty); }
          }
          public static bool Mute {
              get { bool mute; Vol().GetMute(out mute); return mute; }
              set { Vol().SetMute(value, Guid.Empty); }
          }
      }
      public class AudioInput {
          static IAudioEndpointVolume Vol() {
              var deviceEnumerator = (IMMDeviceEnumerator)(new MMDeviceEnumerator());
              IMMDevice microphone;
              deviceEnumerator.GetDefaultAudioEndpoint(1, 0, out microphone);
              Guid IID_IAudioEndpointVolume = typeof(IAudioEndpointVolume).GUID;
              object o;
              microphone.Activate(ref IID_IAudioEndpointVolume, 0, IntPtr.Zero, out o);
              return (IAudioEndpointVolume)o;
          }
          public static float Volume {
              get { float v; Vol().GetMasterVolumeLevelScalar(out v); return v; }
              set { Vol().SetMasterVolumeLevelScalar(value, Guid.Empty); }
          }
          public static bool Mute {
              get { bool mute; Vol().GetMute(out mute); return mute; }
              set { Vol().SetMute(value, Guid.Empty); }
          }
      }
'@
      ${command}
    `;

    try {
      const result = await execa(
        'powershell',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', fullScript],
        {
          windowsHide: true,
          timeout: 5000,
        }
      );
      return result.stdout.trim();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new SystemCommandError(`powershell ${action}`, error, 'windows');
      }
      throw new SystemCommandError(`powershell ${action}`, new Error('Unknown error'), 'windows');
    }
  }

  async getVolume(device: AudioDevice): Promise<number> {
    const result = await this.executeCommand('get-volume', device);
    const volume = Math.round(Number.parseFloat(result));
    return Math.max(0, Math.min(100, volume));
  }

  protected async doSetVolume(device: AudioDevice, level: number): Promise<void> {
    await this.executeCommand('set-volume', device, level);
  }

  async getMute(device: AudioDevice): Promise<boolean> {
    const result = await this.executeCommand('get-mute', device);
    return result.toLowerCase() === 'true';
  }

  protected async doSetMute(device: AudioDevice, muted: boolean): Promise<void> {
    await this.executeCommand('set-mute', device, muted);
  }
}
