import { useEffect, useState } from 'react'
import { listAudioDevices, onDeviceChange, type AudioDevice } from '@/services/audio/devices'

/** Device labels are only available after microphone permission is granted. */
export function useAudioDevices(refreshKey: unknown) {
  const [devices, setDevices] = useState<{ inputs: AudioDevice[]; outputs: AudioDevice[] }>({
    inputs: [],
    outputs: [],
  })

  useEffect(() => {
    let active = true
    const refresh = () =>
      listAudioDevices()
        .then((d) => active && setDevices(d))
        .catch(() => undefined)
    void refresh()
    const off = onDeviceChange(refresh)
    return () => {
      active = false
      off()
    }
  }, [refreshKey])

  return devices
}
