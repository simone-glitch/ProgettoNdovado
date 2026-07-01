import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PrenotazioneService {
  private readonly api = `${environment.apiUrl}/prenotazioni`;

  constructor(private http: HttpClient) {}

  getMie(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/mie`);
  }

  puoiRecensire(idHotel: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.api}/puoi-recensire/${idHotel}`);
  }

  getPerHotel(idHotel: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/hotel/${idHotel}`);
  }

  getTutte(): Observable<any[]> {
    return this.http.get<any[]>(this.api);
  }

  getOccupazioniCamera(idCamera: number): Observable<{checkin: string; checkout: string}[]> {
    return this.http.get<{checkin: string; checkout: string}[]>(`${this.api}/camera/${idCamera}/occupazioni`);
  }

  crea(prenotazione: any): Observable<any> {
    return this.http.post<any>(this.api, prenotazione);
  }

  aggiornaStato(id: number, stato: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/stato`, { stato }, { responseType: 'text' as 'json' });
  }

  elimina(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`, { responseType: 'text' as 'json' });
  }
}
