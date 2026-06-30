import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { CameraService } from '../../services/camera.service';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-aggiungi-hotel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SharedModule],
  templateUrl: './aggiungi-hotel.html',
  styleUrl: './aggiungi-hotel.css',
})
export class AggiungiHotel implements OnInit {
  currentStep = 1;
  readonly totalSteps = 5;

  hotelForm!: FormGroup;
  cameraForm!: FormGroup;
  serviziDisponibili: any[] = [];
  selectedServizi: number[] = [];

  fotoFiles: (File | null)[] = [null, null, null, null, null];
  fotoPreview: (string | null)[] = [null, null, null, null, null];

  saving = false;
  savedHotelId: number | null = null;
  camereCreate: any[] = [];

  isDragging = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  readonly steps = [
    { number: 1, label: 'Informazioni base' },
    { number: 2, label: 'Camere e prezzi' },
    { number: 3, label: 'Servizi' },
    { number: 4, label: 'Foto' },
    { number: 5, label: 'Pubblicazione' },
  ];

  readonly tipologie = [
    'Hotel', 'Resort', 'B&B', 'Appartamento', 'Villa', 'Agriturismo', 'Residence', 'Ostello'
  ];

  readonly tipiCamera = ['SINGOLA', 'DOPPIA', 'TRIPLA', 'SUITE', 'FAMILIARE', 'DELUXE'];

  readonly serviziDefault = [
    { id: -1, nome: 'Wi-Fi gratuito',      icona: 'fa-wifi' },
    { id: -2, nome: 'Colazione inclusa',   icona: 'fa-utensils' },
    { id: -3, nome: 'Piscina',             icona: 'fa-swimming-pool' },
    { id: -4, nome: 'Spa',                 icona: 'fa-spa' },
    { id: -5, nome: 'Parcheggio',          icona: 'fa-parking' },
    { id: -6, nome: 'Navetta aeroportuale',icona: 'fa-shuttle-van' },
    { id: -7, nome: 'Animali ammessi',     icona: 'fa-paw' },
    { id: -8, nome: 'Vista mare',          icona: 'fa-water' },
  ];

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
    private cameraService: CameraService,
    private authService: AuthService,
    private router: Router
  ) {}

  get currentUser() { return this.authService.getLoggedUser() ?? {}; }

  ngOnInit() {
    if (!this.authService.isHost() && !this.authService.isAdmin()) {
      this.router.navigate(['/dashboard/home']);
      return;
    }
    this.initForms();
    this.hotelService.getServizi().subscribe({
      next: s => { if (s?.length) this.serviziDisponibili = s; },
      error: () => {}
    });
  }

  private initForms() {
    this.hotelForm = this.fb.group({
      nome:        ['', Validators.required],
      stelle:      [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      tipologia:   ['', Validators.required],
      citta:       ['', Validators.required],
      indirizzo:   ['', Validators.required],
      descrizione: ['', [Validators.required, Validators.maxLength(500)]],
      checkIn:     ['', Validators.required],
      checkOut:    ['', Validators.required],
      numCamere:   [null, [Validators.required, Validators.min(1)]],
      prezzoMedio: [null, [Validators.required, Validators.min(0)]],
      telefono:    ['', Validators.required],
      email:       ['', [Validators.required, Validators.email]],
    });
    this.cameraForm = this.fb.group({
      tipo:        ['DOPPIA', Validators.required],
      descrizione: [''],
      prezzoNotte: [null, [Validators.required, Validators.min(0)]],
      capienza:    [2, [Validators.required, Validators.min(1)]],
      disponibile: [true],
    });
  }

  // ── Computed helpers ──

  get descrizioneLen(): number { return (this.hotelForm.get('descrizione')?.value ?? '').length; }

  get serviziToShow(): any[] {
    return this.serviziDisponibili.length ? this.serviziDisponibili : this.serviziDefault;
  }

  getServizioIcon(nome: string): string {
    const n = (nome ?? '').toLowerCase();
    if (n.includes('wifi') || n.includes('wi-fi'))         return 'fa-wifi';
    if (n.includes('piscina') || n.includes('pool'))        return 'fa-swimming-pool';
    if (n.includes('parcheggio') || n.includes('parking'))  return 'fa-parking';
    if (n.includes('colazione') || n.includes('ristorante'))return 'fa-utensils';
    if (n.includes('navetta') || n.includes('shuttle'))     return 'fa-shuttle-van';
    if (n.includes('spa') || n.includes('benessere'))       return 'fa-spa';
    if (n.includes('animali') || n.includes('pet'))         return 'fa-paw';
    if (n.includes('mare') || n.includes('vista'))          return 'fa-water';
    if (n.includes('palestra') || n.includes('fitness'))    return 'fa-dumbbell';
    return 'fa-check-circle';
  }

  isServizioSelezionato(id: number): boolean { return this.selectedServizi.includes(id); }

  toggleServizio(id: number) {
    const i = this.selectedServizi.indexOf(id);
    if (i >= 0) this.selectedServizi.splice(i, 1); else this.selectedServizi.push(id);
  }

  // ── Preview ──

  get previewNome(): string  { return this.hotelForm.get('nome')?.value?.trim() || 'Nome struttura'; }
  get previewCitta(): string { return this.hotelForm.get('citta')?.value?.trim() || 'Località non impostata'; }
  get previewStelle(): number { return Number(this.hotelForm.get('stelle')?.value) || 0; }
  get previewImg(): string | null { return this.fotoPreview.find(f => f !== null) ?? null; }

  get previewServizi(): string[] {
    return this.serviziToShow
      .filter(s => this.selectedServizi.includes(s.id))
      .slice(0, 5)
      .map(s => s.nome);
  }

  stelleRange(n: number): number[] { return Array.from({ length: n }); }

  // ── Checklist ──

  get checklistItems(): { label: string; done: boolean }[] {
    return [
      { label: "Completa l'indirizzo della struttura", done: !!(this.hotelForm.get('indirizzo')?.value?.trim()) },
      { label: 'Aggiungi almeno 5 foto',               done: this.fotoFiles.filter(Boolean).length >= 5 },
      { label: 'Definisci almeno 1 camera con prezzo', done: this.camereCreate.length > 0 || (this.hotelForm.get('numCamere')?.value > 0 && this.hotelForm.get('prezzoMedio')?.value > 0) },
      { label: 'Conferma le policy della struttura',   done: false },
    ];
  }

  // ── Foto ──

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragging = false; }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;
    const files = e.dataTransfer?.files;
    if (files) this.processFiles(Array.from(files));
  }

  onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) this.processFiles(Array.from(input.files));
    input.value = '';
  }

  processFiles(files: File[]) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        this.showAlertMessage(`"${file.name}" supera il limite di 10MB.`, 'warning');
        continue;
      }
      const slot = this.fotoFiles.findIndex(f => f === null);
      if (slot === -1) { this.showAlertMessage('Puoi caricare al massimo 5 foto.', 'info'); break; }
      this.fotoFiles[slot] = file;
      const reader = new FileReader();
      reader.onload = ev => { this.fotoPreview[slot] = ev.target?.result as string; };
      reader.readAsDataURL(file);
    }
  }

  rimuoviFoto(index: number) {
    for (let i = index; i < 4; i++) {
      this.fotoFiles[i]   = this.fotoFiles[i + 1];
      this.fotoPreview[i] = this.fotoPreview[i + 1];
    }
    this.fotoFiles[4]   = null;
    this.fotoPreview[4] = null;
  }

  // ── Navigation ──

  continua() {
    if (this.currentStep === 1) {
      this.hotelForm.markAllAsTouched();
      if (this.hotelForm.invalid) return;
    }
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  vaiStep(n: number) { if (n <= this.currentStep) this.currentStep = n; }

  // ── Save ──

  salvaBozza() {
    const nome = this.hotelForm.get('nome')?.value?.trim();
    if (!nome) { this.showAlertMessage("Inserisci almeno il nome della struttura per salvare la bozza.", 'warning'); return; }
    this.saving = true;
    this.hotelService.crea(this.buildPayload()).subscribe({
      next: h => {
        this.savedHotelId = h.id;
        this.saving = false;
        const realServizi = this.selectedServizi.filter(id => id > 0);
        if (realServizi.length) this.hotelService.aggiornaServizi(h.id, realServizi).subscribe({ error: () => {} });
        this.showAlertMessage('Bozza salvata con successo!', 'success');
      },
      error: e => { this.saving = false; this.showAlertMessage(e.error?.message ?? 'Errore durante il salvataggio.', 'error'); }
    });
  }

  private buildPayload(): any {
    const v = this.hotelForm.value;
    return {
      nome:        v.nome        || '',
      descrizione: v.descrizione || '',
      citta:       v.citta       || '',
      indirizzo:   v.indirizzo   || '',
      stelle:      v.stelle ? Number(v.stelle) : null,
      tipologia:   v.tipologia   || null,
      checkIn:     v.checkIn     || null,
      checkOut:    v.checkOut    || null,
      numCamere:   v.numCamere   ? Number(v.numCamere)   : null,
      prezzoMedio: v.prezzoMedio ? Number(v.prezzoMedio) : null,
      telefono:    v.telefono    || null,
      email:       v.email       || null,
    };
  }

  openSupporto() { this.showAlertMessage('Per assistenza usa il pulsante chat in basso a destra.', 'info'); }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }

  trackByStep(i: number, s: any) { return s.number; }
}
