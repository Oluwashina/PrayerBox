import type { AudioRoomClient, AudioRoomSnapshot } from '@/services/audio'
import { supportsOutputSelection } from '@/services/audio/devices'
import { useAudioDevices } from '@/hooks/useAudioDevices'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Select } from '../ui/Field'
import { InlineAlert } from '../ui/States'

interface Props {
  open: boolean
  onClose: () => void
  client: AudioRoomClient
  snapshot: AudioRoomSnapshot
  canSpeak: boolean
}

export function AudioSettingsDialog({ open, onClose, client, snapshot, canSpeak }: Props) {
  const devices = useAudioDevices(`${open}:${snapshot.microphone.status}`)
  const labelsHidden = devices.inputs.length > 0 && devices.inputs.every((d) => /^Microphone \d+$/.test(d.label))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Audio settings"
      description="Choose which microphone and speaker to use."
      size="sm"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="flex flex-col gap-5">
        {canSpeak && (
          <Field label="Microphone">
            {(p) =>
              devices.inputs.length === 0 ? (
                <p {...p} className="text-sm text-ink-500">
                  No microphones found yet. Turn your microphone on once to let the browser list your devices.
                </p>
              ) : (
                <Select
                  {...p}
                  value={snapshot.microphone.deviceId ?? ''}
                  onChange={(e) => void client.setInputDevice(e.target.value)}
                >
                  {!snapshot.microphone.deviceId && <option value="">System default</option>}
                  {devices.inputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              )
            }
          </Field>
        )}
        {canSpeak && labelsHidden && (
          <p className="-mt-3 text-sm text-ink-500">Device names appear after you allow microphone access.</p>
        )}

        {supportsOutputSelection ? (
          <Field label="Speaker">
            {(p) => (
              <Select
                {...p}
                value={snapshot.outputDeviceId ?? ''}
                onChange={(e) => void client.setOutputDevice(e.target.value)}
              >
                <option value="">System default</option>
                {devices.outputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : (
          <InlineAlert tone="info" title="Speaker choice">
            This browser plays audio through your device’s current output. To switch, connect headphones or a
            Bluetooth speaker, or use your phone’s audio settings.
          </InlineAlert>
        )}

        <p className="text-sm text-ink-500">
          For the clearest sound, use headphones and keep the volume up on your device.
        </p>
      </div>
    </Dialog>
  )
}
