import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessaggiService } from '../../services/messaggi.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-messaggi',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './messaggi.html',
  styleUrl: './messaggi.css',
})
export class Messaggi implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('threadBody') threadBody?: ElementRef<HTMLDivElement>;

  // Aggiornamento periodico: le chat sono in tempo reale-simulato via polling,
  // così i messaggi dell'altro utente compaiono senza dover ricaricare la pagina.
  private pollHandle: any = null;
  private readonly POLL_MS = 4000;

  conversazioni: any[] = [];
  selezionata: any = null;
  messaggi: any[] = [];
  nuovoTesto = '';

  loading = false;
  loadingMessaggi = false;
  sending = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Vista lista: attive vs archiviate.
  mostraArchiviate = false;
  // Conferma segnalazione messaggio all'assistenza.
  showConfirmSegnala = false;
  private messaggioDaSegnalare: any = null;

  private currentUserId: number | null = null;
  private scrollDaFare = false;
  private convDaAprire: number | null = null;

  constructor(
    private messaggiService: MessaggiService,
    private auth: AuthService,
    public i18n: TranslationService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.currentUserId = this.auth.getLoggedUser()?.id ?? null;
    const conv = this.route.snapshot.queryParamMap.get('conv');
    this.convDaAprire = conv ? Number(conv) : null;
    this.caricaConversazioni();
    this.pollHandle = setInterval(() => this.aggiornaInBackground(), this.POLL_MS);
  }

  ngOnDestroy() {
    if (this.pollHandle) { clearInterval(this.pollHandle); this.pollHandle = null; }
  }

  // Refresh silenzioso (nessuno spinner): aggiorna la conversazione aperta e la
  // lista, così arrivano i nuovi messaggi/anteprime dell'altro partecipante.
  private aggiornaInBackground() {
    if (this.sending) return;
    if (this.selezionata) this.refreshMessaggiSilenzioso(this.selezionata.id);
    this.refreshConversazioniSilenzioso();
  }

  private refreshMessaggiSilenzioso(idConv: number) {
    this.messaggiService.getMessaggi(idConv).subscribe({
      next: (m) => {
        const nuovi = m ?? [];
        if (!this.selezionata || this.selezionata.id !== idConv) return;
        // Aggiorna solo se è cambiato qualcosa, per non resettare lo scroll.
        if (nuovi.length !== this.messaggi.length) this.scrollDaFare = true;
        this.messaggi = nuovi;
        this.selezionata.nonLetti = 0;
      },
      error: () => {},
    });
  }

  private refreshConversazioniSilenzioso() {
    this.messaggiService.getConversazioni().subscribe({
      next: (c) => {
        this.conversazioni = c ?? [];
        // Mantiene selezionato lo stesso thread (aggiorna il riferimento).
        if (this.selezionata) {
          const match = this.conversazioni.find(x => x.id === this.selezionata.id);
          if (match) { match.nonLetti = 0; this.selezionata = match; }
        }
      },
      error: () => {},
    });
  }

  ngAfterViewChecked() {
    if (this.scrollDaFare && this.threadBody) {
      this.threadBody.nativeElement.scrollTop = this.threadBody.nativeElement.scrollHeight;
      this.scrollDaFare = false;
    }
  }

  private caricaConversazioni() {
    this.loading = true;
    this.messaggiService.getConversazioni().subscribe({
      next: (c) => {
        this.conversazioni = c ?? [];
        this.loading = false;
        // Auto-apertura della conversazione arrivata via query param (?conv=ID).
        if (this.convDaAprire != null) {
          const target = this.conversazioni.find(x => x.id === this.convDaAprire);
          this.convDaAprire = null;
          if (target) this.seleziona(target);
        }
      },
      error: () => { this.conversazioni = []; this.loading = false; },
    });
  }

  get isAdmin(): boolean { return this.auth.isAdmin(); }

  // Conversazioni mostrate: attive o archiviate a seconda del tab attivo.
  get conversazioniVisibili(): any[] {
    return this.conversazioni.filter(c => !!c.archiviata === this.mostraArchiviate);
  }
  get countArchiviate(): number {
    return this.conversazioni.filter(c => !!c.archiviata).length;
  }

  cambiaTab(archiviate: boolean) {
    if (this.mostraArchiviate === archiviate) return;
    this.mostraArchiviate = archiviate;
    // La conversazione aperta potrebbe non appartenere più al tab visibile.
    if (this.selezionata && !!this.selezionata.archiviata !== archiviate) this.chiudiThread();
  }

  // Archivia o ripristina una conversazione (indipendente per partecipante).
  archivia(conv: any, event: Event) {
    event.stopPropagation();
    const nuovoStato = !conv.archiviata;
    this.messaggiService.archivia(conv.id, nuovoStato).subscribe({
      next: () => {
        conv.archiviata = nuovoStato;
        if (this.selezionata?.id === conv.id) this.selezionata.archiviata = nuovoStato;
        this.alert(this.i18n.translate(nuovoStato ? 'msg.archiviata-ok' : 'msg.ripristinata-ok'), 'success');
      },
      error: () => this.alert(this.i18n.translate('msg.errore'), 'error'),
    });
  }

  // Un messaggio ricevuto (non mio) può essere segnalato all'assistenza; non ha
  // senso segnalare dentro una chat di assistenza né se sono io l'assistenza.
  puoSegnalare(m: any): boolean {
    return !this.isAdmin && !this.isMine(m) && !this.selezionata?.assistenza;
  }
  chiediSegnala(m: any) {
    this.messaggioDaSegnalare = m;
    this.showConfirmSegnala = true;
  }
  gestisciSegnala(risposta: boolean) {
    this.showConfirmSegnala = false;
    const m = this.messaggioDaSegnalare;
    this.messaggioDaSegnalare = null;
    if (!risposta || !m) return;
    this.messaggiService.segnala(m.id).subscribe({
      next: () => this.alert(this.i18n.translate('msg.segnalato-ok'), 'success'),
      error: (e) => this.alert(e?.error?.message ?? e?.error ?? this.i18n.translate('msg.errore'), 'error'),
    });
  }

  seleziona(conv: any) {
    this.selezionata = conv;
    this.caricaMessaggi(conv.id);
  }

  chiudiThread() { this.selezionata = null; this.messaggi = []; }

  private caricaMessaggi(idConv: number) {
    this.loadingMessaggi = true;
    this.messaggiService.getMessaggi(idConv).subscribe({
      next: (m) => {
        this.messaggi = m ?? [];
        this.loadingMessaggi = false;
        this.scrollDaFare = true;
        // I messaggi risultano ora letti: azzera il badge nella lista.
        if (this.selezionata) this.selezionata.nonLetti = 0;
      },
      error: () => { this.messaggi = []; this.loadingMessaggi = false; },
    });
  }

  invia() {
    const testo = this.nuovoTesto.trim();
    if (!testo || !this.selezionata || this.sending) return;
    this.sending = true;
    this.messaggiService.invia(this.selezionata.id, testo).subscribe({
      next: (m) => {
        this.sending = false;
        this.nuovoTesto = '';
        this.messaggi = [...this.messaggi, m];
        this.scrollDaFare = true;
        // Aggiorna l'anteprima nella lista e riporta la chat in cima.
        this.selezionata.ultimoMessaggio = testo;
        this.selezionata.dataUltimoMessaggio = m.dataInvio;
        this.conversazioni = [
          this.selezionata,
          ...this.conversazioni.filter(c => c.id !== this.selezionata.id),
        ];
      },
      error: () => {
        this.sending = false;
        this.alert(this.i18n.translate('msg.errore'), 'error');
      },
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.invia();
    }
  }

  // ── Helpers ──

  altroNome(conv: any): string {
    if (!conv) return '';
    return this.currentUserId === conv.idGuest ? conv.nomeHost : conv.nomeGuest;
  }

  iniziali(nome: string): string {
    if (!nome) return '?';
    return nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  isMine(m: any): boolean {
    return m?.idMittente === this.currentUserId;
  }

  fmtOra(data: string): string {
    if (!data) return '';
    const d = new Date(data);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  private alert(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
