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

  aggiungiFoto(idHotel: number, urlFoto: string, didascalia: string = ''): Observable<any> {
    return this.http.post<any>(`${this.api}/${idHotel}/foto`, { urlFoto, didascalia });
  }

  eliminaFoto(idHotel: number, idFoto: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${idHotel}/foto/${idFoto}`, { responseType: 'text' as 'json' });
  }
}
