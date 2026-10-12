import { MediaDeviceFailure } from 'livekit-client'
import type { MicrophoneErrorCode } from './types'

export function microphoneSupported() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext
}

export function toMicrophoneError(error: unknown): MicrophoneErrorCode {
  if (!microphoneSupported()) return 'unsupported'
  if (error instanceof Error && /permission|not allowed to publish|insufficient/i.test(error.message) && !(error instanceof DOMException)) {
    return 'not-permitted'
  }
  switch (MediaDeviceFailure.getFailure(error)) {
    case MediaDeviceFailure.PermissionDenied:
      return 'permission-denied'
    case MediaDeviceFailure.NotFound:
      return 'no-device'
    case MediaDeviceFailure.DeviceInUse:
      return 'in-use'
    default:
      return 'unknown'
  }
}

export const microphoneErrorCopy: Record<MicrophoneErrorCode, { title: string; body: string }> = {
  'permission-denied': {
    title: 'Microphone access is blocked',
    body: 'To pray aloud, allow microphone access. Tap the lock or settings icon next to the web address, set Microphone to "Allow", then try again. You can keep listening without it.',
  },
  'no-device': {
    title: 'No microphone found',
    body: 'We could not find a microphone. Plug in a headset or check your device settings, then try again.',
  },
  'in-use': {
    title: 'Microphone is busy',
    body: 'Another app (such as a phone call or video app) may be using your microphone. Close it and try again.',
  },
  unsupported: {
    title: 'Microphone not supported here',
    body: 'This browser cannot use the microphone on this page. Try the latest Chrome, Safari, or Edge, and make sure the link starts with https://.',
  },
  'not-permitted': {
    title: 'You are not able to speak right now',
    body: 'The host has not given you permission to speak in this session.',
  },
  unknown: {
    title: 'Microphone could not start',
    body: 'Something went wrong while starting your microphone. Please try again.',
  },
}
