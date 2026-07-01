import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { TranslationService } from '../../services/translation.service';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule,FormsModule,SharedModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css',
})
export class ChatWindow implements OnInit {
  nuovoMessaggio: string = '';

  constructor(public chatService: ChatService, private i18n: TranslationService) {
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
          testoBot = this.i18n.translate('chat.msg.no-response');
        }

        this.chatService.messaggi.push({
          testo: testoBot,
          daUtente: false
        });
      },
      error: (err) => {
        console.error("Errore reale di rete:", err);
        this.chatService.messaggi.push({
          testo: this.i18n.translate('chat.msg.errore-connessione'),
          daUtente: false
        });
      }
    });
  }
}
