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
  // Camere già create (persistite) per questa struttura: caricate dal backend.
  camereCreate: any[] = [];
  // Foto (data URL base64) della camera che si sta compilando nel builder.
  fotoCameraNuova: string[] = [];
  savingCamera = false;
  private static readonly MAX_FOTO_BYTES = 2 * 1024 * 1024;

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
    2: ['checkIn', 'checkOut', 'telefono', 'email'],
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
          telefono:    h.telefono ?? '',
          email:       h.email ?? '',
        });
        this.selectedServizi = (h.servizi ?? []).map((s: any) => s?.id).filter((v: any) => v != null);
        this.lat = h.latitudine ?? null;
        this.lon = h.longitudine ?? null;
        // Ripristina le foto già salvate della struttura, così riprendendo la
        // bozza restano visibili e un nuovo salvataggio non le cancella.
        this.fotoPreview = [null, null, null, null, null];
        (h.fotoUrls ?? []).slice(0, 5).forEach((u: string, i: number) => { this.fotoPreview[i] = u; });
        this.caricaCamere();
        const s = localStorage.getItem(this.stepKey(id));
        if (s) this.currentStep = Math.min(Math.max(Number(s) || 1, 1), this.totalSteps);
      },
      error: () => this.showAlertMessage(this.i18n.translate('addhotel.msg.errore-salvataggio'), 'error'),
    });
  }

  // Foto della struttura attualmente presenti (slot compilati), come data URL/URL.
  private fotoHotelAttuali(): string[] {
    return this.fotoPreview.filter((f): f is string => !!f);
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
      { label: 'addhotel.checklist.foto',      done: this.fotoPreview.filter(Boolean).length >= 5 },
      { label: 'addhotel.checklist.camera',    done: this.camereCreate.length > 0 },
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
      // Lo slot libero si determina dalle anteprime (fotoPreview), che riflettono
      // sia le foto appena aggiunte sia quelle ricaricate da una bozza esistente:
      // così aggiungere una foto non sovrascrive quelle già presenti.
      const slot = this.fotoPreview.findIndex(f => f === null);
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
    // Lo step 2 non si supera senza almeno una camera definita.
    if (this.currentStep === 2 && this.camereCreate.length === 0) {
      this.showAlertMessage(this.i18n.translate('addhotel.msg.almeno-una-camera'), 'warning');
      return;
    }
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
      // Persisti la galleria della struttura (le foto dello step 4).
      this.hotelService.sostituisciFoto(id, this.fotoHotelAttuali()).subscribe({ error: () => {} });
      this.salvaStep();
      // Aggiorna l'URL con l'id (senza ricaricare il componente) così la bozza si può
      // riprendere ricaricando la pagina, ma l'alert di conferma resta visibile.
      this.location.replaceState('/dashboard/aggiungi-hotel/' + id);
      this.showAlertMessage(this.i18n.translate('addhotel.msg.bozza-salvata'), 'success');
    };
    const onErr = (e: any) => { this.saving = false; this.gestisciErroreHotel(e); };

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
    // Una struttura non è pubblicabile senza camere prenotabili.
    if (this.camereCreate.length === 0) {
      this.currentStep = 2;
      this.showAlertMessage(this.i18n.translate('addhotel.msg.almeno-una-camera'), 'warning');
      return;
    }

    this.saving = true;
    const realServizi = this.selectedServizi.filter(id => id > 0);

    const onOk = (id: number) => {
      if (realServizi.length) this.hotelService.aggiornaServizi(id, realServizi).subscribe({ error: () => {} });
      const finalize = () => {
        localStorage.removeItem(this.stepKey(id));
        this.saving = false;
        this.showAlertMessage(this.i18n.translate('addhotel.msg.pubblicata'), 'success');
        setTimeout(() => this.router.navigate(['/dashboard/miei-hotel']), 1200);
      };
      // Persisti la galleria della struttura prima di uscire dalla pagina.
      this.hotelService.sostituisciFoto(id, this.fotoHotelAttuali()).subscribe({ next: finalize, error: finalize });
    };
    const onErr = (e: any) => {
      this.saving = false;
      this.gestisciErroreHotel(e);
    };

    // Geolocalizza dall'indirizzo, salva come bozza e poi invia in revisione:
    // la pubblicazione avviene solo dopo l'approvazione di un admin.
    this.geolocalizza(() => {
      const payload = this.buildPayload('BOZZA');
      const salva$ = this.savedHotelId
        ? this.hotelService.aggiorna(this.savedHotelId, payload)
        : this.hotelService.crea(payload);
      salva$.subscribe({
        next: (h: any) => {
          const id = this.savedHotelId ?? h.id;
          this.savedHotelId = id;
          this.hotelService.inviaInRevisione(id).subscribe({ next: () => onOk(id), error: onErr });
        },
        error: onErr,
      });
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
      // Le camere sono ora entità esplicite (create via CameraService), non più
      // derivate da numero+prezzo medio: questi campi restano null.
      numCamere:   null,
      prezzoMedio: null,
      telefono:    v.telefono    || null,
      email:       v.email       || null,
    };
  }

  openSupporto() { this.showAlertMessage(this.i18n.translate('addhotel.msg.assistenza'), 'info'); }

  // ── Camere (builder inline nello step 2) ──────────────────────────────

  formatTipoCamera(t: string): string { return t ? t.charAt(0) + t.slice(1).toLowerCase() : ''; }

  private caricaCamere() {
    if (!this.savedHotelId) { this.camereCreate = []; return; }
    this.cameraService.getPerHotel(this.savedHotelId).subscribe({
      next: c => this.camereCreate = c ?? [],
      error: () => {},
    });
  }

  onFotoCameraSelezionate(event: Event) {
    // Una camera ha una sola foto: prendiamo solo il primo file e sostituiamo
    // l'eventuale immagine precedente.
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > AggiungiHotel.MAX_FOTO_BYTES) {
      this.showAlertMessage(this.i18n.translate('gestionehotel.foto-troppo-grande'), 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.fotoCameraNuova = [reader.result as string];
    reader.readAsDataURL(file);
  }

  rimuoviFotoCameraNuova(i: number) { this.fotoCameraNuova.splice(i, 1); }

  // Le camere si persistono subito: serve l'id della struttura, quindi se non
  // esiste ancora una bozza la si crea al volo prima di salvare la camera.
  aggiungiCamera() {
    if (this.cameraForm.invalid) {
      // Non basta il bordo rosso: spieghiamo a parole cosa manca, così è chiaro
      // perché la camera non viene aggiunta (prima il tasto era solo disabilitato).
      this.cameraForm.markAllAsTouched();
      this.showAlertMessage(this.i18n.translate('addhotel.camera.compila-campi'), 'warning');
      return;
    }
    this.savingCamera = true;
    this.ensureBozza(
      id => {
        const dati = { ...this.cameraForm.value, idHotel: id, foto: this.fotoCameraNuova };
        this.cameraService.crea(dati).subscribe({
          next: () => {
            this.savingCamera = false;
            this.cameraForm.reset({ tipo: 'DOPPIA', capienza: 2, disponibile: true, descrizione: '', prezzoNotte: null });
            this.fotoCameraNuova = [];
            this.caricaCamere();
            this.showAlertMessage(this.i18n.translate('gestionehotel.msg.camera-aggiunta'), 'success');
          },
          error: (e) => { this.savingCamera = false; this.showAlertMessage(this.estraiErrore(e, 'gestionehotel.msg.errore'), 'error'); },
        });
      },
      () => { this.savingCamera = false; },
    );
  }

  rimuoviCameraSalvata(c: any) {
    this.cameraService.elimina(c.id).subscribe({
      next: () => this.caricaCamere(),
      error: () => this.showAlertMessage(this.i18n.translate('gestionehotel.msg.errore'), 'error'),
    });
  }

  // Garantisce l'esistenza di una bozza (con id) e poi esegue `next(id)`.
  private ensureBozza(next: (id: number) => void, onErr?: () => void) {
    if (this.savedHotelId) { next(this.savedHotelId); return; }
    const nome = this.hotelForm.get('nome')?.value?.trim();
    if (!nome) { this.showAlertMessage(this.i18n.translate('addhotel.msg.nome-obbligatorio'), 'warning'); onErr?.(); return; }
    this.geolocalizza(() => {
      this.hotelService.crea(this.buildPayload('BOZZA')).subscribe({
        next: (h: any) => {
          this.savedHotelId = h.id;
          this.location.replaceState('/dashboard/aggiungi-hotel/' + h.id);
          this.salvaStep();
          next(h.id);
        },
        error: (e) => { this.gestisciErroreHotel(e); onErr?.(); },
      });
    });
  }

  // Estrae il messaggio d'errore dal backend, che restituisce un body stringa:
  // con responseType json finisce in e.error.text, non in e.error.message.
  private estraiErrore(e: any, fallbackKey: string): string {
    if (typeof e?.error === 'string' && e.error) return e.error;
    if (e?.error?.message) return e.error.message;
    if (e?.error?.text)    return e.error.text;
    return this.i18n.translate(fallbackKey);
  }

  // Errore nel salvataggio dell'hotel (anche quando innescato dall'aggiunta di
  // una camera, che dietro le quinte crea prima la bozza). Se il motivo è un
  // contatto duplicato (telefono/email univoci tra strutture), evidenziamo il
  // campo colpevole e riportiamo l'utente allo step dei contatti, così è chiaro
  // cosa correggere invece di vedere un errore "sganciato" mentre aggiunge una camera.
  private gestisciErroreHotel(e: any): void {
    const msg = this.estraiErrore(e, 'addhotel.msg.errore-salvataggio');
    const lower = (msg ?? '').toLowerCase();
    const telefonoDup = lower.includes('telefono') || lower.includes('phone');
    const emailDup    = lower.includes('email') || lower.includes('mail');
    if (telefonoDup) {
      this.hotelForm.get('telefono')?.setErrors({ duplicato: true });
      this.hotelForm.get('telefono')?.markAsTouched();
    }
    if (emailDup) {
      this.hotelForm.get('email')?.setErrors({ duplicato: true });
      this.hotelForm.get('email')?.markAsTouched();
    }
    if (telefonoDup || emailDup) this.currentStep = 2;
    this.showAlertMessage(msg, 'error');
  }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }

  trackByStep(i: number, s: any) { return s.number; }
}
