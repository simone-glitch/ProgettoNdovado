import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HotelService {
  private readonly api = `${environment.apiUrl}/hotel`;

  constructor(private http: HttpClient) {}

  cerca(filtri: { citta?: string; stelle?: number; prezzoMax?: number; numOspiti?: number }): Observable<any[]> {
    let params = new HttpParams();
    if (filtri.citta)      params = params.set('citta',     filtri.citta);
    if (filtri.stelle)     params = params.set('stelle',    filtri.stelle);
    if (filtri.prezzoMax)  params = params.set('prezzoMax', filtri.prezzoMax);
    if (filtri.numOspiti)  params = params.set('numOspiti', filtri.numOspiti);
    return this.http.get<any[]>(this.api, { params });
  }

  getTutti(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/tutti`);
  }

  // Vista di moderazione ADMIN: include il proprietario ed esclude le bozze altrui.
  getPerGestione(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/gestione`);
  }

  getDettaglio(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  getMiei(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/miei`);
  }

  getServizi(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/servizi`);
  }

  crea(hotel: any): Observable<any> {
    return this.http.post<any>(this.api, hotel);
  }

  aggiorna(id: number, hotel: any): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}`, hotel);
  }

  elimina(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`, { responseType: 'text' as 'json' });
  }

  aggiornaServizi(idHotel: number, idServizi: number[]): Observable<any> {
    return this.http.put<any>(`${this.api}/${idHotel}/servizi`, idServizi);
  }

  // ── Transizioni di stato (ciclo di vita struttura) ──
  // HOST proprietario
  inviaInRevisione(id: number): Observable<any> { return this.http.put<any>(`${this.api}/${id}/invia-revisione`, {}); }
  disattiva(id: number):        Observable<any> { return this.http.put<any>(`${this.api}/${id}/disattiva`, {}); }
  attiva(id: number):           Observable<any> { return this.http.put<any>(`${this.api}/${id}/attiva`, {}); }
  // ADMIN (moderazione)
  approva(id: number):  Observable<any> { return this.http.put<any>(`${this.api}/${id}/approva`, {}); }
  rifiuta(id: number):  Observable<any> { return this.http.put<any>(`${this.api}/${id}/rifiuta`, {}); }
  sospendi(id: number): Observable<any> { return this.http.put<any>(`${this.api}/${id}/sospendi`, {}); }
  riattiva(id: number): Observable<any> { return this.http.put<any>(`${this.api}/${id}/riattiva`, {}); }

  aggiungiFoto(idHotel: number, urlFoto: string, didascalia: string = ''): Observable<any> {
    return this.http.post<any>(`${this.api}/${idHotel}/foto`, { urlFoto, didascalia });
  }

  // Sostituisce l'intera galleria dell'hotel con l'elenco passato (data URL base64
  // o URL esterni). Usato dal wizard dopo il salvataggio per persistere le foto.
  sostituisciFoto(idHotel: number, foto: string[]): Observable<any> {
    return this.http.put(`${this.api}/${idHotel}/foto`, foto, { responseType: 'text' as 'json' });
  }

  eliminaFoto(idHotel: number, idFoto: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${idHotel}/foto/${idFoto}`, { responseType: 'text' as 'json' });
  }

  // ── Blocchi di disponibilità (ferie/lavori: giorni non prenotabili) ──
  getBlocchi(idHotel: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${idHotel}/blocchi`);
  }

  aggiungiBlocco(idHotel: number, blocco: { dataInizio: string; dataFine: string; motivo?: string }): Observable<any> {
    return this.http.post<any>(`${this.api}/${idHotel}/blocchi`, blocco);
  }

  rimuoviBlocco(idBlocco: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/blocchi/${idBlocco}`, { responseType: 'text' as 'json' });
  }
}
