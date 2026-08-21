import { describe, expect, it } from 'vitest';
import {
  buildRrule,
  calcolaStreak,
  describeRrule,
  isDueOn,
  parseRrule,
  tassoDiRispetto,
  toDateKey,
  weekdayOf,
} from './habits';

// Mercoledì 19 agosto 2026. Mese 7 = agosto (i mesi partono da 0).
const MERCOLEDI = new Date(2026, 7, 19);
const GIOVEDI = new Date(2026, 7, 20);
const DOMENICA = new Date(2026, 7, 23);

describe('weekdayOf', () => {
  it('parte dal lunedì, non dalla domenica come getDay()', () => {
    expect(weekdayOf(MERCOLEDI)).toBe('WE');
    expect(weekdayOf(DOMENICA)).toBe('SU');
  });
});

describe('parseRrule', () => {
  it('legge la ricorrenza settimanale', () => {
    expect(parseRrule('FREQ=WEEKLY;BYDAY=MO,WE,FR')).toEqual({
      freq: 'WEEKLY',
      byday: ['MO', 'WE', 'FR'],
    });
  });

  it('su input incomprensibile ripiega su DAILY invece di esplodere', () => {
    expect(parseRrule('robaccia')).toEqual({ freq: 'DAILY' });
  });

  it('WEEKLY senza BYDAY vale tutti i giorni, così l’abitudine non sparisce', () => {
    const r = parseRrule('FREQ=WEEKLY');
    expect(r.freq === 'WEEKLY' && r.byday).toHaveLength(7);
  });

  it('scrivere e rileggere non cambia il significato', () => {
    const rrule = buildRrule({ freq: 'WEEKLY', byday: ['TU', 'TH'] });
    expect(rrule).toBe('FREQ=WEEKLY;BYDAY=TU,TH');
    expect(parseRrule(rrule)).toEqual({ freq: 'WEEKLY', byday: ['TU', 'TH'] });
  });

  it('sette giorni su sette si salva come DAILY, non come lista di sette', () => {
    expect(buildRrule({ freq: 'WEEKLY', byday: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] })).toBe(
      'FREQ=DAILY',
    );
  });
});

describe('isDueOn', () => {
  it('DAILY è dovuta sempre', () => {
    expect(isDueOn('FREQ=DAILY', MERCOLEDI)).toBe(true);
    expect(isDueOn('FREQ=DAILY', DOMENICA)).toBe(true);
  });

  it('WEEKLY è dovuta solo nei giorni elencati', () => {
    expect(isDueOn('FREQ=WEEKLY;BYDAY=MO,WE', MERCOLEDI)).toBe(true);
    expect(isDueOn('FREQ=WEEKLY;BYDAY=MO,WE', GIOVEDI)).toBe(false);
  });

  it('MONTHLY guarda il giorno del mese', () => {
    expect(isDueOn('FREQ=MONTHLY;BYMONTHDAY=19', MERCOLEDI)).toBe(true);
    expect(isDueOn('FREQ=MONTHLY;BYMONTHDAY=19', GIOVEDI)).toBe(false);
  });
});

describe('toDateKey', () => {
  it('usa il fuso locale, non UTC', () => {
    // Con toISOString() questa data diventerebbe il giorno prima per chi sta
    // a est di Greenwich: è il bug classico delle app con le date.
    expect(toDateKey(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
  });
});

describe('calcolaStreak', () => {
  it('conta i giorni consecutivi', () => {
    const fatti = ['2026-08-19', '2026-08-18', '2026-08-17'];
    expect(calcolaStreak('FREQ=DAILY', fatti, MERCOLEDI)).toBe(3);
  });

  it('non ancora fatto oggi non spezza la streak: la giornata non è finita', () => {
    const fatti = ['2026-08-18', '2026-08-17'];
    expect(calcolaStreak('FREQ=DAILY', fatti, MERCOLEDI)).toBe(2);
  });

  it('un buco ieri la spezza', () => {
    const fatti = ['2026-08-19', '2026-08-17'];
    expect(calcolaStreak('FREQ=DAILY', fatti, MERCOLEDI)).toBe(1);
  });

  it('i giorni non dovuti non spezzano niente', () => {
    // Lun/Gio. Mercoledì 19 non è dovuto: guarda giovedì 13 e lunedì 17.
    const fatti = ['2026-08-17', '2026-08-13'];
    expect(calcolaStreak('FREQ=WEEKLY;BYDAY=MO,TH', fatti, MERCOLEDI)).toBe(2);
  });

  it('nessun log, nessuna streak', () => {
    expect(calcolaStreak('FREQ=DAILY', [], MERCOLEDI)).toBe(0);
  });
});

describe('tassoDiRispetto', () => {
  it('conta solo i giorni dovuti', () => {
    const fatti = ['2026-08-19', '2026-08-18'];
    const r = tassoDiRispetto('FREQ=DAILY', fatti, 4, MERCOLEDI);
    expect(r).toEqual({ fatti: 2, dovuti: 4, percentuale: 50 });
  });
});

describe('describeRrule', () => {
  it('traduce in italiano leggibile', () => {
    expect(describeRrule('FREQ=DAILY')).toBe('Ogni giorno');
    expect(describeRrule('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')).toBe('Nei giorni feriali');
    expect(describeRrule('FREQ=WEEKLY;BYDAY=TU,TH')).toBe('Mar, Gio');
  });
});
