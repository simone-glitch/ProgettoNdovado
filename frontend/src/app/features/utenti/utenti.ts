import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtenteService } from '../../services/utente.service';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-utenti',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './utenti.html',
  styleUrls: ['./utenti.css']
})
export class Utenti implements OnInit {
  utenti: any[] = [];
  isAdmin: boolean = false;
  currentUserId: number | null = null;

  showAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';


  showConfirm: boolean = false;
  confirmMessage: string = '';
  actionToConfirm: 'promuovi' | 'elimina' | null = null;
  itemToProcess: any = null;

  constructor(
    private utenteService: UtenteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getLoggedUser();
    this.isAdmin = user?.ruolo === 'ADMIN';
    this.currentUserId = user?.id;
    this.caricaUtenti();
  }

  caricaUtenti(): void {
    this.utenteService.getUsers().subscribe({
      next: (data) => {
        this.utenti = data;
      },
      error: (err) => {
        this.showAlertMessage('Impossibile caricare la lista degli utenti.', 'error');
      }
    });
  }

  promuoviAdAdmin(user: any): void {
    this.confirmMessage = `Sei sicuro di voler promuovere ${user.nome} ${user.cognome} ad ADMIN?`;
    this.actionToConfirm = 'promuovi';
    this.itemToProcess = user;
    this.showConfirm = true;
  }

  eliminaUtente(user: any): void {
    this.confirmMessage = `Sei sicuro di voler eliminare l'utente ${user.nome} ${user.cognome}? L'azione è irreversibile.`;
    this.actionToConfirm = 'elimina';
    this.itemToProcess = user;
    this.showConfirm = true;
  }

  gestisciRisposta(risposta: boolean) {
    this.showConfirm = false;
    if (risposta && this.itemToProcess) {
      if (this.actionToConfirm === 'promuovi') {
        this.eseguiPromozione(this.itemToProcess.id);
      } else if (this.actionToConfirm === 'elimina') {
        this.eseguiEliminazione(this.itemToProcess.id);
      }
    }
    this.itemToProcess = null;
  }

  private eseguiPromozione(id: number) {
    this.utenteService.promoteUser(id).subscribe({
      next: (res) => { this.showAlertMessage(res, 'success'); this.caricaUtenti(); },
      error: (err) => this.showAlertMessage(err.error || 'Errore.', 'error')
    });
  }

  private eseguiEliminazione(id: number) {
    this.utenteService.deleteUser(id).subscribe({
      next: (res) => { this.showAlertMessage(res, 'success'); this.caricaUtenti(); },
      error: (err) => this.showAlertMessage(err.error || 'Errore.', 'error')
    });
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
  }

  onAlertDismiss(): void {
    this.showAlert = false;
  }
}
