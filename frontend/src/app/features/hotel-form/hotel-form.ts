import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-hotel-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SharedModule],
  templateUrl: './hotel-form.html',
  styleUrl: './hotel-form.css',
})
export class HotelForm implements OnInit {
  idHotel: number | null = null;
  get editing(): boolean { return this.idHotel != null; }

  hotelForm!: FormGroup;
  serviziDisponibili: any[] = [];
  selectedServizi: number[] = [];
  saving = false;
  loading = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private hotelService: HotelService,
    private authService: AuthService,
    public i18n: TranslationService,
  ) {}

  // La lista a cui tornare dipende dal ruolo (host → I Miei Hotel, admin → Gestione Hotel).
  get listaRoute(): string {
    return this.authService.isAdmin() ? '/dashboard/gestione-hotel' : '/dashboard/miei-hotel';
  }

  ngOnInit() {
    if (!this.authService.isHost() && !this.authService.isAdmin()) {
      this.router.navigate(['/dashboard/home']);
      return;
    }
    this.initForm();
    this.hotelService.getServizi().subscribe({ next: s => this.serviziDisponibili = s, error: () => {} });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.idHotel = Number(idParam);
      this.caricaHotel();
    }
  }

  private initForm() {
    this.hotelForm = this.fb.group({
      nome:        ['', Validators.required],
      descrizione: ['', Validators.required],
      citta:       ['', Validators.required],
      indirizzo:   ['', Validators.required],
      stelle:      [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      latitudine:  [null],
      longitudine: [null],
    });
  }

  private caricaHotel() {
    this.loading = true;
    this.hotelService.getDettaglio(this.idHotel!).subscribe({
      next: (h) => {
        this.hotelForm.patchValue({
          nome: h.nome, descrizione: h.descrizione, citta: h.citta,
          indirizzo: h.indirizzo, stelle: h.stelle,
          latitudine: h.latitudine ?? null, longitudine: h.longitudine ?? null,
        });
        this.selectedServizi = (h.servizi ?? []).map((s: any) => s?.id).filter((v: any) => v != null);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showAlertMessage(this.i18n.translate('gestionehotel.hotel-non-trovato'), 'error');
      },
    });
  }

  toggleServizio(id: number) {
    const i = this.selectedServizi.indexOf(id);
    if (i >= 0) this.selectedServizi.splice(i, 1);
    else this.selectedServizi.push(id);
  }
  isServizioSelezionato(id: number): boolean { return this.selectedServizi.includes(id); }

  getServizioIcon(nome: string): string {
    const n = (nome ?? '').toLowerCase();
    if (n.includes('wifi') || n.includes('wi-fi'))           return 'fa-wifi';
    if (n.includes('piscina') || n.includes('pool'))         return 'fa-swimming-pool';
    if (n.includes('parcheggio') || n.includes('parking'))   return 'fa-parking';
    if (n.includes('ristorante') || n.includes('colazione')) return 'fa-utensils';
    if (n.includes('palestra') || n.includes('fitness'))     return 'fa-dumbbell';
    if (n.includes('spa') || n.includes('benessere'))        return 'fa-spa';
    if (n.includes('aria') || n.includes('climatizzazione')) return 'fa-snowflake';
    return 'fa-check-circle';
  }

  salva() {
    if (this.hotelForm.invalid) { this.hotelForm.markAllAsTouched(); return; }
    this.saving = true;
    const dati = this.hotelForm.value;

    const afterSave = (id: number, msg: string) => {
      if (this.selectedServizi.length > 0 || this.editing) {
        this.hotelService.aggiornaServizi(id, this.selectedServizi).subscribe({ error: () => {} });
      }
      this.showAlertMessage(this.i18n.translate(msg), 'success');
      setTimeout(() => this.router.navigate([this.listaRoute]), 700);
    };
    const onErr = (e: any) => {
      this.saving = false;
      this.showAlertMessage(e.error?.message ?? this.i18n.translate('gestionehotel.msg.errore'), 'error');
    };

    if (this.editing) {
      this.hotelService.aggiorna(this.idHotel!, dati).subscribe({
        next: () => afterSave(this.idHotel!, 'gestionehotel.msg.hotel-aggiornato'), error: onErr,
      });
    } else {
      this.hotelService.crea(dati).subscribe({
        next: (h) => afterSave(h.id, 'gestionehotel.msg.hotel-creato'), error: onErr,
      });
    }
  }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
