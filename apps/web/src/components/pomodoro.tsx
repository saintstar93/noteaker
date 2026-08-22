'use client';

import { cn } from '@noteaker/ui/cn';
import { Pause, Play, RotateCcw, SkipForward, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { registraPomodoro } from '@/lib/actions';
import type { PomodoroSettings, Task } from '@/lib/types';

/**
 * Il timer della tecnica del pomodoro.
 *
 * LA SCELTA CHE CONTA: non si tiene un contatore che scala di un secondo alla
 * volta. Si salva **l'orario in cui il timer deve finire** e si calcola quanto
 * manca a ogni disegno. Motivo pratico: su iPhone, appena blocchi lo schermo o
 * cambi app, il browser congela i timer del JavaScript. Con un contatore, al
 * ritorno avresti perso minuti; con l'orario di fine, il conto torna sempre —
 * perché è l'orologio a decidere, non noi.
 *
 * Lo stato vive in `localStorage`, non nel database: è di questo dispositivo e
 * di questo momento. Le IMPOSTAZIONI invece stanno in database, così sono
 * uguali su Mac e iPhone. Nel database finiscono anche le sessioni concluse,
 * che servono a sapere quanto hai davvero lavorato.
 */

type Fase = 'work' | 'short_break' | 'long_break';

type Stato = {
  fase: Fase;
  fineIl: number | null; // timestamp in millisecondi
  rimastiInPausa: number | null; // millisecondi congelati quando metti in pausa
  iniziataIl: string | null;
  cicli: number;
  taskId: string | null;
};

const CHIAVE = 'noteaker:pomodoro';

const ETICHETTA: Record<Fase, string> = {
  work: 'Concentrazione',
  short_break: 'Pausa breve',
  long_break: 'Pausa lunga',
};

const statoIniziale: Stato = {
  fase: 'work',
  fineIl: null,
  rimastiInPausa: null,
  iniziataIl: null,
  cicli: 0,
  taskId: null,
};

function minutiDellaFase(fase: Fase, i: PomodoroSettings): number {
  if (fase === 'work') return i.work_minutes;
  if (fase === 'short_break') return i.short_break_minutes;
  return i.long_break_minutes;
}

function formatta(millisecondi: number): string {
  const totale = Math.max(0, Math.ceil(millisecondi / 1000));
  const minuti = Math.floor(totale / 60);
  const secondi = totale % 60;
  return `${String(minuti).padStart(2, '0')}:${String(secondi).padStart(2, '0')}`;
}

export function Pomodoro({
  impostazioni,
  task,
  pomodoriDiOggi,
  onChiudiTask,
}: {
  impostazioni: PomodoroSettings;
  task?: Task | null;
  pomodoriDiOggi: number;
  onChiudiTask?: () => void;
}) {
  const [stato, setStato] = useState<Stato>(statoIniziale);
  const [ora, setOra] = useState(() => Date.now());
  const [pronto, setPronto] = useState(false);
  const suonoFatto = useRef(false);

  // Si riprende quello che c'era prima del ricaricamento.
  useEffect(() => {
    try {
      const salvato = localStorage.getItem(CHIAVE);
      if (salvato) setStato({ ...statoIniziale, ...JSON.parse(salvato) });
    } catch {
      // localStorage può essere disabilitato o pieno: si riparte da zero.
    }
    setPronto(true);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    try {
      localStorage.setItem(CHIAVE, JSON.stringify(stato));
    } catch {
      // niente da fare: il timer funziona lo stesso, non sopravvive al reload
    }
  }, [stato, pronto]);

  // Un solo intervallo, solo per ridisegnare. Non è lui a tenere il tempo.
  useEffect(() => {
    if (!stato.fineIl) return;
    const id = setInterval(() => setOra(Date.now()), 250);
    return () => clearInterval(id);
  }, [stato.fineIl]);

  const durataMs = minutiDellaFase(stato.fase, impostazioni) * 60_000;
  const rimasti = stato.fineIl ? stato.fineIl - ora : (stato.rimastiInPausa ?? durataMs);
  const inCorso = stato.fineIl !== null;
  const finito = inCorso && rimasti <= 0;

  const prossimaFase = useCallback(
    (cicliCompletati: number): Fase => {
      if (stato.fase !== 'work') return 'work';
      return cicliCompletati % impostazioni.cycles_before_long === 0 ? 'long_break' : 'short_break';
    },
    [stato.fase, impostazioni.cycles_before_long],
  );

  const chiudiFase = useCallback(
    async (completata: boolean) => {
      const minutiFatti = completata
        ? minutiDellaFase(stato.fase, impostazioni)
        : (durataMs - Math.max(0, rimasti)) / 60_000;

      if (stato.iniziataIl && minutiFatti >= 0.5) {
        await registraPomodoro(stato.fase, minutiFatti, stato.iniziataIl, stato.taskId, completata);
      }

      const cicli = stato.fase === 'work' && completata ? stato.cicli + 1 : stato.cicli;
      const dopo = prossimaFase(cicli);

      setStato((precedente) => ({
        ...precedente,
        fase: dopo,
        cicli,
        iniziataIl: impostazioni.auto_start_next ? new Date().toISOString() : null,
        fineIl: impostazioni.auto_start_next
          ? Date.now() + minutiDellaFase(dopo, impostazioni) * 60_000
          : null,
        rimastiInPausa: null,
      }));
      suonoFatto.current = false;
    },
    [stato, impostazioni, durataMs, rimasti, prossimaFase],
  );

  // Il timer è scaduto: si chiude la fase una volta sola.
  useEffect(() => {
    if (!finito || suonoFatto.current) return;
    suonoFatto.current = true;

    if (impostazioni.suono) suonaCampanella();
    void chiudiFase(true);
  }, [finito, impostazioni.suono, chiudiFase]);

  const avvia = () => {
    const daFare = stato.rimastiInPausa ?? durataMs;
    setStato((p) => ({
      ...p,
      fineIl: Date.now() + daFare,
      rimastiInPausa: null,
      iniziataIl: p.iniziataIl ?? new Date().toISOString(),
      taskId: task?.id ?? p.taskId,
    }));
    suonoFatto.current = false;
  };

  const metti__inPausa = () => {
    setStato((p) => ({
      ...p,
      rimastiInPausa: Math.max(0, (p.fineIl ?? 0) - Date.now()),
      fineIl: null,
    }));
  };

  const azzera = () => {
    setStato((p) => ({ ...p, fineIl: null, rimastiInPausa: null, iniziataIl: null }));
    suonoFatto.current = false;
  };

  if (!pronto) return null;

  const percentuale = Math.min(
    100,
    Math.max(0, ((durataMs - Math.max(0, rimasti)) / durataMs) * 100),
  );
  const lavoro = stato.fase === 'work';

  return (
    <section
      aria-label="Timer pomodoro"
      className={cn(
        'flex flex-wrap items-center gap-4 rounded-lg p-4',
        lavoro ? 'bg-surface-2' : 'bg-green text-on-accent',
      )}
    >
      <div className="flex min-w-40 flex-col">
        <p className={cn('label', lavoro ? 'text-fg-subtle' : 'opacity-70')}>
          {ETICHETTA[stato.fase]}
        </p>
        <p className="font-display font-extrabold text-[34px] leading-none tabular-nums">
          {formatta(Math.max(0, rimasti))}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {inCorso ? (
          <button
            type="button"
            onClick={metti__inPausa}
            aria-label="Metti in pausa"
            className={cn(
              'flex size-11 items-center justify-center rounded-full',
              lavoro ? 'bg-yellow text-on-accent' : 'bg-black/15',
            )}
          >
            <Pause aria-hidden size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={avvia}
            aria-label="Avvia"
            className={cn(
              'flex size-11 items-center justify-center rounded-full',
              lavoro ? 'bg-yellow text-on-accent' : 'bg-black/15',
            )}
          >
            <Play aria-hidden size={18} />
          </button>
        )}

        <button
          type="button"
          onClick={azzera}
          aria-label="Azzera"
          className="flex size-9 items-center justify-center rounded-full text-current opacity-60 hover:opacity-100"
        >
          <RotateCcw aria-hidden size={16} />
        </button>

        <button
          type="button"
          onClick={() => chiudiFase(false)}
          aria-label="Salta alla fase successiva"
          className="flex size-9 items-center justify-center rounded-full text-current opacity-60 hover:opacity-100"
        >
          <SkipForward aria-hidden size={16} />
        </button>
      </div>

      <div className="min-w-32 flex-1">
        <div
          className={cn(
            'h-1.5 overflow-hidden rounded-full',
            lavoro ? 'bg-surface-3' : 'bg-black/15',
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-1000 ease-linear',
              lavoro ? 'bg-yellow' : 'bg-black/40',
            )}
            style={{ width: `${percentuale}%` }}
          />
        </div>

        <p className={cn('mt-1.5 truncate text-[12px]', lavoro ? 'text-fg-subtle' : 'opacity-70')}>
          {task ? (
            <span className="inline-flex items-center gap-1">
              su «{task.title}»
              {onChiudiTask ? (
                <button type="button" onClick={onChiudiTask} aria-label="Togli la task dal timer">
                  <X aria-hidden size={11} />
                </button>
              ) : null}
            </span>
          ) : (
            'Nessuna task collegata'
          )}
          {' · '}
          {pomodoriDiOggi + stato.cicli} oggi · pausa lunga ogni {impostazioni.cycles_before_long}
        </p>
      </div>
    </section>
  );
}

/**
 * Un "din" generato al volo con la Web Audio API: nessun file da scaricare,
 * nessun permesso da chiedere. Se il browser blocca l'audio (succede finché
 * non c'è stata un'interazione), fallisce in silenzio invece di rompere il
 * timer — il suono è un di più, il conteggio no.
 */
function suonaCampanella() {
  try {
    const contesto = new (
      globalThis.AudioContext ??
      (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const oscillatore = contesto.createOscillator();
    const volume = contesto.createGain();

    oscillatore.connect(volume);
    volume.connect(contesto.destination);
    oscillatore.frequency.value = 880;
    volume.gain.setValueAtTime(0.001, contesto.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.3, contesto.currentTime + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.001, contesto.currentTime + 1.2);

    oscillatore.start();
    oscillatore.stop(contesto.currentTime + 1.2);
  } catch {
    // niente audio: pazienza
  }
}
