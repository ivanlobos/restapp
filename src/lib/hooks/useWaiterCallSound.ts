"use client";

/**
 * useWaiterCallSound
 *
 * Detecta nuevos waiter calls comparando la lista de mesas entre renders.
 * Cuando llega uno nuevo, toca una alarma usando Web Audio API (sin assets externos).
 *
 * Limitación conocida (Opción D): el tab debe estar abierto y el usuario
 * debe haber interactuado al menos una vez con la página (restricción de
 * autoplay del navegador). El componente que usa este hook debe mostrar
 * un botón "Activar sonido" que llame a enableSound() una sola vez.
 *
 * Mejora futura (Opción C): reemplazar por PWA + Web Push para notificaciones
 * en segundo plano. Estimado ~20h, priorizar cuando haya 5+ clientes activos.
 */

import { useRef, useCallback, useEffect } from "react";

interface WaiterCall {
  id: string;
  createdAt: Date | string;
}

interface TableWithCalls {
  id: string;
  waiterCalls?: WaiterCall[];
}

/**
 * Genera un beep de alarma usando Web Audio API puro.
 * Dos tonos alternantes (440hz / 880hz) para que sea reconocible.
 */
function createAlarmBeep(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const duration = 0.18;
  const gap = 0.06;

  [440, 880, 440, 880].forEach((freq, i) => {
    const start = now + i * (duration + gap);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);

    // Envelope: attack 10ms → sustain → decay 30ms
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.4, start + 0.01);
    gain.gain.setValueAtTime(0.4, start + duration - 0.03);
    gain.gain.linearRampToValueAtTime(0, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  });
}

export function useWaiterCallSound() {
  // IDs de waiterCalls ya conocidos (no disparar al montar por primera vez)
  const knownCallIds = useRef<Set<string>>(new Set());
  // true después del primer poll (evita alarma al cargar la página)
  const initialized = useRef(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  // true = el usuario ya interactuó, podemos reproducir audio
  const soundEnabled = useRef(false);

  /** El garzón hace click en "Activar sonido" → desbloquea autoplay */
  const enableSound = useCallback(() => {
    soundEnabled.current = true;
    // Crear (o reanudar) el AudioContext en respuesta a gesto del usuario
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    } else if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    // Beep silencioso de prueba para confirmar que quedó activo
    createAlarmBeep(audioCtxRef.current);
  }, []);

  /** Llamar cada vez que llega una nueva lista de mesas (desde el polling) */
  const checkForNewCalls = useCallback((tables: TableWithCalls[]) => {
    if (!initialized.current) {
      // Primera vez: sólo registra los IDs existentes, no suena
      tables.forEach((t) =>
        t.waiterCalls?.forEach((c) => knownCallIds.current.add(c.id))
      );
      initialized.current = true;
      return;
    }

    let hasNew = false;
    tables.forEach((t) => {
      t.waiterCalls?.forEach((c) => {
        if (!knownCallIds.current.has(c.id)) {
          knownCallIds.current.add(c.id);
          hasNew = true;
        }
      });
    });

    if (hasNew && soundEnabled.current && audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().then(() => {
          createAlarmBeep(audioCtxRef.current!);
        });
      } else {
        createAlarmBeep(audioCtxRef.current);
      }
    }
  }, []);

  // Limpiar AudioContext al desmontar
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  return {
    enableSound,
    checkForNewCalls,
    isSoundEnabled: () => soundEnabled.current,
  };
}
