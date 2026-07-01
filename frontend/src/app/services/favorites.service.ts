import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly STORAGE_KEY = 'ndv_favorites';
  private favMap = new BehaviorSubject<Map<number, any>>(this.loadFromStorage());

  private loadFromStorage(): Map<number, any> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return new Map();
      const arr: any[] = JSON.parse(raw);
      return new Map(arr.map(h => [h.id, h]));
    } catch { return new Map(); }
  }

  private persist(map: Map<number, any>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...map.values()]));
  }

  favorites$ = this.favMap.asObservable();

  get count(): number { return this.favMap.value.size; }

  isFavorite(id: number): boolean { return this.favMap.value.has(id); }

  toggle(hotel: any): void {
    const map = new Map(this.favMap.value);
    if (map.has(hotel.id)) {
      map.delete(hotel.id);
    } else {
      map.set(hotel.id, hotel);
    }
    this.favMap.next(map);
    this.persist(map);
  }

  getAll(): any[] { return [...this.favMap.value.values()]; }
}
