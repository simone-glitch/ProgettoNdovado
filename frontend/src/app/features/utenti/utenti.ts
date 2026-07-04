import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UtenteService } from '../../services/utente.service';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-utenti',
  standalone: true,
  imports: [CommonModule, RouterLink, SharedModule],
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
  actionToConfirm: 'promuovi' | 'elimina' | 'banna' | 'sbanna' | null = null;
  itemToProcess: any = null;

  constructor(
    private utenteService: UtenteService,
    private authService: AuthService,
    private i18n: TranslationService
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
        this.showAlertMessage(this.i18n.translate('utenti.msg.errore-caricamento'), 'error');
      }
    });
  }

  promuoviAdAdmin(user: any): void {
    this.confirmMessage = this.i18n.translate('utenti.msg.conferma-promuovi')
      .replace('{nome}', user.nome).replace('{cognome}', user.cognome);
    this.actionToConfirm = 'promuovi';
    this.itemToProcess = user;
    this.showConfirm = true;
  }

  eliminaUtente(user: any): void {
    this.confirmMessage = this.i18n.translate('utenti.msg.conferma-elimina')
      .replace('{nome}', user.nome).replace('{cognome}', user.cognome);
    this.actionToConfirm = 'elimina';
    this.itemToProcess = user;
    this.showConfirm = true;
  }

  bannaUtente(user: any): void {
    this.confirmMessage = this.i18n.translate('utenti.msg.conferma-banna')
      .replace('{nome}', user.nome).replace('{cognome}', user.cognome);
    this.actionToConfirm = 'banna';
    this.itemToProcess = user;
    this.showConfirm = true;
  }

  sbannaUtente(user: any): void {
    this.confirmMessage = this.i18n.translate('utenti.msg.conferma-sbanna')
      .replace('{nome}', user.nome).replace('{cognome}', user.cognome);
    this.actionToConfirm = 'sbanna';
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
      } else if (this.actionToConfirm === 'banna') {
        this.eseguiBanna(this.itemToProcess.id);
      } else if (this.actionToConfirm === 'sbanna') {
        this.eseguiSbanna(this.itemToProcess.id);
      }
    }
    this.itemToProcess = null;
  }

  private eseguiPromozione(id: number) {
    this.utenteService.promoteUser(id).subscribe({
      next: (res) => { this.showAlertMessage(res, 'success'); this.caricaUtenti(); },
      error: (err) => this.showAlertMessage(err.error || this.i18n.translate('utenti.msg.errore-generico'), 'error')
    });
  }

  private eseguiEliminazione(id: number) {
    this.utenteService.deleteUser(id).subscribe({
      next: (res) => { this.showAlertMessage(res, 'success'); this.caricaUtenti(); },
      error: (err) => this.showAlertMessage(err.error || this.i18n.translate('utenti.msg.errore-generico'), 'error')
    });
  }

  private eseguiBanna(id: number) {
    this.utenteService.bannaUser(id).subscribe({
      next: (res) => { this.showAlertMessage(res, 'success'); this.caricaUtenti(); },
      error: (err) => this.showAlertMessage(err.error || this.i18n.translate('utenti.msg.errore-generico'), 'error')
    });
  }

  private eseguiSbanna(id: number) {
    this.utenteService.sbannaUser(id).subscribe({
      next: (res) => { this.showAlertMessage(res, 'success'); this.caricaUtenti(); },
      error: (err) => this.showAlertMessage(err.error || this.i18n.translate('utenti.msg.errore-generico'), 'error')
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
