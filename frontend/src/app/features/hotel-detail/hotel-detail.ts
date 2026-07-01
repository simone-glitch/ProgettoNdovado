import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { PrenotazioneService } from '../../services/prenotazione.service';
import { RecensioneService } from '../../services/recensione.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
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

  private mapInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private hotelService: HotelService,
    private prenotazioneService: PrenotazioneService,
    private recensioneService: RecensioneService,
    private authService: AuthService,
    private i18n: TranslationService
  ) {}

  ngOnInit() {
    this.bookingForm = this.fb.group({
      dataCheckin:  ['', Validators.required],
      dataCheckout: ['', Validators.required],
      numOspiti:    [1, [Validators.required, Validators.min(1)]]
    });
    this.reviewForm = this.fb.group({
      titolo: [''],
      testo:  ['', Validators.required],
      voto:   [5, [Validators.required, Validators.min(1), Validators.max(5)]]
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.caricaHotel(id);
    this.caricaRecensioni(id);
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
    return !!this.selectedCamera && this.numNotti > 0 && this.bookingForm.valid;
  }

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
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
    const checkin  = new Date(v.dataCheckin);
    const checkout = new Date(v.dataCheckout);
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    if (checkin < today) {
      this.showAlertMessage(this.i18n.translate('hoteldetail.msg.checkin-passato'), 'error'); return;
    }
    if (checkout <= checkin) {
      this.showAlertMessage(this.i18n.translate('hoteldetail.msg.checkout-prima'), 'error'); return;
    }
    this.prenotazioneService.crea({
      idCamera:     this.selectedCamera.id,
      dataCheckin:  v.dataCheckin,
      dataCheckout: v.dataCheckout,
      numOspiti:    parseInt(v.numOspiti, 10)
    }).subscribe({
      next: () => {
        this.showAlertMessage(this.i18n.translate('hoteldetail.msg.prenotazione-ok'), 'success');
        this.selectedCamera = null;
        this.bookingForm.reset({ numOspiti: 1 });
      },
      error: (e) => {
        const msg = (typeof e.error === 'string' && e.error)
          ? e.error
          : (e.error?.message ?? this.i18n.translate('hoteldetail.msg.prenotazione-err'));
        this.showAlertMessage(msg, 'error');
      }
    });
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
}
