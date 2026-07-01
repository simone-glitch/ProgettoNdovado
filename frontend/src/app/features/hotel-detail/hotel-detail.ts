import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { PrenotazioneService } from '../../services/prenotazione.service';
import { RecensioneService } from '../../services/recensione.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { PreferencesService } from '../../services/preferences.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, RouterLink],
  templateUrl: './hotel-detail.html',
  styleUrl: './hotel-detail.css',
})
export class HotelDetail implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  hotel: any = null;
  camere: any[] = [];
  recensioni: any[] = [];
  loading = true;
  fotoAttiva = 0;

  selectedCamera: any = null;
  bookingForm!: FormGroup;

  showReviewForm = false;
  reviewForm!: FormGroup;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  showConfirm = false;
  confirmMessage = '';
  itemToDelete: any = null;

  showPaymentModal = false;
  carteLocali: any[] = [];
  cartaSelezionataIdx: number | null = null;

  puoRecensire = false;

  private mapInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private hotelService: HotelService,
    private prenotazioneService: PrenotazioneService,
    private recensioneService: RecensioneService,
    private authService: AuthService,
    private i18n: TranslationService,
    private prefsService: PreferencesService
  ) {}

  formatPrezzo(val: number | null | undefined): string {
    if (val == null || isNaN(Number(val))) return '—';
    return this.prefsService.formatCurrency(Number(val));
  }

  ngOnInit() {
    this.bookingForm = this.fb.group({
      dataCheckin:  ['', Validators.required],
      dataCheckout: ['', Validators.required],
      numAdulti:    [1, [Validators.required, Validators.min(1)]],
      numBambini:   [0, [Validators.required, Validators.min(0)]]
    });
    this.reviewForm = this.fb.group({
      titolo: [''],
      testo:  ['', Validators.required],
      voto:   [5, [Validators.required, Validators.min(1), Validators.max(5)]]
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const openReview  = this.route.snapshot.queryParamMap.get('review')  === 'true';
    const openPrenota = this.route.snapshot.queryParamMap.get('prenota') === 'true';

    this.caricaHotel(id);
    this.caricaRecensioni(id);

    if (this.isGuest) {
      this.prenotazioneService.puoiRecensire(id).subscribe({
        next: (ok) => {
          this.puoRecensire = ok;
          if (openReview && ok) {
            this.showReviewForm = true;
            setTimeout(() => this.scrollToSection('recensioni'), 600);
          }
        },
        error: () => this.puoRecensire = false
      });
    }

    if (openPrenota) {
      setTimeout(() => this.scrollToSection('prenota'), 600);
    }
  }

  private scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngAfterViewInit() {
    if (this.hotel && !this.mapInitialized) this.inizializzaMappa();
  }

  caricaHotel(id: number) {
    this.loading = true;
    this.hotelService.getDettaglio(id).subscribe({
      next: (h) => {
        this.hotel = h;
        this.camere = h.camere ?? [];
        this.loading = false;
        setTimeout(() => this.inizializzaMappa(), 300);
      },
      error: () => { this.loading = false; }
    });
  }

  caricaRecensioni(id: number) {
    this.recensioneService.getPerHotel(id).subscribe(r => this.recensioni = r);
  }

  inizializzaMappa() {
    if (this.mapInitialized || !this.hotel?.latitudine || !this.hotel?.longitudine) return;
    const L = (window as any).L;
    if (!L || !this.mapContainer?.nativeElement) return;
    this.mapInitialized = true;

    const lat = Number(this.hotel.latitudine);
    const lng = Number(this.hotel.longitudine);

    const map = L.map(this.mapContainer.nativeElement).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<strong>${this.hotel.nome}</strong><br>${this.hotel.indirizzo}`)
      .openPopup();
  }

  get isGuest()       { return this.authService.isGuest(); }
  get isAdmin()       { return this.authService.isAdmin(); }
  get currentUserId() { return this.authService.getLoggedUser()?.id; }

  stelle(n: number): string {
    return '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)));
  }

  get fotoUrls(): string[] { return this.hotel?.fotoUrls ?? []; }

  get fotoGalleria(): string[] {
    const f = this.fotoUrls;
    if (f.length === 0) return [];
    return f.slice(1, 5);
  }

  selezionaCamera(camera: any) {
    if (!camera.disponibile) return;
    this.selectedCamera = (this.selectedCamera?.id === camera.id) ? null : camera;
  }

  get numNotti(): number {
    const v = this.bookingForm.value;
    if (!v.dataCheckin || !v.dataCheckout) return 0;
    const diff = new Date(v.dataCheckout).getTime() - new Date(v.dataCheckin).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  get totaleCalcolato(): number {
    if (!this.selectedCamera || this.numNotti <= 0) return 0;
    return this.selectedCamera.prezzoNotte * this.numNotti;
  }

  get canPrenotare(): boolean {
    return !!this.selectedCamera && this.numNotti > 0 && this.formValido;
  }

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  get minCheckout(): string {
    const checkin = this.bookingForm.value.dataCheckin;
    if (!checkin) return this.todayStr;
    const d = new Date(checkin);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  get erroreCheckin(): string | null {
    const checkin = this.bookingForm.value.dataCheckin;
    if (!checkin) return null;
    const d = new Date(checkin); d.setHours(0, 0, 0, 0);
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    if (d < oggi) return this.i18n.translate('hoteldetail.msg.checkin-passato');
    return null;
  }

  get erroreCheckout(): string | null {
    const v = this.bookingForm.value;
    if (!v.dataCheckout) return null;
    if (v.dataCheckin && v.dataCheckout <= v.dataCheckin)
      return this.i18n.translate('hoteldetail.msg.checkout-prima');
    return null;
  }

  get totalOspiti(): number {
    const v = this.bookingForm.value;
    return (v.numAdulti ?? 0) + (v.numBambini ?? 0);
  }

  decrementa(campo: 'numAdulti' | 'numBambini') {
    const min = campo === 'numAdulti' ? 1 : 0;
    const curr = this.bookingForm.value[campo] ?? min;
    if (curr > min) this.bookingForm.patchValue({ [campo]: curr - 1 });
  }

  incrementa(campo: 'numAdulti' | 'numBambini') {
    const cap = this.selectedCamera?.capienza ?? 10;
    if (this.totalOspiti < cap) {
      const curr = this.bookingForm.value[campo] ?? 0;
      this.bookingForm.patchValue({ [campo]: curr + 1 });
    }
  }

  get erroreOspiti(): string | null {
    if (!this.selectedCamera) return null;
    if (this.totalOspiti < 1) return this.i18n.translate('hoteldetail.msg.ospiti-min');
    if (this.totalOspiti > this.selectedCamera.capienza)
      return `${this.i18n.translate('hoteldetail.msg.ospiti-max')} ${this.selectedCamera.capienza}.`;
    return null;
  }

  get formValido(): boolean {
    return !this.erroreCheckin && !this.erroreCheckout && !this.erroreOspiti
      && !!this.bookingForm.value.dataCheckin && !!this.bookingForm.value.dataCheckout;
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
    if (!tipo) return '';
    const key = this.tipoCameraKeys[tipo.toUpperCase()];
    return key ? this.i18n.translate(key) : tipo;
  }

  confermaPrenotazione() {
    if (!this.selectedCamera) {
      this.showAlertMessage(this.i18n.translate('hoteldetail.msg.seleziona-camera'), 'warning');
      return;
    }
    if (this.bookingForm.invalid) { this.bookingForm.markAllAsTouched(); return; }
    const v = this.bookingForm.value;
    if (this.selectedCamera.capienza && this.totalOspiti > this.selectedCamera.capienza) {
      this.showAlertMessage(
        `${this.i18n.translate('hoteldetail.msg.ospiti-max')} ${this.selectedCamera.capienza}.`,
        'error'
      );
      return;
    }
    const checkin  = new Date(v.dataCheckin);
    const checkout = new Date(v.dataCheckout);
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    if (checkin < today) {
      this.showAlertMessage(this.i18n.translate('hoteldetail.msg.checkin-passato'), 'error'); return;
    }
    if (checkout <= checkin) {
      this.showAlertMessage(this.i18n.translate('hoteldetail.msg.checkout-prima'), 'error'); return;
    }
    this.caricaCarteLocali();
    this.showPaymentModal = true;
  }

  private caricaCarteLocali(): void {
    try {
      const raw = localStorage.getItem('ndv_metodi_pagamento');
      this.carteLocali = raw ? JSON.parse(raw) : [];
      const sel = localStorage.getItem('ndv_carta_selezionata');
      if (sel !== null && sel !== 'null' && this.carteLocali.length > 0) {
        const idx = Number(sel);
        this.cartaSelezionataIdx = idx < this.carteLocali.length ? idx : 0;
      } else {
        this.cartaSelezionataIdx = this.carteLocali.length > 0 ? 0 : null;
      }
    } catch {
      this.carteLocali = [];
      this.cartaSelezionataIdx = null;
    }
  }

  eseguiPagamento() {
    if (this.cartaSelezionataIdx === null) {
      this.showAlertMessage(this.i18n.translate('hoteldetail.msg.seleziona-metodo'), 'warning');
      return;
    }
    const v = this.bookingForm.value;
    this.prenotazioneService.crea({
      idCamera:     this.selectedCamera.id,
      dataCheckin:  v.dataCheckin,
      dataCheckout: v.dataCheckout,
      numOspiti:    this.totalOspiti
    }).subscribe({
      next: () => {
        this.showPaymentModal = false;
        this.cartaSelezionataIdx = null;
        this.showAlertMessage(this.i18n.translate('hoteldetail.msg.prenotazione-ok'), 'success');
        this.selectedCamera = null;
        this.bookingForm.reset({ numAdulti: 1, numBambini: 0 });
        this.caricaHotel(this.hotel.id);
      },
      error: (e) => {
        this.showPaymentModal = false;
        const msg = (typeof e.error === 'string' && e.error)
          ? e.error
          : (e.error?.message ?? this.i18n.translate('hoteldetail.msg.prenotazione-err'));
        this.showAlertMessage(msg, 'error');
      }
    });
  }

  annullaPagamento() {
    this.showPaymentModal = false;
    this.cartaSelezionataIdx = null;
  }

  inviaRecensione() {
    if (this.reviewForm.invalid) { this.reviewForm.markAllAsTouched(); return; }
    const v = this.reviewForm.value;
    this.recensioneService.aggiungi({ idHotel: this.hotel.id, titolo: v.titolo, testo: v.testo, voto: v.voto }).subscribe({
      next: () => {
        this.showReviewForm = false;
        this.showAlertMessage(this.i18n.translate('hoteldetail.msg.recensione-ok'), 'success');
        this.caricaRecensioni(this.hotel.id);
      },
      error: (e) => this.showAlertMessage(e.error?.message ?? this.i18n.translate('hoteldetail.msg.errore'), 'error')
    });
  }

  chiediEliminaRecensione(rec: any) {
    this.confirmMessage = this.i18n.translate('hoteldetail.msg.elimina-recensione');
    this.itemToDelete = rec;
    this.showConfirm = true;
  }

  gestisciRisposta(risposta: boolean) {
    this.showConfirm = false;
    if (risposta && this.itemToDelete) {
      this.recensioneService.elimina(this.itemToDelete.id).subscribe({
        next: () => { this.showAlertMessage(this.i18n.translate('hoteldetail.msg.recensione-eliminata'), 'success'); this.caricaRecensioni(this.hotel.id); },
        error: () => this.showAlertMessage(this.i18n.translate('hoteldetail.msg.errore'), 'error')
      });
    }
    this.itemToDelete = null;
  }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
  indietro()       { this.router.navigate(['/dashboard/home']); }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const citta = this.hotel?.citta?.toLowerCase();
    const fallbackMap: Record<string, string> = {
      'napoli':  '/assets/images/Hotel_Image/Napoli.jpg',
      'roma':    '/assets/images/Hotel_Image/Roma.jpg',
      'venezia': '/assets/images/Hotel_Image/Venezia.jpg',
      'siena':   '/assets/images/Hotel_Image/Toscana.jpg',
    };
    const fallback = fallbackMap[citta] ?? '/assets/images/Hotel_Image/Roma.jpg';
    if (!img.src.endsWith(fallback)) {
      img.src = fallback;
    }
  }
}
