import { Injectable } from '@angular/core';

export interface UserPrefs {
  lingua: string;
  valuta: string;
  tema:   string;
}

const RATES: Record<string, number> = { EUR: 1, USD: 1.08, GBP: 0.86, CHF: 0.96 };

const CURRENCY_FMT: Record<string, { sym: string; after: boolean }> = {
  EUR: { sym: '€',   after: false },
  USD: { sym: '$',   after: false },
  GBP: { sym: '£',   after: false },
  CHF: { sym: 'CHF', after: true  },
};

const LANG_CODES: Record<string, string> = {
  'Italiano': 'it', 'English': 'en', 'Español': 'es', 'Français': 'fr', 'Deutsch': 'de',
};

const CURRENCY_CODES: Record<string, string> = {
  'EUR (€)': 'EUR', 'USD ($)': 'USD', 'GBP (£)': 'GBP', 'CHF': 'CHF',
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {

  private _prefs: UserPrefs = { lingua: 'Italiano', valuta: 'EUR (€)', tema: 'Chiaro' };

  private get userKey(): string {
    try {
      const raw = localStorage.getItem('utente');
      const u = JSON.parse(raw ?? '');
      const email = u?.email ?? u?.userDetails?.email ?? '';
      return email ? `ndv_prefs_${email}` : 'ndv_prefs_guest';
    } catch {
      return 'ndv_prefs_guest';
    }
  }

  load(): void {
    const saved = localStorage.getItem(this.userKey);
    if (saved) {
      try { this._prefs = { ...this._prefs, ...JSON.parse(saved) }; } catch {}
      return;
    }
    // Migrate from shared key (legacy)
    const legacy = localStorage.getItem('ndv_preferenze');
    if (legacy) {
      try {
        this._prefs = { ...this._prefs, ...JSON.parse(legacy) };
        this.persist();
      } catch {}
    }
  }

  save(prefs: UserPrefs): void {
    this._prefs = { ...prefs };
    this.persist();
  }

  get lingua(): string { return this._prefs.lingua; }
  get valuta(): string { return this._prefs.valuta; }
  get tema():   string { return this._prefs.tema; }

  get langCode(): string {
    return LANG_CODES[this._prefs.lingua] ?? 'it';
  }

  get currencyCode(): string {
    for (const [key, code] of Object.entries(CURRENCY_CODES)) {
      if (this._prefs.valuta.startsWith(key.split(' ')[0])) return code;
    }
    return 'EUR';
  }

  formatCurrency(amountEur: number | null | undefined, fallback = '—'): string {
    if (amountEur == null || isNaN(Number(amountEur))) return fallback;
    const code = this.currencyCode;
    const rate = RATES[code] ?? 1;
    const fmt  = CURRENCY_FMT[code] ?? { sym: '€', after: false };
    const converted = Number(amountEur) * rate;
    const str = converted.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return fmt.after ? `${str} ${fmt.sym}` : `${fmt.sym} ${str}`;
  }

  private persist(): void {
    localStorage.setItem(this.userKey, JSON.stringify(this._prefs));
  }
}
