import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css',
})
export class ChatWindow implements OnInit {
  nuovoMessaggio: string = '';

  constructor(public chatService: ChatService) {
  }
  ngOnInit() {
  }

  closeChat(){
    this.chatService.toggleChat();
  }

  spedisci(){
    if(!this.nuovoMessaggio.trim()) return;

    const testoDaInviare = this.nuovoMessaggio;

    this.chatService.messaggi.push({ testo: testoDaInviare, daUtente: true });

    this.nuovoMessaggio='';
    this.chatService.inviaMessaggioAlBackend(testoDaInviare).subscribe({
      next: (response: any) => {
        console.log("Risposta ricevuta dal backend:", response);

        let testoBot = '';

        if (response && response.risposta) {
          testoBot = response.risposta;
        } else if (response && response.testoRisposta) {
          testoBot = response.testoRisposta;
        } else if (typeof response === 'string') {
          try {
            const parsed = JSON.parse(response);
            testoBot = parsed.risposta || parsed.testoRisposta || response;
          } catch (e) {
            testoBot = response;
          }
        } else {
          testoBot = "Non sono riuscito a elaborare la risposta.";
        }

        this.chatService.messaggi.push({
          testo: testoBot,
          daUtente: false
        });
      },
      error: (err) => {
        console.error("Errore reale di rete:", err);
        this.chatService.messaggi.push({
          testo: "❌ Errore di connessione con il server.",
          daUtente: false
        });
      }
    });
  }
}
