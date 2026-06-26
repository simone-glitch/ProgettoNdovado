import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrenotazioneService } from '../../services/prenotazione.service';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-prenotazioni',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './prenotazioni.html',
  styleUrl: './prenotazioni.css',
})
export class Prenotazioni implements OnInit {
  prenotazioni: any[] = [];
  loading = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  showConfirm = false;
  confirmMessage = '';
  actionPending: (() => void) | null = null;

  constructor(
    private prenotazioneService: PrenotazioneService,
    private authService: AuthService
  ) {}

  get isAdmin() { return this.authService.isAdmin(); }
  get isHost()  { return this.authService.isHost(); }
  get isGuest() { return this.authService.isGuest(); }

  ngOnInit() { this.carica(); }

  carica() {
    this.loading = true;
    const req$ = this.isAdmin
      ? this.prenotazioneService.getTutte()
      : this.prenotazioneService.getMie();

    req$.subscribe({
      next: (data) => { this.prenotazioni = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  chiediConferma(messaggio: string, azione: () => void) {
    this.confirmMessage = messaggio;
    this.actionPending = azione;
    this.showConfirm = true;
  }

  gestisciRisposta(risposta: boolean) {
    this.showConfirm = false;
    if (risposta && this.actionPending) this.actionPending();
    this.actionPending = null;
  }

  aggiornaStato(id: number, stato: string) {
    this.prenotazioneService.aggiornaStato(id, stato).subscribe({
      next: () => { this.showAlertMessage('Stato aggiornato.', 'success'); this.carica(); },
      error: () => this.showAlertMessage('Errore aggiornamento stato.', 'error')
    });
  }

  elimina(id: number) {
    this.chiediConferma('Eliminare questa prenotazione?', () => {
      this.prenotazioneService.elimina(id).subscribe({
        next: () => { this.showAlertMessage('Prenotazione eliminata.', 'success'); this.carica(); },
        error: () => this.showAlertMessage('Errore eliminazione.', 'error')
      });
    });
  }

  cancella(id: number) {
    this.chiediConferma('Annullare questa prenotazione?', () => {
      this.prenotazioneService.aggiornaStato(id, 'CANCELLATA').subscribe({
        next: () => { this.showAlertMessage('Prenotazione annullata.', 'success'); this.carica(); },
        error: () => this.showAlertMessage('Errore.', 'error')
      });
    });
  }

  statoBadgeClass(stato: string): string {
    const map: Record<string, string> = {
      IN_ATTESA:  'badge-attesa',
      CONFERMATA: 'badge-confermata',
      CANCELLATA: 'badge-cancellata'
    };
    return map[stato] ?? '';
  }

  statoLabel(stato: string): string {
    const map: Record<string, string> = {
      IN_ATTESA:  'In attesa',
      CONFERMATA: 'Confermata',
      CANCELLATA: 'Cancellata'
    };
    return map[stato] ?? stato;
  }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
