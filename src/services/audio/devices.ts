export interface AudioDevice {
  deviceId: string
  label: string
}

export const supportsOutputSelection =
  typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype

export async function listAudioDevices(): Promise<{ inputs: AudioDevice[]; outputs: AudioDevice[] }> {
  if (!navigator.mediaDevices?.enumerateDevices) return { inputs: [], outputs: [] }
  const devices = await navigator.mediaDevices.enumerateDevices()
  const map = (kind: MediaDeviceKind, fallback: string) =>
    devices
      .filter((d) => d.kind === kind && d.deviceId)
      .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `${fallback} ${i + 1}` }))
  return { inputs: map('audioinput', 'Microphone'), outputs: map('audiooutput', 'Speaker') }
}

export function onDeviceChange(listener: () => void) {
  navigator.mediaDevices?.addEventListener?.('devicechange', listener)
  return () => navigator.mediaDevices?.removeEventListener?.('devicechange', listener)
}
