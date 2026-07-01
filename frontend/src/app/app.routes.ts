import { Routes } from '@angular/router';
import { Login }          from './auth/login/login';
import { Register }       from './auth/register/register';
import { ForgotPassword } from './auth/forgot-password/forgot-password';
import { ResetPassword }  from './auth/reset-password/reset-password';
import { Dashboard } from './features/dashboard/dashboard';
import { Setting }   from './features/setting/setting';
import { Utenti }    from './features/utenti/utenti';
import { AuthGuard } from './auth/auth.guard';
import { Home }          from './features/home/home';
import { HotelDetail }   from './features/hotel-detail/hotel-detail';
import { Prenotazioni }  from './features/prenotazioni/prenotazioni';
import { GestioneHotel } from './features/gestione-hotel/gestione-hotel';
import { MieiHotel }     from './features/miei-hotel/miei-hotel';
import { Statistiche }   from './features/statistiche/statistiche';
import { AggiungiHotel } from './features/aggiungi-hotel/aggiungi-hotel';
import { Preferiti }     from './features/preferiti/preferiti';

export const routes: Routes = [
  { path: 'login',            component: Login },
  { path: 'register',         component: Register },
  { path: 'forgot-password',  component: ForgotPassword },
  { path: 'reset-password',   component: ResetPassword },
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
      { path: 'miei-hotel',          component: MieiHotel },
      { path: 'aggiungi-hotel',      component: AggiungiHotel },
      { path: 'statistiche',         component: Statistiche },
      { path: 'utenti',              component: Utenti },
      { path: 'preferiti',           component: Preferiti },
      { path: 'settings',            component: Setting },
    ]
  }
];
