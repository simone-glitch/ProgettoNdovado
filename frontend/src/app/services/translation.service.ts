import { Injectable } from '@angular/core';
import { PreferencesService } from './preferences.service';
import { Dict, Lang, LangDict } from './i18n/types';
import { coreDict } from './i18n/core.dict';
import { homeDict } from './i18n/home.dict';
import { hotelDetailDict } from './i18n/hotel-detail.dict';
import { settingDict } from './i18n/setting.dict';
import { authDict } from './i18n/auth.dict';
import { utentiDict } from './i18n/utenti.dict';
import { gestioneHotelDict } from './i18n/gestione-hotel.dict';
import { prenotazioniDict } from './i18n/prenotazioni.dict';
import { sharedDict } from './i18n/shared.dict';
import { statisticheDict } from './i18n/statistiche.dict';
import { mieiHotelDict } from './i18n/miei-hotel.dict';
import { aggiungiHotelDict } from './i18n/aggiungi-hotel.dict';
import { preferitiDict }    from './i18n/preferiti.dict';
import { disponibilitaDict } from './i18n/disponibilita.dict';
import { chatDict }          from './i18n/chat.dict';

const ALL_DICTS: LangDict[] = [
  coreDict,
  homeDict,
  hotelDetailDict,
  settingDict,
  authDict,
  utentiDict,
  gestioneHotelDict,
  prenotazioniDict,
  sharedDict,
  statisticheDict,
  mieiHotelDict,
  aggiungiHotelDict,
  preferitiDict,
  disponibilitaDict,
  chatDict,
];

const LANGS: Lang[] = ['it', 'en', 'es', 'fr', 'de'];

function mergeDicts(dicts: LangDict[]): Record<Lang, Dict> {
  const merged: Record<Lang, Dict> = { it: {}, en: {}, es: {}, fr: {}, de: {} };
  for (const dict of dicts) {
    for (const lang of LANGS) {
      Object.assign(merged[lang], dict[lang]);
    }
  }
  return merged;
}

const T = mergeDicts(ALL_DICTS);

@Injectable({ providedIn: 'root' })
export class TranslationService {
  constructor(private prefs: PreferencesService) {}

  translate(key: string, forceLang?: Lang): string {
    const lang = forceLang ?? (this.prefs.langCode as Lang);
    return T[lang]?.[key] ?? T['it']?.[key] ?? key;
  }
}
