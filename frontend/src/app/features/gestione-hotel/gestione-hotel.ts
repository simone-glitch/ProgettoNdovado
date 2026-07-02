import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-gestione-hotel',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './gestione-hotel.html',
  styleUrl: './gestione-hotel.css',
})
export class GestioneHotel implements OnInit {
  hotels: any[] = [];
  loading = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  showConfirm = false;
  confirmMessage = '';
  private actionPending: (() => void) | null = null;

  constructor(
    private hotelService: HotelService,
    private authService: AuthService,
    private i18n: TranslationService,
    private router: Router,
  ) {}

  get isAdmin() { return this.authService.isAdmin(); }

  ngOnInit() { this.caricaHotel(); }

  caricaHotel() {
    this.loading = true;
    const req$ = this.isAdmin ? this.hotelService.getTutti() : this.hotelService.getMiei();
    req$.subscribe({
      next: (data) => { this.hotels = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // ── Navigazione a pagine dedicate ──

  apriModificaHotel(h: any) { if (h?.id) this.router.navigate(['/dashboard/hotel', h.id, 'modifica']); }
  gestisciCamere(h: any) { if (h?.id) this.router.navigate(['/dashboard/hotel', h.id, 'camere']); }

  // ── Eliminazione hotel ──

  chiediEliminaHotel(h: any) {
    this.confirmMessage =
      `${this.i18n.translate('gestionehotel.msg.conferma-elimina-hotel-pre')}${h.nome}${this.i18n.translate('gestionehotel.msg.conferma-elimina-hotel-post')}`;
    this.actionPending = () => {
      this.hotelService.elimina(h.id).subscribe({
        next: () => { this.showAlertMessage(this.i18n.translate('gestionehotel.msg.hotel-eliminato'), 'success'); this.caricaHotel(); },
        error: () => this.showAlertMessage(this.i18n.translate('gestionehotel.msg.errore-eliminazione'), 'error'),
      });
    };
    this.showConfirm = true;
  }

  gestisciRisposta(risposta: boolean) {
    this.showConfirm = false;
    if (risposta && this.actionPending) this.actionPending();
    this.actionPending = null;
  }

  stelle(n: number): string { return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n)); }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
