import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private readonly api = `${environment.apiUrl}/camere`;

  constructor(private http: HttpClient) {}

  getPerHotel(idHotel: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/hotel/${idHotel}`);
  }

  getDisponibili(idHotel: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/hotel/${idHotel}/disponibili`);
  }

  getCamera(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  crea(camera: any): Observable<any> {
    return this.http.post<any>(this.api, camera);
  }

  aggiorna(id: number, camera: any): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}`, camera);
  }

  elimina(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`, { responseType: 'text' as 'json' });
  }
}
