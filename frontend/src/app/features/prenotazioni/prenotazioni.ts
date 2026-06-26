import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrenotazioneService } from '../../services/prenotazione.service';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';

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
  activeTab: 'tutte' | 'arrivo' | 'completate' | 'cancellate' = 'tutte';

  readonly skeletonItems = [1, 2, 3, 4];
  readonly skeletonBookings = [1, 2, 3];

  constructor(
    private prenotazioneService: PrenotazioneService,
    private authService: AuthService,
    private router: Router
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
    return dates.length > 0 ? this.formatDate(dates[0]) : 'Nessuno';
  }

  // ── Filtered list (reactive) ──

  get prenotazioniFiltrate(): any[] {
    let lista = [...this.prenotazioni];

    if (this.activeTab === 'arrivo') lista = lista.filter(p => this.isArrivoBooking(p));
    else if (this.activeTab === 'completate') lista = lista.filter(p => this.isCompletataBooking(p));
    else if (this.activeTab === 'cancellate') lista = lista.filter(p => p.stato === 'CANCELLATA');

    if (this.filterStatus) lista = lista.filter(p => p.stato === this.filterStatus);

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

  formatDate(val: any): string {
    const d = this.toLocalDate(val);
    if (!d) return 'Data non disponibile';
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatPrezzo(val: number | null | undefined): string {
    if (val == null || isNaN(Number(val))) return 'N/D';
    return '€ ' + Number(val).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  bookingCode(p: any): string {
    return p.id ? `NDV-${String(p.id).padStart(5, '0')}` : 'N/D';
  }

  getStatoLabel(stato: string): string {
    const m: Record<string, string> = { IN_ATTESA: 'In attesa', CONFERMATA: 'Confermata', CANCELLATA: 'Cancellata' };
    return m[stato] ?? stato;
  }

  getStatoBadgeClass(stato: string): string {
    const m: Record<string, string> = { IN_ATTESA: 'badge-attesa', CONFERMATA: 'badge-confermata', CANCELLATA: 'badge-cancellata' };
    return m[stato] ?? '';
  }

  getHotelInitials(nome: string): string {
    if (!nome) return '?';
    return nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  // ── Tab / filter ──

  setTab(tab: 'tutte' | 'arrivo' | 'completate' | 'cancellate') {
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

  // ── Navigation ──

  vaiAgliHotel() {
    this.router.navigate(['/dashboard/home']);
  }

  vaiAssistenza() {
    this.showAlertMessage('Per assistenza immediata usa il pulsante chat in basso a destra.', 'info');
  }

  vaiDettagli(p: any) {
    const codice = this.bookingCode(p);
    const hotel  = p.nomeHotel || 'Hotel';
    const checkin = this.formatDate(p.dataCheckin);
    this.showAlertMessage(`${hotel} · ${codice} · Check-in: ${checkin}`, 'info');
  }

  // ── Tab counts (for badges) ──

  get countArrivo(): number {
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
