import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { PrenotazioneService } from '../../services/prenotazione.service';
import { AuthService } from '../../services/auth.service';
import { PreferencesService } from '../../services/preferences.service';
import { ChatService } from '../../services/chat.service';
import { TranslationService } from '../../services/translation.service';
import { SharedModule } from '../../shared/shared.module';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-miei-hotel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule],
  templateUrl: './miei-hotel.html',
  styleUrl: './miei-hotel.css',
})
export class MieiHotel implements OnInit {
  hotels: any[] = [];
  prenotazioni: any[] = [];
  loading = false;
  loadingError = false;

  searchQuery = '';
  filterStato = '';

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Conferma eliminazione
  showConfirm = false;
  confirmMessage = '';
  hotelDaEliminare: any = null;

  readonly skeletonItems = [1, 2, 3];

  constructor(
    private hotelService: HotelService,
    private prenotazioneService: PrenotazioneService,
    private authService: AuthService,
    private prefsService: PreferencesService,
    private chatService: ChatService,
    private i18n: TranslationService,
    private router: Router
  ) {}

  get currentUser() { return this.authService.getLoggedUser() ?? {}; }
  get isHost()      { return this.authService.isHost();  }
  get isAdmin()     { return this.authService.isAdmin(); }

  ngOnInit() {
    if (!this.isHost && !this.isAdmin) {
      this.router.navigate(['/dashboard/home']);
      return;
    }
    this.caricaDati();
  }

  caricaDati() {
    this.loading = true;
    this.loadingError = false;
    forkJoin({
      hotels: this.hotelService.getMiei().pipe(catchError(() => of([]))),
      prens:  this.prenotazioneService.getMie().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ hotels, prens }) => {
        this.hotels       = hotels ?? [];
        this.prenotazioni = prens  ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; this.loadingError = true; }
    });
  }

  riprova() { this.caricaDati(); }

  // ── Navigazione a pagine dedicate (niente più modale) ──

  apriNuovoHotel() {
    this.router.navigate(['/dashboard/hotel/nuovo']);
  }

  apriModificaHotel(hotel: any) {
    // Il wizard è l'editor unificato: riaprendolo con l'id si riprende dal punto lasciato
    // (ripristina i campi salvati e lo step memorizzato).
    if (hotel?.id) this.router.navigate(['/dashboard/aggiungi-hotel', hotel.id]);
  }

  // ── Date helpers ──

  private toDate(val: any): Date | null {
    if (!val) return null;
    if (Array.isArray(val) && val.length >= 3) return new Date(val[0], val[1] - 1, val[2]);
    if (typeof val === 'string') {
      const p = val.split('-').map(Number);
      if (p.length === 3 && !p.some(isNaN)) return new Date(p[0], p[1] - 1, p[2]);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private todayMidnight(): Date {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }

  // ── Global stats ──

  get hotelsPublicati(): number {
    return this.hotels.filter(h => ['PUBBLICATO', 'ATTIVO', 'APPROVED'].includes((h.stato ?? 'PUBBLICATO').toUpperCase())).length;
  }

  get hotelsBozze(): number {
    return this.hotels.filter(h =>
      ['BOZZA', 'DRAFT', 'NON_ATTIVO', 'SOSPESO', 'IN_REVISIONE', 'REVISIONE', 'RIFIUTATO'].includes((h.stato ?? '').toUpperCase())
    ).length;
  }

  get prenotazioniAttive(): number {
    const oggi = this.todayMidnight();
    return this.prenotazioni.filter(p => {
      if (p.stato === 'CANCELLATA') return false;
      const co = this.toDate(p.dataCheckout);
      return co != null && co >= oggi;
    }).length;
  }

  get entrateMese(): number {
    const now = new Date();
    return this.prenotazioni
      .filter(p => p.stato !== 'CANCELLATA' && p.prezzoTotale != null)
      .filter(p => { const d = this.toDate(p.dataCheckin); return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, p) => s + Number(p.prezzoTotale || 0), 0);
  }

  // ── Per-hotel stats ──

  private prenHotel(hotel: any): any[] {
    return this.prenotazioni.filter(p => p.nomeHotel === hotel.nome || p.idHotel === hotel.id);
  }

  getPrenotazioniMese(hotel: any): number {
    const now = new Date();
    return this.prenHotel(hotel).filter(p => {
      if (p.stato === 'CANCELLATA') return false;
      const d = this.toDate(p.dataCheckin);
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }

  getEntrateMeseHotel(hotel: any): number {
    const now = new Date();
    return this.prenHotel(hotel)
      .filter(p => { if (p.stato === 'CANCELLATA' || p.prezzoTotale == null) return false; const d = this.toDate(p.dataCheckin); return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, p) => s + Number(p.prezzoTotale || 0), 0);
  }

  getOccupazioneHotel(hotel: any): number {
    const all = this.prenHotel(hotel);
    if (all.length === 0) return 0;
    return Math.round((all.filter(p => p.stato !== 'CANCELLATA').length / all.length) * 100);
  }

  getOccupazioneColor(perc: number): string {
    return perc >= 70 ? '#22c55e' : perc >= 40 ? '#f59e0b' : '#ef4444';
  }

  getCamereCount(hotel: any): number { return hotel?.camere?.length ?? 0; }

  getHotelImg(hotel: any): string | null {
    return hotel?.foto?.[0]?.urlFoto ?? hotel?.immagine ?? hotel?.image ?? null;
  }

  getHotelInitials(nome: string): string {
    if (!nome) return '?';
    return nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  getRatingMedia(hotel: any): number | null {
    const v = hotel?.valutazioneMedia ?? hotel?.rating ?? hotel?.voto ?? null;
    return v != null ? Number(v) : null;
  }

  // ── Status ──

  getStatoLabel(hotel: any): string {
    const s = (hotel?.stato ?? 'PUBBLICATO').toUpperCase();
    const map: Record<string, string> = {
      PUBBLICATO: this.i18n.translate('myhotel.stato.label.pubblicato'), ATTIVO: this.i18n.translate('myhotel.stato.label.pubblicato'), APPROVED: this.i18n.translate('myhotel.stato.label.pubblicato'),
      IN_REVISIONE: this.i18n.translate('myhotel.stato.label.in-revisione'), REVISIONE: this.i18n.translate('myhotel.stato.label.in-revisione'), PENDING: this.i18n.translate('myhotel.stato.label.in-revisione'),
      BOZZA: this.i18n.translate('myhotel.stato.label.bozza'), DRAFT: this.i18n.translate('myhotel.stato.label.bozza'),
      NON_ATTIVO: this.i18n.translate('myhotel.stato.label.non-attivo'), INATTIVO: this.i18n.translate('myhotel.stato.label.non-attivo'),
      SOSPESO: this.i18n.translate('myhotel.stato.label.sospeso'), RIFIUTATO: this.i18n.translate('myhotel.stato.label.rifiutato'), REJECTED: this.i18n.translate('myhotel.stato.label.rifiutato'),
    };
    return map[s] ?? hotel?.stato ?? this.i18n.translate('myhotel.stato.label.pubblicato');
  }

  getStatoBadgeClass(hotel: any): string {
    const s = (hotel?.stato ?? 'PUBBLICATO').toUpperCase();
    if (['PUBBLICATO', 'ATTIVO', 'APPROVED'].includes(s))     return 'badge-pubblicato';
    if (['IN_REVISIONE', 'REVISIONE', 'PENDING'].includes(s)) return 'badge-revisione';
    if (['BOZZA', 'DRAFT'].includes(s))                        return 'badge-bozza';
    if (['NON_ATTIVO', 'INATTIVO', 'SOSPESO'].includes(s))    return 'badge-non-attivo';
    if (['RIFIUTATO', 'REJECTED'].includes(s))                 return 'badge-rifiutato';
    return 'badge-pubblicato';
  }

  // ── Services ──

  getServizioIcon(nome: string): string {
    const n = (nome ?? '').toLowerCase();
    if (n.includes('wifi') || n.includes('wi-fi'))                     return 'fa-wifi';
    if (n.includes('piscina') || n.includes('pool'))                   return 'fa-swimming-pool';
    if (n.includes('parcheggio') || n.includes('parking'))             return 'fa-parking';
    if (n.includes('ristorante') || n.includes('colazione'))           return 'fa-utensils';
    if (n.includes('palestra') || n.includes('fitness'))               return 'fa-dumbbell';
    if (n.includes('navetta') || n.includes('shuttle'))                return 'fa-shuttle-van';
    if (n.includes('giardino') || n.includes('terrazza'))              return 'fa-leaf';
    if (n.includes('spa') || n.includes('benessere'))                  return 'fa-spa';
    if (n.includes('aria') || n.includes('climatizzazione'))           return 'fa-snowflake';
    return 'fa-check-circle';
  }

  getServiziPrincipali(hotel: any): any[] { return (hotel?.servizi ?? []).slice(0, 5); }

  // ── Filters ──

  get hotelsFiltrati(): any[] {
    let lista = [...this.hotels];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      lista = lista.filter(h =>
        (h.nome ?? '').toLowerCase().includes(q) ||
        (h.citta ?? '').toLowerCase().includes(q) ||
        (h.indirizzo ?? '').toLowerCase().includes(q)
      );
    }
    if (this.filterStato) {
      lista = lista.filter(h => (h.stato ?? 'PUBBLICATO').toUpperCase() === this.filterStato.toUpperCase());
    }
    return lista;
  }

  // ── Promemoria ──

  get promemoria(): any[] {
    const items: any[] = [];
    const inAttesa = this.prenotazioni.filter(p => p.stato === 'IN_ATTESA').length;
    if (inAttesa > 0) items.push({ icon: 'fa-calendar-check', iconClass: 'reminder-orange', title: `${inAttesa} ${this.i18n.translate(inAttesa === 1 ? 'myhotel.promemoria.prenotazioni-attesa' : 'myhotel.promemoria.prenotazioni-attesa-plurale')}`, subtitle: this.i18n.translate('myhotel.promemoria.rispondi'), route: '/dashboard/prenotazioni' });
    const inRevisione = this.hotels.filter(h => ['IN_REVISIONE', 'REVISIONE', 'PENDING'].includes((h.stato ?? '').toUpperCase())).length;
    if (inRevisione > 0) items.push({ icon: 'fa-file-alt', iconClass: 'reminder-blue', title: `${inRevisione} ${this.i18n.translate(inRevisione === 1 ? 'myhotel.promemoria.struttura-revisione' : 'myhotel.promemoria.strutture-revisione')}`, subtitle: this.i18n.translate('myhotel.promemoria.attesa-approvazione'), route: '/dashboard/miei-hotel' });
    const senzaFoto = this.hotels.filter(h => !h.foto?.length);
    if (senzaFoto.length > 0) items.push({ icon: 'fa-camera', iconClass: 'reminder-green', title: this.i18n.translate('myhotel.aggiorna-foto'), subtitle: senzaFoto.slice(0, 2).map((h: any) => h.nome || this.i18n.translate('myhotel.struttura-fallback')).join(', '), route: '/dashboard/miei-hotel' });
    const bozze = this.hotels.filter(h => ['BOZZA', 'DRAFT'].includes((h.stato ?? '').toUpperCase())).length;
    if (bozze > 0) items.push({ icon: 'fa-edit', iconClass: 'reminder-yellow', title: `${bozze} ${this.i18n.translate(bozze === 1 ? 'myhotel.promemoria.bozza-completare' : 'myhotel.promemoria.bozze-completare')}`, subtitle: this.i18n.translate('myhotel.promemoria.completa-pubblica'), route: '/dashboard/miei-hotel' });
    return items;
  }

  // ── Formatting ──

  fmtEuro(val: number | null | undefined): string {
    return this.prefsService.formatCurrency(val ?? 0);
  }

  stelle(n: number): string { return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n)); }

  // ── Navigation ──

  vaiDettagli(hotel: any) { if (hotel?.id) this.router.navigate(['/dashboard/hotel-detail', hotel.id]); }
  vaiGestisciCamere(hotel: any) { if (hotel?.id) this.router.navigate(['/dashboard/hotel', hotel.id, 'camere']); }
  vaiStatistiche()  { this.router.navigate(['/dashboard/statistiche']); }
  vaiPrenotazioni() { this.router.navigate(['/dashboard/prenotazioni']); }
  vaiSupporto()     { this.chatService.openChat(); }
  navigateTo(route: string) { if (route) this.router.navigateByUrl(route); }

  // ── Eliminazione hotel/bozza ──

  chiediElimina(hotel: any) {
    if (!hotel?.id) return;
    this.hotelDaEliminare = hotel;
    const nome = hotel.nome || this.i18n.translate('myhotel.struttura-fallback');
    this.confirmMessage = this.i18n.translate('myhotel.msg.conferma-elimina').replace('{nome}', nome);
    this.showConfirm = true;
  }

  gestisciEliminazione(conferma: boolean) {
    this.showConfirm = false;
    const hotel = this.hotelDaEliminare;
    this.hotelDaEliminare = null;
    if (!conferma || !hotel?.id) return;
    this.hotelService.elimina(hotel.id).subscribe({
      next: () => {
        this.hotels = this.hotels.filter(h => h.id !== hotel.id);
        this.showAlertMessage(this.i18n.translate('myhotel.msg.hotel-eliminato'), 'success');
      },
      error: () => this.showAlertMessage(this.i18n.translate('myhotel.msg.errore-elimina'), 'error'),
    });
  }

  // ── Azioni ciclo di vita (host proprietario) ──

  private statoUpper(hotel: any): string { return (hotel?.stato ?? 'BOZZA').toUpperCase(); }

  puoInviareRevisione(hotel: any): boolean {
    const s = this.statoUpper(hotel);
    return s === 'BOZZA' || s === 'RIFIUTATO';
  }
  puoDisattivare(hotel: any): boolean { return this.statoUpper(hotel) === 'PUBBLICATO'; }
  puoAttivare(hotel: any): boolean    { return this.statoUpper(hotel) === 'NON_ATTIVO'; }

  private applicaStato(id: number, stato: string, msgKey: string) {
    const h = this.hotels.find(x => x.id === id);
    if (h) h.stato = stato;
    this.showAlertMessage(this.i18n.translate(msgKey), 'success');
  }
  private erroreStato = (e: any) =>
    this.showAlertMessage(e?.error?.message ?? this.i18n.translate('myhotel.msg.errore-stato'), 'error');

  inviaRevisione(hotel: any) {
    if (!hotel?.id) return;
    this.hotelService.inviaInRevisione(hotel.id).subscribe({
      next: () => this.applicaStato(hotel.id, 'IN_REVISIONE', 'myhotel.msg.inviato-revisione'),
      error: this.erroreStato,
    });
  }
  disattivaHotel(hotel: any) {
    if (!hotel?.id) return;
    this.hotelService.disattiva(hotel.id).subscribe({
      next: () => this.applicaStato(hotel.id, 'NON_ATTIVO', 'myhotel.msg.disattivato'),
      error: this.erroreStato,
    });
  }
  attivaHotel(hotel: any) {
    if (!hotel?.id) return;
    this.hotelService.attiva(hotel.id).subscribe({
      next: () => this.applicaStato(hotel.id, 'PUBBLICATO', 'myhotel.msg.attivato'),
      error: this.erroreStato,
    });
  }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
