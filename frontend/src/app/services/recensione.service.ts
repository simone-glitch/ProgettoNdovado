import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecensioneService {
  private readonly api = `${environment.apiUrl}/recensioni`;

  constructor(private http: HttpClient) {}

  getPerHotel(idHotel: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/hotel/${idHotel}`);
  }

  getMie(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/mie`);
  }

  aggiungi(recensione: any): Observable<any> {
    return this.http.post<any>(this.api, recensione);
  }

  elimina(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`, { responseType: 'text' as 'json' });
  }
}
