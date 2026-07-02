import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

/**
 * Converte un indirizzo testuale in coordinate geografiche (lat/lon) usando
 * Nominatim di OpenStreetMap — lo stesso ecosistema della mappa Leaflet già
 * in uso nell'app, quindi gratuito e senza API key.
 *
 * Nota: Nominatim consente ~1 richiesta al secondo; qui viene invocato solo
 * al salvataggio di un hotel, quindi ampiamente entro i limiti.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly url = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  /**
   * Ricava le coordinate provando prima con "indirizzo, città" e, se OpenStreetMap
   * non conosce quella via/civico, ricadendo sulla sola città (così l'hotel appare
   * comunque sulla mappa, posizionato al centro della località).
   * Restituisce null solo se anche la città non viene trovata o la rete fallisce.
   */
  coordinate(indirizzo: string, citta: string): Observable<{ lat: number; lon: number } | null> {
    const via  = (indirizzo ?? '').trim();
    const city = (citta ?? '').trim();
    const completo = [via, city].filter(Boolean).join(', ');

    if (!completo) return of(null);

    return this.cerca(completo).pipe(
      switchMap(coords => {
        // Se l'indirizzo completo non dà risultati, riprova con la sola città.
        if (coords || !city || completo === city) return of(coords);
        return this.cerca(city);
      })
    );
  }

  /** Singola interrogazione a Nominatim: primo risultato o null. */
  private cerca(query: string): Observable<{ lat: number; lon: number } | null> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      addressdetails: '0',
      countrycodes: 'it',
    });

    return this.http.get<any[]>(`${this.url}?${params.toString()}`).pipe(
      map(res => {
        if (!res?.length) return null;
        const lat = Number(res[0].lat);
        const lon = Number(res[0].lon);
        return isNaN(lat) || isNaN(lon) ? null : { lat, lon };
      }),
      catchError(() => of(null))
    );
  }
}
