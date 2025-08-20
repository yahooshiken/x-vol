import { spawn } from 'child_process';
import { VolumeController } from '../volume-controller.js';
import { SystemCommandError } from '../errors.js';
import type { AudioDevice } from '../types.js';

export class WindowsVolumeController extends VolumeController {
  private static readonly POWERSHELL_SCRIPT = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
    int NotImpl1();
    int NotImpl2();
    int NotImpl3();
    int NotImpl4();
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

[ComImport]
[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumerator {
}

public class AudioVolumeControl {
    const int DEVICE_STATE_ACTIVE = 1;
    const int DATA_FLOW_RENDER = 0;
    const int DATA_FLOW_CAPTURE = 1;
    const int ROLE_MULTIMEDIA = 1;

    IAudioEndpointVolume outputVol = null;
    IAudioEndpointVolume inputVol = null;

    public AudioVolumeControl() {
        IMMDeviceEnumerator deviceEnumerator = (IMMDeviceEnumerator)(new MMDeviceEnumerator());
        
        // Output device
        IMMDevice speakers;
        deviceEnumerator.GetDefaultAudioEndpoint(DATA_FLOW_RENDER, ROLE_MULTIMEDIA, out speakers);
        Guid IID_IAudioEndpointVolume = typeof(IAudioEndpointVolume).GUID;
        object o;
        speakers.Activate(ref IID_IAudioEndpointVolume, 0, IntPtr.Zero, out o);
        outputVol = (IAudioEndpointVolume)o;
        
        // Input device
        IMMDevice microphone;
        deviceEnumerator.GetDefaultAudioEndpoint(DATA_FLOW_CAPTURE, ROLE_MULTIMEDIA, out microphone);
        object i;
        microphone.Activate(ref IID_IAudioEndpointVolume, 0, IntPtr.Zero, out i);
        inputVol = (IAudioEndpointVolume)i;
    }

    public float GetOutputVolume() {
        float volumeLevel;
        outputVol.GetMasterVolumeLevelScalar(out volumeLevel);
        return volumeLevel * 100;
    }

    public void SetOutputVolume(float newLevel) {
        outputVol.SetMasterVolumeLevelScalar(newLevel / 100, Guid.Empty);
    }

    public bool GetOutputMute() {
        bool mute;
        outputVol.GetMute(out mute);
        return mute;
    }

    public void SetOutputMute(bool mute) {
        outputVol.SetMute(mute, Guid.Empty);
    }

    public float GetInputVolume() {
        float volumeLevel;
        inputVol.GetMasterVolumeLevelScalar(out volumeLevel);
        return volumeLevel * 100;
    }

    public void SetInputVolume(float newLevel) {
        inputVol.SetMasterVolumeLevelScalar(newLevel / 100, Guid.Empty);
    }

    public bool GetInputMute() {
        bool mute;
        inputVol.GetMute(out mute);
        return mute;
    }

    public void SetInputMute(bool mute) {
        inputVol.SetMute(mute, Guid.Empty);
    }
}
"@

$vol = New-Object AudioVolumeControl
`;

  private async executeCommand(action: string, device: AudioDevice, value?: number | boolean): Promise<string> {
    return new Promise((resolve, reject) => {
      let script = WindowsVolumeController.POWERSHELL_SCRIPT;

      switch (action) {
        case 'get-volume':
          script += device === 'output' ? '$vol.GetOutputVolume()' : '$vol.GetInputVolume()';
          break;
        case 'set-volume':
          script += device === 'output' ? `$vol.SetOutputVolume(${value})` : `$vol.SetInputVolume(${value})`;
          break;
        case 'get-mute':
          script += device === 'output' ? '$vol.GetOutputMute()' : '$vol.GetInputMute()';
          break;
        case 'set-mute':
          script += device === 'output' ? `$vol.SetOutputMute([bool]::Parse("${value}"))` : `$vol.SetInputMute([bool]::Parse("${value}"))`;
          break;
        default:
          reject(
            new SystemCommandError(
              `Unknown action: ${action}`,
              new Error('Invalid action'),
              'windows'
            )
          );
          return;
      }

      const process = spawn('powershell', ['-Command', script], {
        windowsHide: true,
        timeout: 5000,
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(
            new SystemCommandError(
              `powershell ${action}`,
              new Error(stderr || `Process exited with code ${code}`),
              'windows'
            )
          );
        }
      });

      process.on('error', (error) => {
        reject(new SystemCommandError(`powershell ${action}`, error, 'windows'));
      });
    });
  }

  async getVolume(device: AudioDevice): Promise<number> {
    const result = await this.executeCommand('get-volume', device);
    const volume = Math.round(parseFloat(result));
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
