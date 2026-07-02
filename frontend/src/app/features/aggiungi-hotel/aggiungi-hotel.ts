import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { GeocodingService } from '../../services/geocoding.service';
import { CameraService } from '../../services/camera.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
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

  // Coordinate geografiche ricavate dall'indirizzo (per la mappa)
  private lat: number | null = null;
  private lon: number | null = null;

  isDragging = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  readonly steps = [
    { number: 1, label: 'addhotel.step.info-base' },
    { number: 2, label: 'addhotel.step.camere-prezzi' },
    { number: 3, label: 'addhotel.step.servizi' },
    { number: 4, label: 'addhotel.step.foto' },
    { number: 5, label: 'addhotel.step.pubblicazione' },
  ];

  // Campi obbligatori di ogni step: la validazione avviene solo su quelli dello step corrente.
  private readonly stepFields: Record<number, string[]> = {
    1: ['nome', 'stelle', 'tipologia', 'citta', 'indirizzo', 'descrizione'],
    2: ['checkIn', 'checkOut', 'numCamere', 'prezzoMedio', 'telefono', 'email'],
  };

  readonly tipologie = [
    'Hotel', 'Resort', 'B&B', 'Appartamento', 'Villa', 'Agriturismo', 'Residence', 'Ostello'
  ];

  private readonly tipologieKeys: Record<string, string> = {
    'Hotel':        'addhotel.tipologia.hotel',
    'Resort':       'addhotel.tipologia.resort',
    'B&B':          'addhotel.tipologia.bb',
    'Appartamento': 'addhotel.tipologia.appartamento',
    'Villa':        'addhotel.tipologia.villa',
    'Agriturismo':  'addhotel.tipologia.agriturismo',
    'Residence':    'addhotel.tipologia.residence',
    'Ostello':      'addhotel.tipologia.ostello',
  };

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

  private readonly serviziDefaultKeys: Record<string, string> = {
    'Wi-Fi gratuito':       'addhotel.servizio.wifi',
    'Colazione inclusa':    'addhotel.servizio.colazione',
    'Piscina':              'addhotel.servizio.piscina',
    'Spa':                  'addhotel.servizio.spa',
    'Parcheggio':           'addhotel.servizio.parcheggio',
    'Navetta aeroportuale': 'addhotel.servizio.navetta',
    'Animali ammessi':      'addhotel.servizio.animali',
    'Vista mare':           'addhotel.servizio.vista-mare',
  };

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
    private geocoding: GeocodingService,
    private cameraService: CameraService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    public i18n: TranslationService
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

    // Se c'è un id nella rotta, stiamo riprendendo una bozza salvata.
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.savedHotelId = Number(idParam);
      this.caricaBozza(this.savedHotelId);
    }
  }

  // Carica i dati di una bozza esistente e ripristina lo step in cui era rimasta.
  private caricaBozza(id: number) {
    this.hotelService.getDettaglio(id).subscribe({
      next: h => {
        this.hotelForm.patchValue({
          nome:        h.nome ?? '',
          stelle:      h.stelle ?? null,
          tipologia:   h.tipologia ?? '',
          citta:       h.citta ?? '',
          indirizzo:   h.indirizzo ?? '',
          descrizione: h.descrizione ?? '',
          checkIn:     h.checkIn ?? '',
          checkOut:    h.checkOut ?? '',
          numCamere:   h.numCamere ?? null,
          prezzoMedio: h.prezzoMedio ?? null,
          telefono:    h.telefono ?? '',
          email:       h.email ?? '',
        });
        this.selectedServizi = (h.servizi ?? []).map((s: any) => s?.id).filter((v: any) => v != null);
        this.lat = h.latitudine ?? null;
        this.lon = h.longitudine ?? null;
        const s = localStorage.getItem(this.stepKey(id));
        if (s) this.currentStep = Math.min(Math.max(Number(s) || 1, 1), this.totalSteps);
      },
      error: () => this.showAlertMessage(this.i18n.translate('addhotel.msg.errore-salvataggio'), 'error'),
    });
  }

  private stepKey(id: number): string { return `ndv-bozza-step-${id}`; }
  private salvaStep() { if (this.savedHotelId) localStorage.setItem(this.stepKey(this.savedHotelId), String(this.currentStep)); }

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
      // Richiede un numero plausibile: 8–15 cifre, con eventuale prefisso "+" e spazi/trattini.
      telefono:    ['', [Validators.required, Validators.pattern(/^\+?(\d[\s-]?){8,15}$/)]],
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

  tipologiaLabel(t: string): string {
    const key = this.tipologieKeys[t];
    return key ? this.i18n.translate(key) : t;
  }

  servizioLabel(s: any): string {
    const key = this.serviziDefaultKeys[s?.nome];
    return key ? this.i18n.translate(key) : s?.nome;
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

  get previewNome(): string  { return this.hotelForm.get('nome')?.value?.trim() || this.i18n.translate('addhotel.nome-struttura-fallback'); }
  get previewCitta(): string { return this.hotelForm.get('citta')?.value?.trim() || this.i18n.translate('addhotel.localita-non-impostata'); }
  get previewStelle(): number { return Number(this.hotelForm.get('stelle')?.value) || 0; }
  get previewImg(): string | null { return this.fotoPreview.find(f => f !== null) ?? null; }

  get previewServizi(): { nome: string; icona: string }[] {
    return this.serviziToShow
      .filter(s => this.selectedServizi.includes(s.id))
      .slice(0, 5)
      .map(s => ({ nome: this.servizioLabel(s), icona: s.icona ?? this.getServizioIcon(s.nome) }));
  }

  stelleRange(n: number): number[] { return Array.from({ length: n }); }

  // ── Checklist ──

  get checklistItems(): { label: string; done: boolean }[] {
    return [
      { label: 'addhotel.checklist.indirizzo', done: !!(this.hotelForm.get('indirizzo')?.value?.trim()) },
      { label: 'addhotel.checklist.servizi',   done: this.selectedServizi.length > 0 },
      { label: 'addhotel.checklist.foto',      done: this.fotoFiles.filter(Boolean).length >= 5 },
      { label: 'addhotel.checklist.camera',    done: this.camereCreate.length > 0 || (this.hotelForm.get('numCamere')?.value > 0 && this.hotelForm.get('prezzoMedio')?.value > 0) },
    ];
  }

  // Nota informativa mostrata in fondo alla card, contestuale allo step corrente.
  get stepHelp(): string { return `addhotel.help.step${this.currentStep}`; }

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
        this.showAlertMessage(`"${file.name}" ${this.i18n.translate('addhotel.msg.limite-10mb')}`, 'warning');
        continue;
      }
      const slot = this.fotoFiles.findIndex(f => f === null);
      if (slot === -1) { this.showAlertMessage(this.i18n.translate('addhotel.msg.max-5-foto'), 'info'); break; }
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
    const campi = this.stepFields[this.currentStep];
    if (campi && !this.validaCampi(campi)) return;
    if (this.currentStep < this.totalSteps) { this.currentStep++; this.salvaStep(); }
  }

  indietro() {
    if (this.currentStep > 1) { this.currentStep--; this.salvaStep(); }
  }

  private validaCampi(campi: string[]): boolean {
    let valido = true;
    for (const nome of campi) {
      const ctrl = this.hotelForm.get(nome);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) valido = false;
    }
    return valido;
  }

  vaiStep(n: number) { if (n <= this.currentStep) this.currentStep = n; }

  // ── Save ──

  salvaBozza() {
    const nome = this.hotelForm.get('nome')?.value?.trim();
    if (!nome) { this.showAlertMessage(this.i18n.translate('addhotel.msg.nome-obbligatorio'), 'warning'); return; }
    this.saving = true;

    const onOk = (id: number) => {
      this.savedHotelId = id;
      this.saving = false;
      const realServizi = this.selectedServizi.filter(sid => sid > 0);
      if (realServizi.length) this.hotelService.aggiornaServizi(id, realServizi).subscribe({ error: () => {} });
      this.salvaStep();
      // Aggiorna l'URL con l'id (senza ricaricare il componente) così la bozza si può
      // riprendere ricaricando la pagina, ma l'alert di conferma resta visibile.
      this.location.replaceState('/dashboard/aggiungi-hotel/' + id);
      this.showAlertMessage(this.i18n.translate('addhotel.msg.bozza-salvata'), 'success');
    };
    const onErr = (e: any) => { this.saving = false; this.showAlertMessage(e.error?.message ?? this.i18n.translate('addhotel.msg.errore-salvataggio'), 'error'); };

    // Prima geolocalizza dall'indirizzo, poi salva: così l'hotel compare sulla mappa.
    this.geolocalizza(() => {
      const payload = this.buildPayload('BOZZA');
      if (this.savedHotelId) {
        this.hotelService.aggiorna(this.savedHotelId, payload).subscribe({ next: () => onOk(this.savedHotelId!), error: onErr });
      } else {
        this.hotelService.crea(payload).subscribe({ next: h => onOk(h.id), error: onErr });
      }
    });
  }

  // Registrazione completa in un colpo solo: valida tutto, poi crea (o aggiorna la bozza) e va a "I miei hotel".
  registra() {
    this.hotelForm.markAllAsTouched();
    if (this.hotelForm.invalid) {
      // Porta l'utente al primo step che contiene errori.
      for (const step of Object.keys(this.stepFields)) {
        if (this.stepFields[+step].some(c => this.hotelForm.get(c)?.invalid)) {
          this.currentStep = +step;
          break;
        }
      }
      this.showAlertMessage(this.i18n.translate('addhotel.msg.compila-obbligatori'), 'warning');
      return;
    }

    this.saving = true;
    const realServizi = this.selectedServizi.filter(id => id > 0);

    const onOk = (id: number) => {
      if (realServizi.length) this.hotelService.aggiornaServizi(id, realServizi).subscribe({ error: () => {} });
      localStorage.removeItem(this.stepKey(id));
      this.saving = false;
      this.showAlertMessage(this.i18n.translate('addhotel.msg.hotel-registrato'), 'success');
      setTimeout(() => this.router.navigate(['/dashboard/miei-hotel']), 800);
    };
    const onErr = (e: any) => {
      this.saving = false;
      this.showAlertMessage(e.error?.message ?? this.i18n.translate('addhotel.msg.errore-salvataggio'), 'error');
    };

    // Geolocalizza dall'indirizzo prima di pubblicare, così l'hotel è posizionato sulla mappa.
    this.geolocalizza(() => {
      const payload = this.buildPayload('PUBBLICATO');
      if (this.savedHotelId) {
        this.hotelService.aggiorna(this.savedHotelId, payload).subscribe({ next: () => onOk(this.savedHotelId!), error: onErr });
      } else {
        this.hotelService.crea(payload).subscribe({ next: h => onOk(h.id), error: onErr });
      }
    });
  }

  // Ricava le coordinate dall'indirizzo/città correnti (best-effort) e poi esegue `poi`.
  // Se la geocodifica non trova nulla, mantiene le coordinate esistenti e prosegue comunque.
  private geolocalizza(poi: () => void) {
    const indirizzo = this.hotelForm.get('indirizzo')?.value?.trim() ?? '';
    const citta     = this.hotelForm.get('citta')?.value?.trim() ?? '';
    if (!indirizzo && !citta) { poi(); return; }
    this.geocoding.coordinate(indirizzo, citta).subscribe(coords => {
      if (coords) { this.lat = coords.lat; this.lon = coords.lon; }
      poi();
    });
  }

  private buildPayload(stato: 'BOZZA' | 'PUBBLICATO'): any {
    const v = this.hotelForm.value;
    return {
      stato,
      nome:        v.nome        || '',
      descrizione: v.descrizione || '',
      citta:       v.citta       || '',
      indirizzo:   v.indirizzo   || '',
      // Il backend fa setInt(stelle): un valore null provoca NullPointerException, quindi default a 3.
      stelle:      v.stelle ? Number(v.stelle) : 3,
      latitudine:  this.lat,
      longitudine: this.lon,
      tipologia:   v.tipologia   || null,
      checkIn:     v.checkIn     || null,
      checkOut:    v.checkOut    || null,
      numCamere:   v.numCamere   ? Number(v.numCamere)   : null,
      prezzoMedio: v.prezzoMedio ? Number(v.prezzoMedio) : null,
      telefono:    v.telefono    || null,
      email:       v.email       || null,
    };
  }

  openSupporto() { this.showAlertMessage(this.i18n.translate('addhotel.msg.assistenza'), 'info'); }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }

  trackByStep(i: number, s: any) { return s.number; }
}
