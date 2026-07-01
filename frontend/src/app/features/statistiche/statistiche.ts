import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SharedModule }        from '../../shared/shared.module';
import { DashboardService }    from '../../services/dashboard.service';
import { HotelService }        from '../../services/hotel.service';
import { PrenotazioneService } from '../../services/prenotazione.service';
import { AuthService }         from '../../services/auth.service';
import { PreferencesService }  from '../../services/preferences.service';
import { TranslationService }  from '../../services/translation.service';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-statistiche',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule],
  templateUrl: './statistiche.html',
  styleUrl: './statistiche.css',
})
export class Statistiche implements OnInit, OnDestroy {
  @ViewChild('chartMensile')   chartMensileRef!:   ElementRef;
  @ViewChild('chartEntrate')   chartEntrateRef!:   ElementRef;
  @ViewChild('chartStruttura') chartStrutturaRef!: ElementRef;
  @ViewChild('chartStato')     chartStatoRef!:     ElementRef;

  serverStats:  any    = null;
  serverCharts: any    = null;
  hotels:       any[]  = [];
  prenotazioni: any[]  = [];

  loading      = true;
  loadingError = false;

  periodoSelezionato   = '12m';
  strutturaSelezionata = 'tutte';

  get periodi() {
    return [
      { value: '7d',  label: this.i18n.translate('stat.periodo.7d')  },
      { value: '30d', label: this.i18n.translate('stat.periodo.30d') },
      { value: '3m',  label: this.i18n.translate('stat.periodo.3m')  },
      { value: '6m',  label: this.i18n.translate('stat.periodo.6m')  },
      { value: '12m', label: this.i18n.translate('stat.periodo.12m') },
    ];
  }

  readonly skeletonItems = [1, 2, 3, 4, 5];

  private chartInstances: Chart[] = [];

  constructor(
    private dashboardService:    DashboardService,
    private hotelService:        HotelService,
    private prenotazioneService: PrenotazioneService,
    private authService:         AuthService,
    private prefsService:        PreferencesService,
    private router:              Router,
    private i18n:                TranslationService
  ) {}

  get isAdmin()      { return this.authService.isAdmin(); }
  get isHost()       { return this.authService.isHost();  }
  get currentUser()  { return this.authService.getLoggedUser() ?? {}; }

  ngOnInit() { this.caricaDati(); }

  ngOnDestroy() { this.chartInstances.forEach(c => c.destroy()); }

  // ─── Data loading ────────────────────────────────────────────────────────────

  caricaDati() {
    this.loading = true;
    this.loadingError = false;

    forkJoin({
      stats:  this.dashboardService.getStats().pipe(catchError(() => of(null))),
      charts: this.dashboardService.getChartData().pipe(catchError(() => of(null))),
      hotels: this.hotelService.getMiei().pipe(catchError(() => of([]))),
      prens:  this.prenotazioneService.getMie().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ stats, charts, hotels, prens }) => {
        this.serverStats  = stats;
        this.serverCharts = charts;
        this.hotels       = hotels ?? [];
        this.prenotazioni = prens  ?? [];
        this.loading      = false;
        setTimeout(() => this.renderCharts(), 120);
      },
      error: () => { this.loading = false; this.loadingError = true; }
    });
  }

  onFiltroChange() {
    if (!this.loading) setTimeout(() => this.renderCharts(), 80);
  }

  // ─── Date helpers ─────────────────────────────────────────────────────────────

  private readonly localeMap: Record<string, string> = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };

  private get locale(): string {
    return this.localeMap[this.prefsService.langCode] ?? 'it-IT';
  }

  private toDate(val: any): Date | null {
    if (!val) return null;
    if (Array.isArray(val) && val.length >= 3) return new Date(val[0], val[1] - 1, val[2]);
    if (typeof val === 'string') {
      const p = val.split('-').map(Number);
      if (p.length === 3 && !p.some(isNaN)) return new Date(p[0], p[1] - 1, p[2]);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private periodoInizio(): Date {
    const now = new Date();
    switch (this.periodoSelezionato) {
      case '7d':  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      case '30d': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      case '3m':  return new Date(now.getFullYear(), now.getMonth() - 3, 1);
      case '6m':  return new Date(now.getFullYear(), now.getMonth() - 6, 1);
      default:    return new Date(now.getFullYear() - 1, now.getMonth(), 1);
    }
  }

  // ─── Filtered prenotazioni ────────────────────────────────────────────────────

  get prenotazioniFiltrate(): any[] {
    const from = this.periodoInizio();
    let lista  = this.prenotazioni.filter(p => {
      const d = this.toDate(p.dataCheckin);
      return !!d && d >= from;
    });
    if (this.strutturaSelezionata !== 'tutte') {
      lista = lista.filter(p =>
        (p.nomeHotel ?? '') === this.strutturaSelezionata ||
        String(p.idHotel ?? '') === this.strutturaSelezionata
      );
    }
    return lista;
  }

  // ─── KPI getters ─────────────────────────────────────────────────────────────

  get totaleStrutture(): number { return this.hotels.length; }

  get prenotazioniRicevute(): number { return this.prenotazioniFiltrate.length; }

  get prenotazioniInAttesa(): number {
    return this.prenotazioniFiltrate.filter(p => p.stato === 'IN_ATTESA').length;
  }

  get entrateMeseCorrente(): number {
    const now = new Date();
    return this.prenotazioni
      .filter(p => p.stato !== 'CANCELLATA' && p.prezzoTotale != null)
      .filter(p => {
        const d = this.toDate(p.dataCheckin);
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, p) => s + Number(p.prezzoTotale || 0), 0);
  }

  get tassoOccupazione(): string {
    const tot  = this.prenotazioniFiltrate.length;
    if (tot === 0) return '0%';
    const conf = this.prenotazioniFiltrate.filter(p => p.stato !== 'CANCELLATA').length;
    return Math.round((conf / tot) * 100) + '%';
  }

  // ─── Chart dataset builders ───────────────────────────────────────────────────

  private buildMensile(): { labels: string[]; data: number[] } {
    if (this.serverCharts?.prenotazioniPerMese &&
        this.periodoSelezionato === '12m' &&
        this.strutturaSelezionata === 'tutte') {
      return {
        labels: this.serverCharts.prenotazioniPerMese.labels ?? [],
        data:   this.serverCharts.prenotazioniPerMese.data   ?? [],
      };
    }
    const bucket = new Map<number, { label: string; count: number }>();
    this.prenotazioniFiltrate.forEach(p => {
      const d = this.toDate(p.dataCheckin);
      if (!d) return;
      const sk = d.getFullYear() * 100 + d.getMonth();
      const lbl = d.toLocaleDateString(this.locale, { month: 'short', year: '2-digit' });
      const e = bucket.get(sk) ?? { label: lbl, count: 0 };
      e.count++;
      bucket.set(sk, e);
    });
    const sorted = Array.from(bucket.entries()).sort((a, b) => a[0] - b[0]);
    return { labels: sorted.map(([, e]) => e.label), data: sorted.map(([, e]) => e.count) };
  }

  private buildEntrate(): { labels: string[]; data: number[] } {
    const bucket = new Map<number, { label: string; rev: number }>();
    this.prenotazioniFiltrate
      .filter(p => p.stato !== 'CANCELLATA')
      .forEach(p => {
        const d = this.toDate(p.dataCheckin);
        if (!d) return;
        const sk = d.getFullYear() * 100 + d.getMonth();
        const lbl = d.toLocaleDateString(this.locale, { month: 'short', year: '2-digit' });
        const e = bucket.get(sk) ?? { label: lbl, rev: 0 };
        e.rev += Number(p.prezzoTotale || 0);
        bucket.set(sk, e);
      });
    const sorted = Array.from(bucket.entries()).sort((a, b) => a[0] - b[0]);
    return { labels: sorted.map(([, e]) => e.label), data: sorted.map(([, e]) => e.rev) };
  }

  private buildStruttura(): { labels: string[]; data: number[] } {
    const map: Record<string, number> = {};
    this.prenotazioniFiltrate.forEach(p => {
      const nome = p.nomeHotel || this.i18n.translate('stat.struttura-sconosciuta');
      map[nome] = (map[nome] || 0) + 1;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { labels: sorted.map(([l]) => l), data: sorted.map(([, d]) => d) };
  }

  private buildStato(): { labels: string[]; data: number[]; colors: string[] } {
    const pf   = this.prenotazioniFiltrate;
    const conf = pf.filter(p => p.stato === 'CONFERMATA').length;
    const att  = pf.filter(p => p.stato === 'IN_ATTESA').length;
    const canc = pf.filter(p => p.stato === 'CANCELLATA').length;
    const entries = [];
    if (conf > 0) entries.push({ l: this.i18n.translate('tab.filtro-confermate'), v: conf, c: '#22c55e' });
    if (att  > 0) entries.push({ l: this.i18n.translate('tab.filtro-attesa'),     v: att,  c: '#f59e0b' });
    if (canc > 0) entries.push({ l: this.i18n.translate('tab.filtro-cancellate'), v: canc, c: '#ef4444' });
    if (entries.length === 0) entries.push({ l: this.i18n.translate('stat.nessuna'), v: 1, c: '#E8EDF4' });
    return { labels: entries.map(e => e.l), data: entries.map(e => e.v), colors: entries.map(e => e.c) };
  }

  // ─── Chart rendering ──────────────────────────────────────────────────────────

  private renderCharts() {
    this.chartInstances.forEach(c => c.destroy());
    this.chartInstances = [];
    this.renderMensile();
    this.renderEntrate();
    this.renderStruttura();
    this.renderStato();
  }

  private renderMensile() {
    if (!this.chartMensileRef?.nativeElement) return;
    const { labels, data } = this.buildMensile();
    const ctx = this.chartMensileRef.nativeElement.getContext('2d');
    this.chartInstances.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: this.i18n.translate('nav.prenotazioni'), data, backgroundColor: 'rgba(15,52,96,0.82)', borderRadius: 6, borderSkipped: false }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } },
        },
      },
    }));
  }

  private renderEntrate() {
    if (!this.chartEntrateRef?.nativeElement) return;
    const { labels, data } = this.buildEntrate();
    const ctx = this.chartEntrateRef.nativeElement.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 280);
    grad.addColorStop(0, 'rgba(99,102,241,0.28)');
    grad.addColorStop(1, 'rgba(99,102,241,0)');
    this.chartInstances.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: this.i18n.translate('stat.entrate-chart'), data,
          borderColor: '#6366f1', backgroundColor: grad,
          fill: true, tension: 0.4,
          pointBackgroundColor: '#6366f1', pointRadius: 4, borderWidth: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true, grid: { color: '#f1f5f9' },
            ticks: { callback: (v: any) => this.fmtEuro(Number(v)) },
          },
          x: { grid: { display: false } },
        },
      },
    }));
  }

  private renderStruttura() {
    if (!this.chartStrutturaRef?.nativeElement) return;
    const { labels, data } = this.buildStruttura();
    const ctx = this.chartStrutturaRef.nativeElement.getContext('2d');
    this.chartInstances.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: this.i18n.translate('nav.prenotazioni'), data, backgroundColor: 'rgba(15,52,96,0.78)', borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
          y: { grid: { display: false } },
        },
      },
    }));
  }

  private renderStato() {
    if (!this.chartStatoRef?.nativeElement) return;
    const { labels, data, colors } = this.buildStato();
    const ctx = this.chartStatoRef.nativeElement.getContext('2d');
    this.chartInstances.push(new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { display: false } },
      },
    }));
  }

  // ─── Stato prenotazioni items (for legend) ────────────────────────────────────

  get statoItems(): { label: string; count: number; pct: string; color: string }[] {
    const pf   = this.prenotazioniFiltrate;
    const tot  = pf.length;
    const pct  = (n: number) => tot > 0 ? Math.round((n / tot) * 100) + '%' : '0%';
    const conf = pf.filter(p => p.stato === 'CONFERMATA').length;
    const att  = pf.filter(p => p.stato === 'IN_ATTESA').length;
    const canc = pf.filter(p => p.stato === 'CANCELLATA').length;
    return [
      { label: this.i18n.translate('tab.filtro-confermate'), count: conf, pct: pct(conf), color: '#22c55e' },
      { label: this.i18n.translate('tab.filtro-attesa'),     count: att,  pct: pct(att),  color: '#f59e0b' },
      { label: this.i18n.translate('tab.filtro-cancellate'), count: canc, pct: pct(canc), color: '#ef4444' },
    ];
  }

  // ─── Best property ────────────────────────────────────────────────────────────

  get miglioreStruttura(): { hotel: any; rev: number; count: number } | null {
    if (!this.hotels.length) return null;
    const scores: Record<number, { hotel: any; rev: number; count: number }> = {};
    this.hotels.forEach(h => { scores[h.id] = { hotel: h, rev: 0, count: 0 }; });
    this.prenotazioniFiltrate
      .filter(p => p.stato !== 'CANCELLATA')
      .forEach(p => {
        const h = this.hotels.find(h => h.nome === p.nomeHotel || h.id === p.idHotel);
        if (h && scores[h.id]) {
          scores[h.id].rev   += Number(p.prezzoTotale || 0);
          scores[h.id].count += 1;
        }
      });
    const best = Object.values(scores).sort((a, b) => b.rev - a.rev)[0];
    return best?.count > 0 ? best : null;
  }

  get miglioreStrutturaOccupazione(): string {
    if (!this.miglioreStruttura) return '0%';
    const tot = this.prenotazioniFiltrate.filter(p => p.stato !== 'CANCELLATA').length;
    if (tot === 0) return '0%';
    return Math.round((this.miglioreStruttura.count / tot) * 100) + '%';
  }

  getHotelImg(hotel: any): string | null {
    return hotel?.foto?.[0]?.urlFoto ?? hotel?.immagine ?? hotel?.image ?? null;
  }

  getHotelInitials(nome: string): string {
    if (!nome) return '?';
    return nome.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  }

  // ─── Recent activity ──────────────────────────────────────────────────────────

  get ultimaAttivita(): any[] {
    const tempi = [
      this.i18n.translate('stat.tempo.min-fa'),
      this.i18n.translate('stat.tempo.ora-fa'),
      this.i18n.translate('stat.tempo.ore-fa'),
      this.i18n.translate('stat.tempo.ieri'),
      this.i18n.translate('stat.tempo.giorni-fa'),
    ];
    return [...this.prenotazioni]
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 5)
      .map((p, i) => ({
        icon:      this.actIcon(p.stato),
        iconClass: this.actClass(p.stato),
        title:     this.actTitle(p.stato),
        detail:    `${p.nomeHotel || this.i18n.translate('stat.hotel-fallback')} — ${this.notti(p)}`,
        tempo:     tempi[i] ?? this.i18n.translate('stat.tempo.recentemente'),
      }));
  }

  private actIcon(s: string)  { const m: any = { IN_ATTESA: 'fa-clock', CONFERMATA: 'fa-calendar-check', CANCELLATA: 'fa-times-circle' }; return m[s] || 'fa-bell'; }
  private actClass(s: string) { const m: any = { IN_ATTESA: 'act-orange', CONFERMATA: 'act-green', CANCELLATA: 'act-red' }; return m[s] || 'act-blue'; }
  private actTitle(s: string) {
    const m: any = {
      IN_ATTESA:  this.i18n.translate('stat.attivita.attesa'),
      CONFERMATA: this.i18n.translate('stat.attivita.nuova'),
      CANCELLATA: this.i18n.translate('stat.attivita.cancellata'),
    };
    return m[s] || this.i18n.translate('stat.attivita.generica');
  }

  private notti(p: any): string {
    const ci = this.toDate(p.dataCheckin);
    const co = this.toDate(p.dataCheckout);
    if (!ci || !co) return '';
    const n = Math.max(1, Math.round((co.getTime() - ci.getTime()) / 86400000));
    const unit = n === 1 ? this.i18n.translate('stat.notte-singolare') : this.i18n.translate('stat.notte-plurale');
    return `${n} ${unit}`;
  }

  // ─── Goals ────────────────────────────────────────────────────────────────────

  get obiettivi(): any[] {
    const entAtt  = this.entrateMeseCorrente;
    const entTgt  = 15000;
    const conf    = this.prenotazioni.filter(p => p.stato !== 'CANCELLATA').length;
    const tot     = this.prenotazioni.length;
    const occAtt  = tot > 0 ? Math.round((conf / tot) * 100) : 0;
    const preTgt  = 150;
    return [
      { label: this.i18n.translate('stat.obiettivo.entrate'),     val: this.fmtEuro(entAtt), target: this.fmtEuro(entTgt), perc: Math.min(100, entTgt > 0 ? Math.round((entAtt / entTgt) * 100) : 0) },
      { label: this.i18n.translate('stat.obiettivo.occupazione'), val: occAtt + '%',         target: '75%',                perc: Math.min(100, Math.round((occAtt / 75) * 100)) },
      { label: this.i18n.translate('stat.obiettivo.nuove-prenotazioni'), val: String(tot),   target: String(preTgt),       perc: Math.min(100, preTgt > 0 ? Math.round((tot / preTgt) * 100) : 0) },
    ];
  }

  // ─── Suggestions ──────────────────────────────────────────────────────────────

  get suggerimenti(): any[] {
    const list: any[] = [];
    const inAtt     = this.prenotazioni.filter(p => p.stato === 'IN_ATTESA').length;
    const canc      = this.prenotazioni.filter(p => p.stato === 'CANCELLATA').length;
    const tot       = this.prenotazioni.length;
    const senzaFoto = this.hotels.filter(h => !h.foto?.length);

    if (senzaFoto.length > 0) {
      list.push({ icon: 'fa-camera', cls: 'sug-blue', title: this.i18n.translate('stat.sug.foto.titolo'), desc: this.i18n.translate('stat.sug.foto.desc'), route: '/dashboard/gestione-hotel' });
    }
    if (tot > 0 && canc / tot > 0.2) {
      list.push({ icon: 'fa-tag', cls: 'sug-gold', title: this.i18n.translate('stat.sug.prezzi.titolo'), desc: this.i18n.translate('stat.sug.prezzi.desc'), route: '/dashboard/gestione-hotel' });
    }
    if (inAtt > 0) {
      list.push({ icon: 'fa-reply', cls: 'sug-orange', title: this.i18n.translate('stat.sug.rispondi.titolo'), desc: this.i18n.translate('stat.sug.rispondi.desc'), route: '/dashboard/prenotazioni' });
    }
    if (list.length < 2) {
      list.push({ icon: 'fa-info-circle', cls: 'sug-green', title: this.i18n.translate('stat.sug.completa.titolo'), desc: this.i18n.translate('stat.sug.completa.desc'), route: '/dashboard/gestione-hotel' });
    }
    return list.slice(0, 3);
  }

  // ─── Formatting ───────────────────────────────────────────────────────────────

  fmtEuro(val: number | null | undefined): string {
    return this.prefsService.formatCurrency(val ?? 0);
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  vaiHotel(hotel: any) {
    if (hotel?.id) this.router.navigate(['/dashboard/hotel-detail', hotel.id]);
  }

  navigateTo(route: string) { if (route) this.router.navigateByUrl(route); }

  vaiGestioneHotel() { this.router.navigate(['/dashboard/gestione-hotel']); }
  vaiPrenotazioni()  { this.router.navigate(['/dashboard/prenotazioni']);   }

  // ─── Export CSV ───────────────────────────────────────────────────────────────

  esportaReport() {
    const pf = this.prenotazioniFiltrate;
    if (!pf.length) return;
    const head = [
      this.i18n.translate('stat.csv.id'),
      this.i18n.translate('stat.csv.hotel'),
      this.i18n.translate('stat.csv.camera'),
      this.i18n.translate('stat.csv.ospite'),
      this.i18n.translate('stat.csv.checkin'),
      this.i18n.translate('stat.csv.checkout'),
      this.i18n.translate('stat.csv.ospiti'),
      this.i18n.translate('stat.csv.totale'),
      this.i18n.translate('stat.csv.stato'),
    ];
    const fmtD = (v: any) => {
      const d = this.toDate(v);
      if (!d) return '';
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    };
    const rows = pf.map(p => [p.id, p.nomeHotel || '', p.tipoCamera || '', p.nomeUtente || '', fmtD(p.dataCheckin), fmtD(p.dataCheckout), p.numOspiti ?? 1, p.prezzoTotale ?? '', p.stato || '']);
    const csv  = [head, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ndovado-statistiche-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
