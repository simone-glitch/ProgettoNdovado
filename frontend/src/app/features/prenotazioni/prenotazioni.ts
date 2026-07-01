import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrenotazioneService } from '../../services/prenotazione.service';
import { AuthService } from '../../services/auth.service';
import { PreferencesService } from '../../services/preferences.service';
import { SharedModule } from '../../shared/shared.module';
import { TranslationService } from '../../services/translation.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-prenotazioni',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './prenotazioni.html',
  styleUrl: './prenotazioni.css',
})
export class Prenotazioni implements OnInit {
  prenotazioni: any[] = [];
  loading = false;
  errorLoading = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  showConfirm = false;
  confirmMessage = '';
  actionPending: (() => void) | null = null;

  searchQuery = '';
  filterStatus = '';
  filterPeriodo = '';
  activeTab: 'tutte' | 'arrivo' | 'prenotate' | 'completate' | 'cancellate' = 'tutte';

  readonly skeletonItems = [1, 2, 3, 4];
  readonly skeletonBookings = [1, 2, 3];

  constructor(
    private prenotazioneService: PrenotazioneService,
    private authService: AuthService,
    private prefsService: PreferencesService,
    private router: Router,
    public i18n: TranslationService,
    private chatService: ChatService
  ) {}

  get isAdmin() { return this.authService.isAdmin(); }
  get isHost()  { return this.authService.isHost(); }
  get isGuest() { return this.authService.isGuest(); }

  ngOnInit() { this.carica(); }

  carica() {
    this.loading = true;
    this.errorLoading = false;
    const req$ = this.isAdmin
      ? this.prenotazioneService.getTutte()
      : this.prenotazioneService.getMie();

    req$.subscribe({
      next: (data) => { this.prenotazioni = data; this.loading = false; },
      error: () => { this.loading = false; this.errorLoading = true; }
    });
  }

  // ── Date parsing (handles both ISO string and Java array format) ──

  private toLocalDate(val: any): Date | null {
    if (!val) return null;
    if (Array.isArray(val) && val.length >= 3) {
      return new Date(val[0], val[1] - 1, val[2]);
    }
    if (typeof val === 'string') {
      const parts = val.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private todayMidnight(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // ── Booking classification ──

  isArrivoBooking(p: any): boolean {
    if (p.stato === 'CANCELLATA') return false;
    const checkout = this.toLocalDate(p.dataCheckout);
    return checkout != null && checkout >= this.todayMidnight();
  }

  isCompletataBooking(p: any): boolean {
    if (p.stato === 'CANCELLATA') return false;
    const checkout = this.toLocalDate(p.dataCheckout);
    return checkout != null && checkout < this.todayMidnight();
  }

  // ── Stats (computed from real data) ──

  get prenotazioniAttive(): number {
    return this.prenotazioni.filter(p => this.isArrivoBooking(p)).length;
  }

  get soggiorniCompletati(): number {
    return this.prenotazioni.filter(p => this.isCompletataBooking(p)).length;
  }

  get totaleSpeso(): string {
    const tot = this.prenotazioni
      .filter(p => p.stato !== 'CANCELLATA' && p.prezzoTotale != null)
      .reduce((acc, p) => acc + Number(p.prezzoTotale || 0), 0);
    return this.formatPrezzo(tot);
  }

  get prossimoCheckin(): string {
    const oggi = this.todayMidnight();
    const dates = this.prenotazioni
      .filter(p => p.stato !== 'CANCELLATA')
      .map(p => this.toLocalDate(p.dataCheckin))
      .filter((d): d is Date => d != null && d >= oggi)
      .sort((a, b) => a.getTime() - b.getTime());
    return dates.length > 0 ? this.formatDate(dates[0]) : this.i18n.translate('booking.nessuno');
  }

  // ── Filtered list (reactive) ──

  get prenotazioniFiltrate(): any[] {
    let lista = [...this.prenotazioni];

    if (this.activeTab === 'arrivo')      lista = lista.filter(p => this.isArrivoBooking(p));
    else if (this.activeTab === 'prenotate')  lista = lista.filter(p => this.isArrivoBooking(p));
    else if (this.activeTab === 'completate') lista = lista.filter(p => this.isCompletataBooking(p));
    else if (this.activeTab === 'cancellate') lista = lista.filter(p => p.stato === 'CANCELLATA');

    if (this.filterStatus === '_COMPLETATA') {
      lista = lista.filter(p => this.isCompletataBooking(p));
    } else if (this.filterStatus) {
      lista = lista.filter(p => p.stato === this.filterStatus);
    }

    if (this.filterPeriodo) {
      const dateFiltro = new Date(this.filterPeriodo);
      lista = lista.filter(p => {
        const checkin = this.toLocalDate(p.dataCheckin);
        return checkin != null && checkin >= dateFiltro;
      });
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      lista = lista.filter(p =>
        (p.nomeHotel || '').toLowerCase().includes(q) ||
        (p.tipoCamera || '').toLowerCase().includes(q) ||
        this.bookingCode(p).toLowerCase().includes(q)
      );
    }

    return lista;
  }

  // ── Formatting ──

  private readonly localeMap: Record<string, string> = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };

  private get locale(): string {
    return this.localeMap[this.prefsService.langCode] ?? 'it-IT';
  }

  formatDate(val: any): string {
    const d = this.toLocalDate(val);
    if (!d) return this.i18n.translate('booking.data-non-disponibile');
    return d.toLocaleDateString(this.locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatPrezzo(val: number | null | undefined): string {
    if (val == null || isNaN(Number(val))) return this.i18n.translate('booking.nd');
    return this.prefsService.formatCurrency(Number(val));
  }

  private readonly tipoCameraKeys: Record<string, string> = {
    SINGOLA: 'booking.camera.singola',
    DOPPIA: 'booking.camera.doppia',
    TRIPLA: 'booking.camera.tripla',
    SUITE: 'booking.camera.suite',
    FAMILIARE: 'booking.camera.familiare',
    DELUXE: 'booking.camera.deluxe',
  };

  formatTipoCamera(tipo: string | null | undefined): string {
    if (!tipo) return this.i18n.translate('booking.camera-non-specificata');
    const key = this.tipoCameraKeys[tipo.toUpperCase()];
    return key ? this.i18n.translate(key) : tipo;
  }

  private readonly currencyIconClasses: Record<string, string> = {
    EUR: 'fa-euro-sign',
    USD: 'fa-dollar-sign',
    GBP: 'fa-pound-sign',
    CHF: 'fa-franc-sign',
  };

  get currencyIconClass(): string {
    return this.currencyIconClasses[this.prefsService.currencyCode] ?? 'fa-euro-sign';
  }

  bookingCode(p: any): string {
    return p.id ? `NDV-${String(p.id).padStart(5, '0')}` : this.i18n.translate('booking.nd');
  }

  isScaduta(p: any): boolean {
    if (p.stato !== 'IN_ATTESA') return false;
    const checkout = this.toLocalDate(p.dataCheckout);
    return checkout != null && checkout <= this.todayMidnight();
  }

  getStatoLabel(stato: string, p?: any): string {
    if (p && this.isScaduta(p))          return this.i18n.translate('booking.stato-cancellata');
    if (p && this.isCompletataBooking(p)) return 'Completata';
    const m: Record<string, string> = {
      IN_ATTESA: this.i18n.translate('booking.stato-attesa'),
      CONFERMATA: this.i18n.translate('booking.stato-confermata'),
      CANCELLATA: this.i18n.translate('booking.stato-cancellata'),
    };
    return m[stato] ?? stato;
  }

  getStatoBadgeClass(stato: string, p?: any): string {
    if (p && this.isScaduta(p))           return 'badge-cancellata';
    if (p && this.isCompletataBooking(p)) return 'badge-completata';
    const m: Record<string, string> = { IN_ATTESA: 'badge-attesa', CONFERMATA: 'badge-confermata', CANCELLATA: 'badge-cancellata' };
    return m[stato] ?? '';
  }

  getHotelInitials(nome: string): string {
    if (!nome) return '?';
    return nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  // ── Tab / filter ──

  setTab(tab: 'tutte' | 'arrivo' | 'prenotate' | 'completate' | 'cancellate') {
    this.activeTab = tab;
  }

  applyFilters() { /* Filtering is reactive via prenotazioniFiltrate getter */ }

  // ── Existing actions (unchanged logic) ──

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
      next: () => { this.showAlertMessage(this.i18n.translate('booking.msg.stato-aggiornato'), 'success'); this.carica(); },
      error: () => this.showAlertMessage(this.i18n.translate('booking.msg.errore-stato'), 'error')
    });
  }

  elimina(id: number) {
    this.chiediConferma(this.i18n.translate('booking.msg.eliminare-conferma'), () => {
      this.prenotazioneService.elimina(id).subscribe({
        next: () => { this.showAlertMessage(this.i18n.translate('booking.msg.eliminata'), 'success'); this.carica(); },
        error: () => this.showAlertMessage(this.i18n.translate('booking.msg.errore-eliminazione'), 'error')
      });
    });
  }

  cancella(id: number) {
    this.chiediConferma(this.i18n.translate('booking.msg.annullare-conferma'), () => {
      this.prenotazioneService.aggiornaStato(id, 'CANCELLATA').subscribe({
        next: () => { this.showAlertMessage(this.i18n.translate('booking.msg.annullata'), 'success'); this.carica(); },
        error: () => this.showAlertMessage(this.i18n.translate('booking.msg.errore-generico'), 'error')
      });
    });
  }

  // ── Navigation ──

  vaiAgliHotel() {
    this.router.navigate(['/dashboard/home']);
  }

  vaiAssistenza() {
    this.chatService.openChat();
  }

  vaiDettagli(p: any) {
    if (p.idHotel) {
      this.router.navigate(['/dashboard/hotel-detail', p.idHotel]);
    } else {
      const codice  = this.bookingCode(p);
      const hotel   = p.nomeHotel || this.i18n.translate('booking.hotel-generico');
      const checkin = this.formatDate(p.dataCheckin);
      this.showAlertMessage(`${hotel} · ${codice} · ${this.i18n.translate('booking.checkin-label')}: ${checkin}`, 'info');
    }
  }

  lasciaRecensione(p: any) {
    if (p.idHotel) {
      this.router.navigate(['/dashboard/hotel-detail', p.idHotel], { queryParams: { review: 'true' } });
    } else {
      this.showAlertMessage(this.i18n.translate('booking.msg.hotel-non-trovato'), 'warning');
    }
  }

  prenotaDiNuovo(p: any) {
    if (p.idHotel) {
      this.router.navigate(['/dashboard/hotel-detail', p.idHotel], { queryParams: { prenota: 'true' } });
    } else {
      this.router.navigate(['/dashboard/home']);
    }
  }

  // ── Tab counts (for badges) ──

  get countArrivo(): number {
    return this.prenotazioni.filter(p => this.isArrivoBooking(p)).length;
  }

  get countPrenotate(): number {
    return this.prenotazioni.filter(p => this.isArrivoBooking(p)).length;
  }

  get countCompletate(): number {
    return this.prenotazioni.filter(p => this.isCompletataBooking(p)).length;
  }

  get countCancellate(): number {
    return this.prenotazioni.filter(p => p.stato === 'CANCELLATA').length;
  }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }

  onAlertDismiss() { this.showAlert = false; }
}
