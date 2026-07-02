import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Limita l'accesso a una rotta ai soli ruoli elencati in `data.roles`.
 * Va usato dopo AuthGuard: se l'utente è loggato ma il suo ruolo non è
 * ammesso, viene rimandato alla home invece di vedere una pagina non
 * pertinente al suo ruolo (es. un ADMIN sulle statistiche dell'host).
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowed = route.data?.['roles'] as string[] | undefined;
    if (!allowed || allowed.length === 0) return true;

    return allowed.includes(this.authService.getRuolo())
      ? true
      : this.router.createUrlTree(['/dashboard/home']);
  }
}
