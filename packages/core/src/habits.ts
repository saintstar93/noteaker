/**
 * Ricorrenze e streak delle abitudini.
 *
 * Vive qui, in `packages/core`, perché è LOGICA PURA: nessuna chiamata al
 * database, nessun React. Entrano dati, escono dati. È la parte più facile da
 * sbagliare e la più facile da testare, quindi sta insieme ai suoi test.
 *
 * Le ricorrenze usano `rrule`, lo standard dei calendari (RFC 5545):
 *   FREQ=DAILY
 *   FREQ=WEEKLY;BYDAY=MO,WE,FR
 * Ne interpretiamo il sottoinsieme che ci serve. Il giorno in cui servirà
 * "il terzo martedì del mese" si passa a una libreria vera, senza cambiare
 * il formato dei dati già salvati.
 */

export const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Etichette italiane, per l'interfaccia. */
export const WEEKDAY_LABEL: Record<Weekday, string> = {
  MO: 'Lun',
  TU: 'Mar',
  WE: 'Mer',
  TH: 'Gio',
  FR: 'Ven',
  SA: 'Sab',
  SU: 'Dom',
};

export type Recurrence =
  | { freq: 'DAILY' }
  | { freq: 'WEEKLY'; byday: Weekday[] }
  | { freq: 'MONTHLY'; bymonthday: number[] };

export function parseRrule(rrule: string): Recurrence {
  const parti = new Map<string, string>();
  for (const pezzo of rrule.split(';')) {
    const [chiave, valore] = pezzo.split('=');
    if (chiave && valore) parti.set(chiave.trim().toUpperCase(), valore.trim().toUpperCase());
  }

  const freq = parti.get('FREQ');

  if (freq === 'WEEKLY') {
    const byday = (parti.get('BYDAY') ?? '')
      .split(',')
      .map((g) => g.trim())
      .filter((g): g is Weekday => (WEEKDAYS as readonly string[]).includes(g));
    // WEEKLY senza BYDAY non dice niente: la trattiamo come "tutti i giorni"
    // invece di non proporla mai. Meglio una proposta in più che un'abitudine
    // che sparisce in silenzio.
    return { freq: 'WEEKLY', byday: byday.length > 0 ? byday : [...WEEKDAYS] };
  }

  if (freq === 'MONTHLY') {
    const giorni = (parti.get('BYMONTHDAY') ?? '')
      .split(',')
      .map((g) => Number.parseInt(g, 10))
      .filter((g) => Number.isInteger(g) && g >= 1 && g <= 31);
    return { freq: 'MONTHLY', bymonthday: giorni.length > 0 ? giorni : [1] };
  }

  return { freq: 'DAILY' };
}

export function buildRrule(ricorrenza: Recurrence): string {
  if (ricorrenza.freq === 'WEEKLY') {
    const giorni = WEEKDAYS.filter((g) => ricorrenza.byday.includes(g));
    return giorni.length === 7 ? 'FREQ=DAILY' : `FREQ=WEEKLY;BYDAY=${giorni.join(',')}`;
  }
  if (ricorrenza.freq === 'MONTHLY') {
    return `FREQ=MONTHLY;BYMONTHDAY=${[...ricorrenza.bymonthday].sort((a, b) => a - b).join(',')}`;
  }
  return 'FREQ=DAILY';
}

/**
 * `Date.getDay()` mette la domenica a 0; RFC 5545 parte dal lunedì.
 * È una riga stupida ed è esattamente il punto in cui si sbaglia sempre.
 */
export function weekdayOf(data: Date): Weekday {
  const indice = (data.getDay() + 6) % 7;
  return WEEKDAYS[indice] as Weekday;
}

/** L'abitudine va fatta in questo giorno? */
export function isDueOn(rrule: string, data: Date): boolean {
  const ricorrenza = parseRrule(rrule);
  if (ricorrenza.freq === 'DAILY') return true;
  if (ricorrenza.freq === 'WEEKLY') return ricorrenza.byday.includes(weekdayOf(data));
  return ricorrenza.bymonthday.includes(data.getDate());
}

/** Descrizione leggibile, per l'interfaccia. */
export function describeRrule(rrule: string): string {
  const r = parseRrule(rrule);
  if (r.freq === 'DAILY') return 'Ogni giorno';
  if (r.freq === 'MONTHLY') return `Il ${r.bymonthday.join(', ')} del mese`;
  if (r.byday.length === 7) return 'Ogni giorno';
  if (r.byday.length === 5 && !r.byday.includes('SA') && !r.byday.includes('SU')) {
    return 'Nei giorni feriali';
  }
  return r.byday.map((g) => WEEKDAY_LABEL[g]).join(', ');
}

/** Data in formato 'YYYY-MM-DD' nel fuso locale (mai `toISOString`, che è UTC). */
export function toDateKey(data: Date): string {
  const anno = data.getFullYear();
  const mese = String(data.getMonth() + 1).padStart(2, '0');
  const giorno = String(data.getDate()).padStart(2, '0');
  return `${anno}-${mese}-${giorno}`;
}

export function addDays(data: Date, giorni: number): Date {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + giorni);
  return copia;
}

/**
 * Streak: da quanti giorni CONSECUTIVI DOVUTI l'abitudine è rispettata.
 *
 * Il punto sottile: si contano solo i giorni in cui l'abitudine era dovuta.
 * Se corri lunedì e giovedì, non aver corso di martedì non spezza niente.
 *
 * Oggi, se non ancora fatto, non spezza la streak: la giornata non è finita.
 * Ieri sì.
 */
export function calcolaStreak(
  rrule: string,
  giorniFatti: Iterable<string>,
  oggi = new Date(),
): number {
  const fatti = new Set(giorniFatti);
  let streak = 0;
  let cursore = new Date(oggi);

  for (let passi = 0; passi < 3650; passi++) {
    const chiave = toDateKey(cursore);
    const dovuto = isDueOn(rrule, cursore);

    if (dovuto) {
      if (fatti.has(chiave)) {
        streak++;
      } else if (chiave !== toDateKey(oggi)) {
        break;
      }
    }
    cursore = addDays(cursore, -1);
  }

  return streak;
}

/** Quante volte è stata rispettata negli ultimi `giorni` giorni dovuti. */
export function tassoDiRispetto(
  rrule: string,
  giorniFatti: Iterable<string>,
  giorni = 30,
  oggi = new Date(),
): { fatti: number; dovuti: number; percentuale: number } {
  const insieme = new Set(giorniFatti);
  let dovuti = 0;
  let fatti = 0;

  for (let i = 0; i < giorni; i++) {
    const data = addDays(oggi, -i);
    if (!isDueOn(rrule, data)) continue;
    dovuti++;
    if (insieme.has(toDateKey(data))) fatti++;
  }

  return { fatti, dovuti, percentuale: dovuti === 0 ? 0 : Math.round((fatti / dovuti) * 100) };
}
