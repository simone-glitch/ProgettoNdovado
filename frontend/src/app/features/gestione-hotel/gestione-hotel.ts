import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { CameraService } from '../../services/camera.service';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-gestione-hotel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './gestione-hotel.html',
  styleUrl: './gestione-hotel.css',
})
export class GestioneHotel implements OnInit {
  hotels: any[] = [];
  serviziDisponibili: any[] = [];
  loading = false;

  // Hotel form
  showHotelForm = false;
  editingHotel: any = null;
  hotelForm!: FormGroup;
  selectedServizi: number[] = [];

  // Camera management
  hotelAperto: any = null;
  camere: any[] = [];
  showCameraForm = false;
  editingCamera: any = null;
  cameraForm!: FormGroup;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  showConfirm = false;
  confirmMessage = '';
  actionPending: (() => void) | null = null;

  readonly tipiCamera = ['SINGOLA', 'DOPPIA', 'TRIPLA', 'SUITE', 'FAMILIARE', 'DELUXE'];

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
    private cameraService: CameraService,
    private authService: AuthService
  ) {}

  get isAdmin() { return this.authService.isAdmin(); }

  ngOnInit() {
    this.initForms();
    this.caricaHotel();
    this.hotelService.getServizi().subscribe(s => this.serviziDisponibili = s);
  }

  initForms() {
    this.hotelForm = this.fb.group({
      nome:        ['', Validators.required],
      descrizione: ['', Validators.required],
      citta:       ['', Validators.required],
      indirizzo:   ['', Validators.required],
      stelle:      [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      latitudine:  [null],
      longitudine: [null]
    });
    this.cameraForm = this.fb.group({
      tipo:        ['DOPPIA', Validators.required],
      descrizione: [''],
      prezzoNotte: [null, [Validators.required, Validators.min(0)]],
      capienza:    [2,    [Validators.required, Validators.min(1)]],
      disponibile: [true]
    });
  }

  caricaHotel() {
    this.loading = true;
    const req$ = this.isAdmin ? this.hotelService.getTutti() : this.hotelService.getMiei();
    req$.subscribe({
      next: (data) => { this.hotels = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  // ── HOTEL CRUD ──

  apriNuovoHotel() {
    this.editingHotel = null;
    this.selectedServizi = [];
    this.hotelForm.reset({ stelle: 3 });
    this.showHotelForm = true;
  }

  apriModificaHotel(h: any) {
    this.editingHotel = h;
    this.selectedServizi = [];
    this.hotelForm.patchValue({
      nome: h.nome, descrizione: h.descrizione, citta: h.citta,
      indirizzo: h.indirizzo, stelle: h.stelle,
      latitudine: h.latitudine, longitudine: h.longitudine
    });
    this.showHotelForm = true;
  }

  salvaHotel() {
    if (this.hotelForm.invalid) { this.hotelForm.markAllAsTouched(); return; }
    const dati = this.hotelForm.value;

    if (this.editingHotel) {
      this.hotelService.aggiorna(this.editingHotel.id, dati).subscribe({
        next: () => {
          if (this.selectedServizi.length > 0) {
            this.hotelService.aggiornaServizi(this.editingHotel.id, this.selectedServizi).subscribe();
          }
          this.showHotelForm = false;
          this.showAlertMessage('Hotel aggiornato!', 'success');
          this.caricaHotel();
        },
        error: (e) => this.showAlertMessage(e.error?.message ?? 'Errore.', 'error')
      });
    } else {
      this.hotelService.crea(dati).subscribe({
        next: (newHotel) => {
          if (this.selectedServizi.length > 0) {
            this.hotelService.aggiornaServizi(newHotel.id, this.selectedServizi).subscribe();
          }
          this.showHotelForm = false;
          this.showAlertMessage('Hotel creato con successo!', 'success');
          this.caricaHotel();
        },
        error: (e) => this.showAlertMessage(e.error?.message ?? 'Errore.', 'error')
      });
    }
  }

  chiediEliminaHotel(h: any) {
    this.confirmMessage = `Eliminare l'hotel "${h.nome}"? L'azione è irreversibile.`;
    this.actionPending = () => {
      this.hotelService.elimina(h.id).subscribe({
        next: () => { this.showAlertMessage('Hotel eliminato.', 'success'); this.caricaHotel(); },
        error: () => this.showAlertMessage('Errore eliminazione.', 'error')
      });
    };
    this.showConfirm = true;
  }

  toggleServizio(id: number) {
    const i = this.selectedServizi.indexOf(id);
    if (i >= 0) this.selectedServizi.splice(i, 1);
    else this.selectedServizi.push(id);
  }

  isServizioSelezionato(id: number): boolean { return this.selectedServizi.includes(id); }

  // ── CAMERA CRUD ──

  gestisciCamere(h: any) {
    if (this.hotelAperto?.id === h.id) { this.hotelAperto = null; this.camere = []; return; }
    this.hotelAperto = h;
    this.showCameraForm = false;
    this.cameraService.getPerHotel(h.id).subscribe(c => this.camere = c);
  }

  apriNuovaCamera() {
    this.editingCamera = null;
    this.cameraForm.reset({ tipo: 'DOPPIA', capienza: 2, disponibile: true });
    this.showCameraForm = true;
  }

  apriModificaCamera(c: any) {
    this.editingCamera = c;
    this.cameraForm.patchValue({
      tipo: c.tipo, descrizione: c.descrizione, prezzoNotte: c.prezzoNotte,
      capienza: c.capienza, disponibile: c.disponibile
    });
    this.showCameraForm = true;
  }

  salvaCamera() {
    if (this.cameraForm.invalid) { this.cameraForm.markAllAsTouched(); return; }
    const dati = { ...this.cameraForm.value, idHotel: this.hotelAperto.id };

    if (this.editingCamera) {
      this.cameraService.aggiorna(this.editingCamera.id, dati).subscribe({
        next: () => {
          this.showCameraForm = false;
          this.showAlertMessage('Camera aggiornata!', 'success');
          this.cameraService.getPerHotel(this.hotelAperto.id).subscribe(c => this.camere = c);
        },
        error: (e) => this.showAlertMessage(e.error?.message ?? 'Errore.', 'error')
      });
    } else {
      this.cameraService.crea(dati).subscribe({
        next: () => {
          this.showCameraForm = false;
          this.showAlertMessage('Camera aggiunta!', 'success');
          this.cameraService.getPerHotel(this.hotelAperto.id).subscribe(c => this.camere = c);
        },
        error: (e) => this.showAlertMessage(e.error?.message ?? 'Errore.', 'error')
      });
    }
  }

  chiediEliminaCamera(c: any) {
    this.confirmMessage = `Eliminare la camera "${c.tipo}"?`;
    this.actionPending = () => {
      this.cameraService.elimina(c.id).subscribe({
        next: () => {
          this.showAlertMessage('Camera eliminata.', 'success');
          this.cameraService.getPerHotel(this.hotelAperto.id).subscribe(data => this.camere = data);
        },
        error: () => this.showAlertMessage('Errore.', 'error')
      });
    };
    this.showConfirm = true;
  }

  gestisciRisposta(risposta: boolean) {
    this.showConfirm = false;
    if (risposta && this.actionPending) this.actionPending();
    this.actionPending = null;
  }

  stelle(n: number): string { return '★'.repeat(n) + '☆'.repeat(5 - n); }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
