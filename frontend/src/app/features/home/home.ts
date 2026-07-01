import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { FavoritesService } from '../../services/favorites.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  hotels: any[] = [];
  loading = false;
  cercato = false;

  filtriForm = new FormGroup({
    citta:     new FormControl(''),
    stelle:    new FormControl<number | null>(null),
    prezzoMax: new FormControl<number | null>(null),
    numOspiti: new FormControl<number | null>(null)
  });

  constructor(
    private hotelService: HotelService,
    private router: Router,
    public favService: FavoritesService,
  ) {}

  ngOnInit() { this.caricaTutti(); }

  caricaTutti() {
    this.loading = true;
    this.hotelService.getTutti().subscribe({
      next: (data) => { this.hotels = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  cerca() {
    const f = this.filtriForm.value;
    const filtri: any = {};
    if (f.citta?.trim())  filtri.citta     = f.citta.trim();
    if (f.stelle)         filtri.stelle    = Number(f.stelle);
    if (f.prezzoMax)      filtri.prezzoMax = Number(f.prezzoMax);
    if (f.numOspiti)      filtri.numOspiti = Number(f.numOspiti);

    this.loading = true;
    this.cercato = true;
    this.hotelService.cerca(filtri).subscribe({
      next: (data) => { this.hotels = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  reset() {
    this.filtriForm.reset();
    this.cercato = false;
    this.caricaTutti();
  }

  vaiDettaglio(id: number) {
    this.router.navigate(['/dashboard/hotel-detail', id]);
  }
  private cityFallback(citta: string): string {
    switch (citta?.toLowerCase()) {
      case 'napoli':  return '/assets/images/Hotel_Image/Napoli.jpg';
      case 'roma':    return '/assets/images/Hotel_Image/Roma.jpg';
      case 'venezia': return '/assets/images/Hotel_Image/Venezia.jpg';
      case 'siena':   return '/assets/images/Hotel_Image/Toscana.jpg';
      default:        return '/assets/images/Hotel_Image/Roma.jpg';
    }
  }

  getHotelImage(hotel: any): string {
    if (hotel.fotoUrls && hotel.fotoUrls.length > 0) {
      return hotel.fotoUrls[0];
    }
    return this.cityFallback(hotel.citta);
  }

  onImageError(event: Event, hotel: any): void {
    const img = event.target as HTMLImageElement;
    const fallback = this.cityFallback(hotel.citta);
    if (!img.src.endsWith(fallback)) {
      img.src = fallback;
    }
  }

  toggleFavorite(hotel: any, event: Event): void {
    event.stopPropagation();
    this.favService.toggle(hotel);
  }

  ratingStars(voto: number): string {
    const filled = Math.round(voto);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  skeletons(): number[] { return [1, 2, 3, 4, 5, 6]; }
}
