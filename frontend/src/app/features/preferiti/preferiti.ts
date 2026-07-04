import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../../services/favorites.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-preferiti',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './preferiti.html',
  styleUrl: './preferiti.css',
})
export class Preferiti implements OnInit, OnDestroy {
  hotels: any[] = [];
  private sub!: Subscription;

  constructor(
    private favService: FavoritesService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.favService.sincronizza();
    this.sub = this.favService.favorites$.subscribe(() => {
      this.hotels = this.favService.getAll();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  vaiDettaglio(id: number): void {
    this.router.navigate(['/dashboard/hotel-detail', id]);
  }

  rimuovi(hotel: any, event: Event): void {
    event.stopPropagation();
    this.favService.toggle(hotel);
  }

  scopriHotel(): void {
    this.router.navigate(['/dashboard/home']);
  }

  getHotelImage(hotel: any): string {
    if (hotel.fotoUrls && hotel.fotoUrls.length > 0) return hotel.fotoUrls[0];
    return this.cityFallback(hotel.citta);
  }

  onImageError(event: Event, hotel: any): void {
    const img = event.target as HTMLImageElement;
    const fallback = this.cityFallback(hotel.citta);
    if (!img.src.endsWith(fallback)) img.src = fallback;
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

  ratingStars(voto: number): string {
    const filled = Math.round(voto);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }
}
