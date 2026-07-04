import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Messaggistica privata ospite-host (conversazioni + messaggi).
 * Distinta dal ChatService, che gestisce il chatbot AI.
 */
@Injectable({ providedIn: 'root' })
export class MessaggiService {
  private readonly api = `${environment.apiUrl}/conversazioni`;

  constructor(private http: HttpClient) {}

  getConversazioni(): Observable<any[]> {
    return this.http.get<any[]>(this.api);
  }

  // L'ospite contatta l'host di una struttura: crea o recupera la conversazione.
  avvia(idHotel: number): Observable<any> {
    return this.http.post<any>(this.api, { idHotel });
  }

  // Contatta l'assistenza (un amministratore): crea o recupera la conversazione.
  avviaAssistenza(): Observable<any> {
    return this.http.post<any>(`${this.api}/assistenza`, {});
  }

  getMessaggi(idConversazione: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${idConversazione}/messaggi`);
  }

  invia(idConversazione: number, testo: string): Observable<any> {
    return this.http.post<any>(`${this.api}/${idConversazione}/messaggi`, { testo });
  }

  // Archivia/ripristina la conversazione per l'utente corrente.
  archivia(idConversazione: number, archiviata: boolean): Observable<any> {
    return this.http.put<any>(`${this.api}/${idConversazione}/archivia?archiviata=${archiviata}`, {});
  }

  // Segnala un messaggio all'assistenza (admin): apre/crea la chat di assistenza.
  segnala(idMessaggio: number): Observable<any> {
    return this.http.post<any>(`${this.api}/messaggi/${idMessaggio}/segnala`, {});
  }
}
