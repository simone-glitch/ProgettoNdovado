import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authToken = localStorage.getItem('auth_token');
    const isApiRequest = request.url.startsWith(environment.apiUrl);

    const isAuthEndpoint =
      request.url.includes(`${environment.apiUrl}/auth/login`) ||
      request.url.includes(`${environment.apiUrl}/auth/register`);

    if (isApiRequest && authToken && !isAuthEndpoint) {
      request = request.clone({
        setHeaders: {
          Authorization: authToken
        }
      });
    }

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        // Un 401 su una richiesta autenticata (non login/register) significa che
        // il token salvato è scaduto o non è più valido — ad es. password cambiata.
        // Con Spring httpBasic questo 401 arriva anche sugli endpoint pubblici se
        // viene inviato un header Basic errato, quindi tutta l'app mostrerebbe dati
        // vuoti e i salvataggi fallirebbero silenziosamente. Puliamo la sessione e
        // riportiamo l'utente al login, invece di lasciare uno stato incoerente.
        if (err.status === 401 && isApiRequest && !isAuthEndpoint && authToken) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('utente');
          this.router.navigate(['/login'], { queryParams: { sessionExpired: '1' } });
        }
        return throwError(() => err);
      })
    );
  }
}
