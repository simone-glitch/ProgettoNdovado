import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';

export interface Messaggio{
  testo:string;
  daUtente:boolean;
}
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl= "http://localhost:8080/api/chat/chiedi";
  private chatVisibile = new BehaviorSubject<boolean>(false);
  chatOpen$ = this.chatVisibile.asObservable();

  public messaggi: Messaggio[]=[];

  constructor(private http: HttpClient) {
  }

  toggleChat(){
    this.chatVisibile.next(!this.chatVisibile.value);
  }

  openChat(){
    this.chatVisibile.next(true);
  }

  inviaMessaggioAlBackend(testoInviato: string): Observable<any>{
    const payload={messaggio:testoInviato};

    return this.http.post(this.apiUrl, payload,{ withCredentials: true });
  }
}
