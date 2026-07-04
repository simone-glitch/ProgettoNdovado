import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly BASE_KEY = 'ndv_favorites';

  // Chiave della cache in memoria: cambia quando cambia l'utente loggato.
  private activeKey: string;
  private favMap: BehaviorSubject<Map<number, any>>;
  favorites$: Observable<Map<number, any>>;

  constructor(private authService: AuthService) {
    // La vecchia chiave globale condivideva i preferiti tra tutti gli account
    // sullo stesso browser: la rimuoviamo, ora sono per-utente.
    localStorage.removeItem(this.BASE_KEY);
    this.activeKey = this.storageKey();
    this.favMap = new BehaviorSubject<Map<number, any>>(this.loadFromStorage(this.activeKey));
    this.favorites$ = this.favMap.asObservable();
  }

  private storageKey(): string { return this.authService.userKey(this.BASE_KEY); }

  private loadFromStorage(key: string): Map<number, any> {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Map();
      const arr: any[] = JSON.parse(raw);
      return new Map(arr.map(h => [h.id, h]));
    } catch { return new Map(); }
  }

  private persist(map: Map<number, any>): void {
    localStorage.setItem(this.activeKey, JSON.stringify([...map.values()]));
  }

  /**
   * Riallinea i preferiti all'utente attualmente loggato. Va chiamato quando si
   * entra in una pagina che li mostra (login/logout non ricaricano la SPA, quindi
   * la cache in memoria potrebbe essere ancora quella dell'account precedente).
   */
  sincronizza(): void {
    const key = this.storageKey();
    if (key === this.activeKey) return;
    this.activeKey = key;
    this.favMap.next(this.loadFromStorage(key));
  }

  get count(): number { return this.favMap.value.size; }

  isFavorite(id: number): boolean { return this.favMap.value.has(id); }

  toggle(hotel: any): void {
    this.sincronizza();
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
