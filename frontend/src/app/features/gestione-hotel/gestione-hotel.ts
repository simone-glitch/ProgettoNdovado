import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-gestione-hotel',
  standalone: true,
  imports: [CommonModule, RouterLink, SharedModule],
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
    const req$ = this.isAdmin ? this.hotelService.getPerGestione() : this.hotelService.getMiei();
    req$.subscribe({
      next: (data) => { this.hotels = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // ── Navigazione a pagine dedicate ──

  vediHotel(h: any) { if (h?.id) this.router.navigate(['/dashboard/hotel-detail', h.id]); }
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

  // ── Stato (etichette condivise con "I miei hotel") ──

  private statoUpper(h: any): string { return (h?.stato ?? 'PUBBLICATO').toUpperCase(); }

  getStatoLabel(h: any): string {
    const map: Record<string, string> = {
      PUBBLICATO: 'myhotel.stato.label.pubblicato', IN_REVISIONE: 'myhotel.stato.label.in-revisione',
      BOZZA: 'myhotel.stato.label.bozza', NON_ATTIVO: 'myhotel.stato.label.non-attivo',
      SOSPESO: 'myhotel.stato.label.sospeso', RIFIUTATO: 'myhotel.stato.label.rifiutato',
    };
    return this.i18n.translate(map[this.statoUpper(h)] ?? 'myhotel.stato.label.pubblicato');
  }

  getStatoBadgeClass(h: any): string {
    const s = this.statoUpper(h);
    if (s === 'PUBBLICATO')   return 'badge-pubblicato';
    if (s === 'IN_REVISIONE') return 'badge-revisione';
    if (s === 'BOZZA')        return 'badge-bozza';
    if (s === 'RIFIUTATO')    return 'badge-rifiutato';
    return 'badge-non-attivo'; // NON_ATTIVO, SOSPESO
  }

  // ── Moderazione (solo ADMIN) ──

  puoApprovareRifiutare(h: any): boolean { return this.isAdmin && this.statoUpper(h) === 'IN_REVISIONE'; }
  puoSospendere(h: any): boolean         { return this.isAdmin && ['PUBBLICATO', 'NON_ATTIVO'].includes(this.statoUpper(h)); }
  puoRiattivare(h: any): boolean         { return this.isAdmin && this.statoUpper(h) === 'SOSPESO'; }

  private moderazione(op$: any, h: any, nuovoStato: string, msgKey: string) {
    op$.subscribe({
      next: () => { h.stato = nuovoStato; this.showAlertMessage(this.i18n.translate(msgKey), 'success'); },
      error: (e: any) => this.showAlertMessage(e?.error?.message ?? this.i18n.translate('gestionehotel.msg.errore-stato'), 'error'),
    });
  }

  approvaHotel(h: any)  { if (h?.id) this.moderazione(this.hotelService.approva(h.id),  h, 'PUBBLICATO', 'gestionehotel.msg.approvato'); }
  rifiutaHotel(h: any)  { if (h?.id) this.moderazione(this.hotelService.rifiuta(h.id),  h, 'RIFIUTATO',  'gestionehotel.msg.rifiutato'); }
  sospendiHotel(h: any) { if (h?.id) this.moderazione(this.hotelService.sospendi(h.id), h, 'SOSPESO',    'gestionehotel.msg.sospeso'); }
  riattivaHotel(h: any) { if (h?.id) this.moderazione(this.hotelService.riattiva(h.id), h, 'PUBBLICATO', 'gestionehotel.msg.riattivato'); }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
