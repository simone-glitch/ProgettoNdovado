import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-statistiche',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistiche.html',
  styleUrl: './statistiche.css',
})
export class Statistiche implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartPrenotazioni') chartPrenotazioniRef!: ElementRef;
  @ViewChild('chartHotel')        chartHotelRef!: ElementRef;

  stats: any = null;
  charts: any = null;
  loading = true;

  private chartInstances: Chart[] = [];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  get isAdmin() { return this.authService.isAdmin(); }

  ngOnInit() {
    this.dashboardService.getStats().subscribe({
      next: (s) => { this.stats = s; this.loading = false; this.renderCharts(); },
      error: () => { this.loading = false; }
    });
    this.dashboardService.getChartData().subscribe({
      next: (c) => { this.charts = c; this.renderCharts(); }
    });
  }

  ngAfterViewInit() { this.renderCharts(); }

  ngOnDestroy() { this.chartInstances.forEach(c => c.destroy()); }

  private renderCharts() {
    if (!this.charts || !this.chartPrenotazioniRef || !this.chartHotelRef) return;

    this.chartInstances.forEach(c => c.destroy());
    this.chartInstances = [];

    const goldPalette = [
      '#C9943A', '#0F3460', '#E8D5A0', '#1A5490',
      '#A67828', '#0A2342', '#E8C97A', '#4A7AB5'
    ];

    // Bar chart — prenotazioni per mese
    const ctxP = this.chartPrenotazioniRef.nativeElement.getContext('2d');
    const c1 = new Chart(ctxP, {
      type: 'bar',
      data: {
        labels: this.charts.prenotazioniPerMese?.labels ?? [],
        datasets: [{
          label: 'Prenotazioni',
          data:   this.charts.prenotazioniPerMese?.data ?? [],
          backgroundColor: '#C9943A',
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
    this.chartInstances.push(c1);

    // Doughnut — hotel più prenotati
    const ctxH = this.chartHotelRef.nativeElement.getContext('2d');
    const c2 = new Chart(ctxH, {
      type: 'doughnut',
      data: {
        labels: this.charts.hotelPiuPrenotati?.labels ?? [],
        datasets: [{
          data:            this.charts.hotelPiuPrenotati?.data ?? [],
          backgroundColor: goldPalette,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } }
        },
        cutout: '60%'
      }
    });
    this.chartInstances.push(c2);
  }
}
