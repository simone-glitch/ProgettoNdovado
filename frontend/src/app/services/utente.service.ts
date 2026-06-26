import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UtenteService {
  private readonly apiUrl = `${environment.apiUrl}/utenti`;

  constructor(private http: HttpClient) { }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  promoteUser(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/promuovi`, {}, { responseType: 'text' });
  }

  searchUsers(page: number, size: number, name: string, role: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('role', role);
    if (name) {
      params = params.set('name', name);
    }
    return this.http.get<any>(`${this.apiUrl}/search`, { params });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  getMieiTeams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me/teams`);
  }

  getMieiProgetti(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me/progetti`);
  }

  getMieiTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me/tasks`);
  }
}
