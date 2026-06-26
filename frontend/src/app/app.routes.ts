import { Routes } from '@angular/router';
import { Login }    from './auth/login/login';
import { Register } from './auth/register/register';
import { Dashboard } from './features/dashboard/dashboard';
import { Setting }   from './features/setting/setting';
import { Utenti }    from './features/utenti/utenti';
import { AuthGuard } from './auth/auth.guard';
import { Home }          from './features/home/home';
import { HotelDetail }   from './features/hotel-detail/hotel-detail';
import { Prenotazioni }  from './features/prenotazioni/prenotazioni';
import { GestioneHotel } from './features/gestione-hotel/gestione-hotel';
import { Statistiche }   from './features/statistiche/statistiche';

export const routes: Routes = [
  { path: 'login',    component: Login },
  { path: 'register', component: Register },
  { path: '',         redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard],
    children: [
      { path: '',                    redirectTo: 'home', pathMatch: 'full' },
      { path: 'home',                component: Home },
      { path: 'hotel-detail/:id',    component: HotelDetail },
      { path: 'prenotazioni',        component: Prenotazioni },
      { path: 'gestione-hotel',      component: GestioneHotel },
      { path: 'statistiche',         component: Statistiche },
      { path: 'utenti',              component: Utenti },
      { path: 'settings',            component: Setting },
    ]
  }
];
