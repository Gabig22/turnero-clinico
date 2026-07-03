import { useCallback, useEffect, useRef, useState } from 'react'

import type { TurneroEvent } from '@/types'

type BrowserAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

export function useTurneroDing(events: TurneroEvent[], enabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const latestSeenEventIdRef = useRef<string | null>(null)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [needsAudioActivation, setNeedsAudioActivation] = useState(enabled)

  const getAudioContext = useCallback(() => {
    const audioWindow = window as BrowserAudioWindow
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext

    if (!AudioContextConstructor) {
      throw new Error('Audio no disponible en este navegador.')
    }

    audioContextRef.current ??= new AudioContextConstructor()

    return audioContextRef.current
  }, [])

  const playDing = useCallback(async () => {
    const context = getAudioContext()

    if (context.state === 'suspended') {
      await context.resume()
    }

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now)
    oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.18)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.3)

    setIsAudioReady(true)
    setNeedsAudioActivation(false)
  }, [getAudioContext])

  const enableAudio = useCallback(async () => {
    try {
      await playDing()
    } catch {
      setIsAudioReady(false)
      setNeedsAudioActivation(true)
    }
  }, [playDing])

  useEffect(() => {
    if (!enabled) {
      setNeedsAudioActivation(false)
      return
    }

    if (!isAudioReady) {
      setNeedsAudioActivation(true)
    }
  }, [enabled, isAudioReady])

  useEffect(() => {
    const latestEvent = events[0]

    if (!latestEvent) {
      return
    }

    if (!latestSeenEventIdRef.current) {
      latestSeenEventIdRef.current = latestEvent.id
      return
    }

    if (latestSeenEventIdRef.current === latestEvent.id) {
      return
    }

    latestSeenEventIdRef.current = latestEvent.id

    if (!enabled) {
      return
    }

    void playDing().catch(() => {
      setIsAudioReady(false)
      setNeedsAudioActivation(true)
    })
  }, [enabled, events, playDing])

  return {
    enableAudio,
    isAudioReady,
    needsAudioActivation: enabled && needsAudioActivation,
  }
}
