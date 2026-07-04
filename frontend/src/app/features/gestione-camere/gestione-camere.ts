import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { CameraService } from '../../services/camera.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { PreferencesService } from '../../services/preferences.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-gestione-camere',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SharedModule],
  templateUrl: './gestione-camere.html',
  styleUrl: './gestione-camere.css',
})
export class GestioneCamere implements OnInit {
  idHotel!: number;
  hotel: any = null;
  camere: any[] = [];
  loading = false;

  // ── Camera form ──
  showCameraForm = false;
  editingCamera: any = null;
  cameraForm!: FormGroup;
  fotoCamera: string[] = [];   // data URL base64, gestite fuori dal reactive form
  savingCamera = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  showConfirm = false;
  confirmMessage = '';
  private actionPending: (() => void) | null = null;

  readonly tipiCamera = ['SINGOLA', 'DOPPIA', 'TRIPLA', 'SUITE', 'FAMILIARE', 'DELUXE'];
  private static readonly MAX_FOTO_BYTES = 2 * 1024 * 1024;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private hotelService: HotelService,
    private cameraService: CameraService,
    private authService: AuthService,
    public i18n: TranslationService,
    private prefs: PreferencesService,
  ) {}

  ngOnInit() {
    if (!this.authService.isHost() && !this.authService.isAdmin()) {
      this.router.navigate(['/dashboard/home']);
      return;
    }
    this.idHotel = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.caricaHotel();
    this.caricaCamere();
  }

  private initForm() {
    this.cameraForm = this.fb.group({
      tipo:        ['DOPPIA', Validators.required],
      descrizione: [''],
      prezzoNotte: [null, [Validators.required, Validators.min(0)]],
      capienza:    [2, [Validators.required, Validators.min(1)]],
      disponibile: [true],
    });
  }

  private caricaHotel() {
    this.hotelService.getDettaglio(this.idHotel).subscribe({
      next: (h) => this.hotel = h,
      error: () => this.hotel = null,
    });
  }

  private caricaCamere() {
    this.loading = true;
    this.cameraService.getPerHotel(this.idHotel).subscribe({
      next: (c) => { this.camere = c ?? []; this.loading = false; },
      error: () => { this.camere = []; this.loading = false; },
    });
  }

  // ── Form open / close ──

  apriNuovaCamera() {
    this.editingCamera = null;
    this.fotoCamera = [];
    this.cameraForm.reset({ tipo: 'DOPPIA', capienza: 2, disponibile: true, descrizione: '', prezzoNotte: null });
    this.showCameraForm = true;
  }

  apriModificaCamera(c: any) {
    this.editingCamera = c;
    this.fotoCamera = Array.isArray(c.foto) ? [...c.foto] : [];
    this.cameraForm.patchValue({
      tipo: c.tipo, descrizione: c.descrizione, prezzoNotte: c.prezzoNotte,
      capienza: c.capienza, disponibile: c.disponibile,
    });
    this.showCameraForm = true;
  }

  chiudiForm() {
    this.showCameraForm = false;
    this.editingCamera = null;
    this.savingCamera = false;
    this.fotoCamera = [];
  }

  // ── Foto (upload da file → data URL base64) ──

  onFotoSelezionate(event: Event) {
    // Una camera ha una sola foto: prendiamo solo il primo file e sostituiamo
    // l'eventuale immagine precedente.
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';   // consente di ricaricare lo stesso file
    if (!file) return;
    if (file.size > GestioneCamere.MAX_FOTO_BYTES) {
      this.showAlertMessage(this.i18n.translate('gestionehotel.foto-troppo-grande'), 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.fotoCamera = [reader.result as string];
    reader.readAsDataURL(file);
  }

  rimuoviFoto(i: number) { this.fotoCamera.splice(i, 1); }

  // ── Save / delete ──

  salvaCamera() {
    if (this.cameraForm.invalid) { this.cameraForm.markAllAsTouched(); return; }
    this.savingCamera = true;
    const dati = { ...this.cameraForm.value, idHotel: this.idHotel, foto: this.fotoCamera };

    const onOk = (msg: string) => {
      this.savingCamera = false;
      this.chiudiForm();
      this.showAlertMessage(this.i18n.translate(msg), 'success');
      this.caricaCamere();
    };
    const onErr = (e: any) => {
      this.savingCamera = false;
      this.showAlertMessage(this.estraiErrore(e), 'error');
    };

    if (this.editingCamera) {
      this.cameraService.aggiorna(this.editingCamera.id, dati).subscribe({
        next: () => onOk('gestionehotel.msg.camera-aggiornata'), error: onErr,
      });
    } else {
      this.cameraService.crea(dati).subscribe({
        next: () => onOk('gestionehotel.msg.camera-aggiunta'), error: onErr,
      });
    }
  }

  chiediEliminaCamera(c: any) {
    this.confirmMessage =
      `${this.i18n.translate('gestionehotel.msg.conferma-elimina-camera-pre')}${this.formatTipo(c.tipo)}${this.i18n.translate('gestionehotel.msg.conferma-elimina-camera-post')}`;
    this.actionPending = () => {
      this.cameraService.elimina(c.id).subscribe({
        next: () => { this.showAlertMessage(this.i18n.translate('gestionehotel.msg.camera-eliminata'), 'success'); this.caricaCamere(); },
        error: () => this.showAlertMessage(this.i18n.translate('gestionehotel.msg.errore'), 'error'),
      });
    };
    this.showConfirm = true;
  }

  gestisciRisposta(risposta: boolean) {
    this.showConfirm = false;
    if (risposta && this.actionPending) this.actionPending();
    this.actionPending = null;
  }

  // ── Helpers ──

  formatTipo(tipo: string): string {
    if (!tipo) return '';
    return tipo.charAt(0) + tipo.slice(1).toLowerCase();
  }

  fmtPrezzo(v: number | null | undefined): string {
    return this.prefs.formatCurrency(v ?? 0);
  }

  fotoCopertina(c: any): string | null {
    return Array.isArray(c.foto) && c.foto.length > 0 ? c.foto[0] : null;
  }

  /** Estrae un messaggio leggibile dalla risposta d'errore HTTP.
   *  Il backend può rispondere con JSON ({message}) o con testo semplice:
   *  in quest'ultimo caso Angular non riesce a parsarlo e lascia il testo
   *  grezzo in e.error, quindi lo recuperiamo esplicitamente. */
  private estraiErrore(e: any): string {
    const err = e?.error;
    if (typeof err === 'string' && err.trim()) return err;
    if (err?.message) return err.message;
    if (typeof e?.message === 'string' && e.message.trim()) return e.message;
    return this.i18n.translate('gestionehotel.msg.errore');
  }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
