import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role.guard';

// Le viste sono caricate in lazy (loadComponent): ogni feature finisce in un
// chunk separato, così il bundle iniziale resta leggero e dipendenze pesanti
// come chart.js (statistiche) o flatpickr (disponibilità) vengono scaricate
// solo quando la relativa pagina viene aperta.
export const routes: Routes = [
  { path: 'login',            loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  { path: 'register',         loadComponent: () => import('./auth/register/register').then(m => m.Register) },
  { path: 'forgot-password',  loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password',   loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword) },
  { path: '',         redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [AuthGuard],
    children: [
      { path: '',                    redirectTo: 'home', pathMatch: 'full' },
      { path: 'home',                loadComponent: () => import('./features/home/home').then(m => m.Home) },
      { path: 'hotel-detail/:id',    loadComponent: () => import('./features/hotel-detail/hotel-detail').then(m => m.HotelDetail) },
      { path: 'prenotazioni',        loadComponent: () => import('./features/prenotazioni/prenotazioni').then(m => m.Prenotazioni),  canActivate: [RoleGuard], data: { roles: ['GUEST', 'HOST', 'ADMIN'] } },
      { path: 'gestione-hotel',      loadComponent: () => import('./features/gestione-hotel/gestione-hotel').then(m => m.GestioneHotel), canActivate: [RoleGuard], data: { roles: ['HOST', 'ADMIN'] } },
      { path: 'hotel/:id/modifica',  loadComponent: () => import('./features/hotel-form/hotel-form').then(m => m.HotelForm),      canActivate: [RoleGuard], data: { roles: ['HOST', 'ADMIN'] } },
      { path: 'hotel/:id/camere',    loadComponent: () => import('./features/gestione-camere/gestione-camere').then(m => m.GestioneCamere), canActivate: [RoleGuard], data: { roles: ['HOST', 'ADMIN'] } },
      { path: 'miei-hotel',          loadComponent: () => import('./features/miei-hotel/miei-hotel').then(m => m.MieiHotel),     canActivate: [RoleGuard], data: { roles: ['HOST'] } },
      { path: 'aggiungi-hotel',      loadComponent: () => import('./features/aggiungi-hotel/aggiungi-hotel').then(m => m.AggiungiHotel), canActivate: [RoleGuard], data: { roles: ['HOST'] } },
      { path: 'aggiungi-hotel/:id',  loadComponent: () => import('./features/aggiungi-hotel/aggiungi-hotel').then(m => m.AggiungiHotel), canActivate: [RoleGuard], data: { roles: ['HOST'] } },
      { path: 'statistiche',         loadComponent: () => import('./features/statistiche/statistiche').then(m => m.Statistiche),   canActivate: [RoleGuard], data: { roles: ['HOST'] } },
      { path: 'disponibilita',       loadComponent: () => import('./features/disponibilita/disponibilita').then(m => m.Disponibilita), canActivate: [RoleGuard], data: { roles: ['HOST', 'ADMIN'] } },
      { path: 'messaggi',            loadComponent: () => import('./features/messaggi/messaggi').then(m => m.Messaggi),      canActivate: [RoleGuard], data: { roles: ['GUEST', 'HOST', 'ADMIN'] } },
      { path: 'utenti',              loadComponent: () => import('./features/utenti/utenti').then(m => m.Utenti),        canActivate: [RoleGuard], data: { roles: ['ADMIN'] } },
      { path: 'preferiti',           loadComponent: () => import('./features/preferiti/preferiti').then(m => m.Preferiti),     canActivate: [RoleGuard], data: { roles: ['GUEST'] } },
      { path: 'settings',            loadComponent: () => import('./features/setting/setting').then(m => m.Setting) },
    ]
  }
];
