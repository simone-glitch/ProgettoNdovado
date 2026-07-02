import { Routes } from '@angular/router';
import { Login }          from './auth/login/login';
import { Register }       from './auth/register/register';
import { ForgotPassword } from './auth/forgot-password/forgot-password';
import { ResetPassword }  from './auth/reset-password/reset-password';
import { Dashboard } from './features/dashboard/dashboard';
import { Setting }   from './features/setting/setting';
import { Utenti }    from './features/utenti/utenti';
import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role.guard';
import { Home }          from './features/home/home';
import { HotelDetail }   from './features/hotel-detail/hotel-detail';
import { Prenotazioni }  from './features/prenotazioni/prenotazioni';
import { GestioneHotel } from './features/gestione-hotel/gestione-hotel';
import { MieiHotel }     from './features/miei-hotel/miei-hotel';
import { Statistiche }   from './features/statistiche/statistiche';
import { AggiungiHotel } from './features/aggiungi-hotel/aggiungi-hotel';
import { Preferiti }     from './features/preferiti/preferiti';
import { HotelForm }      from './features/hotel-form/hotel-form';
import { GestioneCamere } from './features/gestione-camere/gestione-camere';

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
      { path: 'prenotazioni',        component: Prenotazioni,  canActivate: [RoleGuard], data: { roles: ['GUEST', 'HOST', 'ADMIN'] } },
      { path: 'gestione-hotel',      component: GestioneHotel, canActivate: [RoleGuard], data: { roles: ['HOST', 'ADMIN'] } },
      { path: 'hotel/nuovo',         component: HotelForm,      canActivate: [RoleGuard], data: { roles: ['HOST', 'ADMIN'] } },
      { path: 'hotel/:id/modifica',  component: HotelForm,      canActivate: [RoleGuard], data: { roles: ['HOST', 'ADMIN'] } },
      { path: 'hotel/:id/camere',    component: GestioneCamere, canActivate: [RoleGuard], data: { roles: ['HOST', 'ADMIN'] } },
      { path: 'miei-hotel',          component: MieiHotel,     canActivate: [RoleGuard], data: { roles: ['HOST'] } },
      { path: 'aggiungi-hotel',      component: AggiungiHotel, canActivate: [RoleGuard], data: { roles: ['HOST'] } },
      { path: 'statistiche',         component: Statistiche,   canActivate: [RoleGuard], data: { roles: ['HOST'] } },
      { path: 'utenti',              component: Utenti,        canActivate: [RoleGuard], data: { roles: ['ADMIN'] } },
      { path: 'preferiti',           component: Preferiti,     canActivate: [RoleGuard], data: { roles: ['GUEST'] } },
      { path: 'settings',            component: Setting },
    ]
  }
];
