import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseReturnedStampAnimationOptions {
  /** Play an authentic rubber stamp impact sound synthesized via Web Audio API */
  enableAudio?: boolean;
  /** Trigger haptic vibration on mobile devices */
  enableHaptics?: boolean;
  /** Callback fired after stamp slam animation finishes */
  onAnimationEnd?: () => void;
}

/**
 * Custom hook that monitors an item's status and triggers the 'stampSlam'
 * CSS animation whenever its status is updated to 'resolved' / 'Returned' in the database.
 * 
 * @param currentStatus The current status of the item (e.g., 'active' | 'resolved')
 * @param options Configuration options for audio and vibration
 */
export function useReturnedStampAnimation(
  currentStatus?: string | null,
  options: UseReturnedStampAnimationOptions = { enableAudio: true, enableHaptics: true }
) {
  const [isStamping, setIsStamping] = useState<boolean>(false);
  const prevStatusRef = useRef<string | null | undefined>(undefined);
  const isFirstMountRef = useRef<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesize a tactile rubber stamp 'thud/thump' sound using Web Audio API
  const playStampSound = useCallback(() => {
    if (!options.enableAudio || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch sweep downward for physical rubber strike sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore audio context permission errors
    }
  }, [options.enableAudio]);

  // Imperative trigger to slam the stamp (e.g. called immediately when updating the database)
  const triggerStamp = useCallback(() => {
    setIsStamping(true);
    playStampSound();

    if (options.enableHaptics && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([25, 30, 45]);
      } catch {
        // Ignore haptics errors
      }
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Animation lasts ~500ms; reset trigger state while preserving finished visual
    timerRef.current = setTimeout(() => {
      setIsStamping(false);
      if (options.onAnimationEnd) {
        options.onAnimationEnd();
      }
    }, 600);
  }, [playStampSound, options]);

  // Automatically trigger whenever currentStatus transitions to 'resolved' (or 'returned')
  useEffect(() => {
    const isReturned = currentStatus === 'resolved' || currentStatus === 'returned';

    // On initial mount with already-resolved item, don't replay the slam unless requested
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevStatusRef.current = currentStatus;
      return;
    }

    const prevWasNotReturned = prevStatusRef.current !== 'resolved' && prevStatusRef.current !== 'returned';

    if (isReturned && prevWasNotReturned) {
      triggerStamp();
    }

    prevStatusRef.current = currentStatus;
  }, [currentStatus, triggerStamp]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const isResolved = currentStatus === 'resolved' || currentStatus === 'returned';
  const animationClass = isStamping ? 'animate-stamp-slam' : '';

  return {
    /** True during the active stampSlam animation */
    isStamping,
    /** Whether the status is currently resolved / returned */
    isResolved,
    /** CSS class to apply to the stamp badge element ('animate-stamp-slam' when stamping) */
    animationClass,
    /** Manually trigger the stamp animation and sound */
    triggerStamp
  };
}
