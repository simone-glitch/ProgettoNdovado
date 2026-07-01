import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        const credenzialiBase64 = btoa(`${email}:${password}`);
        const utente = response?.userDetails ?? response;
        localStorage.setItem('auth_token', `Basic ${credenzialiBase64}`);
        localStorage.setItem('utente', JSON.stringify(utente));
      })
    );
  }

  register(dati: { nome: string; cognome: string; email: string; password: string; ruolo: string; telefono?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, dati);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email }, { responseType: 'text' as 'json' });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { token, password }, { responseType: 'text' as 'json' });
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('utente');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getLoggedUser(): any | null {
    const str = localStorage.getItem('utente');
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      return parsed?.userDetails ?? parsed;
    } catch {
      this.logout();
      return null;
    }
  }

  getRuolo(): string {
    return this.getLoggedUser()?.ruolo ?? '';
  }

  // Chiave localStorage legata all'utente loggato: i dati personali (carte,
  // obiettivi, ecc.) non devono essere visibili ad altri account sullo stesso browser.
  userKey(base: string): string {
    const u = this.getLoggedUser();
    return `${base}-${u?.id ?? u?.email ?? 'anon'}`;
  }

  isAdmin(): boolean  { return this.getRuolo() === 'ADMIN'; }
  isHost(): boolean   { return this.getRuolo() === 'HOST';  }
  isGuest(): boolean  { return this.getRuolo() === 'GUEST'; }
}
