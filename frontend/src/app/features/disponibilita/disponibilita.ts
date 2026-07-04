import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { PreferencesService } from '../../services/preferences.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-disponibilita',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule],
  templateUrl: './disponibilita.html',
  styleUrl: './disponibilita.css',
})
export class Disponibilita implements OnInit {
  hotels: any[] = [];
  hotelSelezionatoId: number | null = null;
  blocchi: any[] = [];
  loading = false;
  savingBlocco = false;

  // Form nuovo blocco
  dataInizio = '';
  dataFine = '';

  oggi = new Date().toISOString().split('T')[0];

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  showConfirm = false;
  confirmMessage = '';
  private bloccoDaRimuovere: any = null;

  constructor(
    private hotelService: HotelService,
    private authService: AuthService,
    public i18n: TranslationService,
    private prefs: PreferencesService,
    private router: Router,
  ) {}

  ngOnInit() {
    if (!this.authService.isHost() && !this.authService.isAdmin()) {
      this.router.navigate(['/dashboard/home']);
      return;
    }
    this.caricaHotels();
  }

  private caricaHotels() {
    this.loading = true;
    this.hotelService.getMiei().subscribe({
      next: (h) => {
        this.hotels = h ?? [];
        this.loading = false;
        if (this.hotels.length > 0) {
          this.hotelSelezionatoId = this.hotels[0].id;
          this.caricaBlocchi();
        }
      },
      error: () => { this.hotels = []; this.loading = false; },
    });
  }

  onHotelChange() {
    this.caricaBlocchi();
  }

  private caricaBlocchi() {
    if (this.hotelSelezionatoId == null) { this.blocchi = []; return; }
    this.hotelService.getBlocchi(this.hotelSelezionatoId).subscribe({
      next: (b) => this.blocchi = b ?? [],
      error: () => this.blocchi = [],
    });
  }

  aggiungiBlocco() {
    if (this.hotelSelezionatoId == null) return;
    if (!this.dataInizio || !this.dataFine) {
      this.alert(this.i18n.translate('disp.msg.date-mancanti'), 'warning');
      return;
    }
    if (this.dataFine < this.dataInizio) {
      this.alert(this.i18n.translate('disp.msg.date-invalide'), 'warning');
      return;
    }
    this.savingBlocco = true;
    this.hotelService.aggiungiBlocco(this.hotelSelezionatoId, {
      dataInizio: this.dataInizio,
      dataFine: this.dataFine,
    }).subscribe({
      next: () => {
        this.savingBlocco = false;
        this.dataInizio = ''; this.dataFine = '';
        this.alert(this.i18n.translate('disp.msg.aggiunto'), 'success');
        this.caricaBlocchi();
      },
      error: (e) => {
        this.savingBlocco = false;
        this.alert(this.estraiErrore(e), 'error');
      },
    });
  }

  chiediRimozione(b: any) {
    this.bloccoDaRimuovere = b;
    this.confirmMessage = this.i18n.translate('disp.conferma-sblocco');
    this.showConfirm = true;
  }

  gestisciConferma(risposta: boolean) {
    this.showConfirm = false;
    const b = this.bloccoDaRimuovere;
    this.bloccoDaRimuovere = null;
    if (!risposta || !b) return;
    this.hotelService.rimuoviBlocco(b.id).subscribe({
      next: () => { this.alert(this.i18n.translate('disp.msg.rimosso'), 'success'); this.caricaBlocchi(); },
      error: (e) => this.alert(this.estraiErrore(e), 'error'),
    });
  }

  // ── Helpers ──

  fmtData(d: string): string {
    if (!d) return '';
    const [y, m, g] = d.split('-');
    return `${g}/${m}/${y}`;
  }

  durata(b: any): number {
    const inizio = new Date(b.dataInizio).getTime();
    const fine = new Date(b.dataFine).getTime();
    return Math.max(1, Math.round((fine - inizio) / (1000 * 60 * 60 * 24)) + 1);
  }

  private estraiErrore(e: any): string {
    const err = e?.error;
    if (typeof err === 'string' && err.trim()) return err;
    if (err?.message) return err.message;
    return this.i18n.translate('disp.msg.errore');
  }

  private alert(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
