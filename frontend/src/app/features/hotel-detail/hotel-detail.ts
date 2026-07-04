import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import flatpickr from 'flatpickr';
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
export class HotelDetail implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('checkinFp')   checkinInput?: ElementRef;
  @ViewChild('checkoutFp')  checkoutInput?: ElementRef;

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

  showCapienzaInfo = false;

  occupazioni: Array<{checkin: string; checkout: string}> = [];
  erroreOccupata = '';
  private fpCheckin:  any = null;
  private fpCheckout: any = null;

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
    private prefsService: PreferencesService,
    private ngZone: NgZone
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
    this.destroyFlatpickr();
    this.loading = true;
    this.occupazioni = [];
    this.hotelService.getDettaglio(id).subscribe({
      next: (h) => {
        this.hotel = h;
        this.camere = h.camere ?? [];
        this.loading = false;
        setTimeout(() => {
          this.inizializzaMappa();
          this.initFlatpickr();
        }, 300);
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

  // Prenotabile solo se la struttura è pubblicata: una sospesa (o non ancora
  // approvata) resta visualizzabile ma non consente la prenotazione.
  get prenotabile(): boolean {
    return (this.hotel?.stato ?? 'PUBBLICATO').toUpperCase() === 'PUBBLICATO';
  }
  get isSospeso(): boolean {
    return (this.hotel?.stato ?? '').toUpperCase() === 'SOSPESO';
  }
  get isNonAttivo(): boolean {
    return (this.hotel?.stato ?? '').toUpperCase() === 'NON_ATTIVO';
  }
  get bannerNonPrenotabile(): string {
    if (this.isSospeso)  return 'hoteldetail.sospeso-banner';
    if (this.isNonAttivo) return 'hoteldetail.non-attiva-banner';
    return 'hoteldetail.non-prenotabile-banner';
  }

  get isGuest()       { return this.authService.isGuest(); }
  get isHost()        { return this.authService.isHost(); }
  get isAdmin()       { return this.authService.isAdmin(); }
  get currentUserId() { return this.authService.getLoggedUser()?.id; }

  // Solo i guest prenotano: host e admin devono accedere con un profilo guest.
  get puoPrenotare(): boolean {
    return this.isGuest;
  }

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
    if (this.selectedCamera?.id === camera.id) {
      this.selectedCamera = null;
      this.showCapienzaInfo = false;
      this.occupazioni = [];
      this.aggiornaFlatpickrDisabled();
      return;
    }
    this.selectedCamera = camera;
    this.showCapienzaInfo = false;
    this.prenotazioneService.getOccupazioniCamera(camera.id).subscribe({
      next: (occ) => { this.occupazioni = occ; this.aggiornaFlatpickrDisabled(); },
      error: ()    => { this.occupazioni = [];  this.aggiornaFlatpickrDisabled(); }
    });
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
    return this.prenotabile && this.puoPrenotare && !!this.selectedCamera && this.numNotti > 0 && this.formValido;
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
      const raw = localStorage.getItem(this.authService.userKey('ndv_metodi_pagamento'));
      this.carteLocali = raw ? JSON.parse(raw) : [];
      const sel = localStorage.getItem(this.authService.userKey('ndv_carta_selezionata'));
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
        this.occupazioni = [];
        this.erroreOccupata = '';
        this.fpCheckin?.clear();
        this.fpCheckout?.clear();
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

  ngOnDestroy(): void {
    this.destroyFlatpickr();
  }

  private getDisabledRanges(): Array<{from: string; to: string}> {
    return this.occupazioni.map(o => {
      const to = new Date(o.checkout);
      to.setDate(to.getDate() - 1);
      const toStr = to.toISOString().split('T')[0];
      return { from: o.checkin, to: toStr };
    }).filter(r => r.from <= r.to);
  }

  private buildOccupatoClickHandler(fp: any): void {
    fp.calendarContainer?.addEventListener('click', (e: MouseEvent) => {
      const dayEl = (e.target as HTMLElement).closest?.('.flatpickr-day.flatpickr-disabled');
      if (dayEl) {
        this.ngZone.run(() => {
          this.erroreOccupata = this.i18n.translate('hoteldetail.msg.stanza-occupata');
          setTimeout(() => this.ngZone.run(() => { this.erroreOccupata = ''; }), 3500);
        });
      }
    }, true);
  }

  private initFlatpickr(): void {
    if (!this.checkinInput?.nativeElement || !this.checkoutInput?.nativeElement) return;
    this.destroyFlatpickr();
    const disabled = this.getDisabledRanges();

    this.fpCheckin = flatpickr(this.checkinInput.nativeElement, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      minDate: 'today',
      disable: disabled,
      disableMobile: false,
      onChange: (_: any, dateStr: any) => {
        this.ngZone.run(() => {
          this.bookingForm.patchValue({ dataCheckin: dateStr || '' });
          if (dateStr && this.fpCheckout) {
            const next = new Date(dateStr);
            next.setDate(next.getDate() + 1);
            this.fpCheckout.set('minDate', next.toISOString().split('T')[0]);
          }
          this.erroreOccupata = '';
        });
      },
      onReady: (_: any, __: any, fp: any) => { this.buildOccupatoClickHandler(fp); }
    } as any);

    const minCheckoutDate = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })();

    this.fpCheckout = flatpickr(this.checkoutInput.nativeElement, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      minDate: minCheckoutDate,
      disable: disabled,
      disableMobile: false,
      onChange: (_: any, dateStr: any) => {
        this.ngZone.run(() => {
          this.bookingForm.patchValue({ dataCheckout: dateStr || '' });
          this.erroreOccupata = '';
        });
      },
      onReady: (_: any, __: any, fp: any) => { this.buildOccupatoClickHandler(fp); }
    } as any);
  }

  private destroyFlatpickr(): void {
    try { this.fpCheckin?.destroy(); }  catch {}
    try { this.fpCheckout?.destroy(); } catch {}
    this.fpCheckin  = null;
    this.fpCheckout = null;
  }

  private aggiornaFlatpickrDisabled(): void {
    if (!this.fpCheckin || !this.fpCheckout) return;
    const ranges = this.getDisabledRanges();
    this.fpCheckin.set('disable',  ranges);
    this.fpCheckout.set('disable', ranges);
  }

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
