import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authToken = localStorage.getItem('auth_token');
    const isApiRequest = request.url.startsWith(environment.apiUrl);

    const isAuthEndpoint =
      request.url.includes(`${environment.apiUrl}/auth/login`) ||
      request.url.includes(`${environment.apiUrl}/auth/register`);

    if (isApiRequest && authToken && !isAuthEndpoint) {
      const clonedRequest = request.clone({
        setHeaders: {
          Authorization: authToken
        }
      });
      return next.handle(clonedRequest);
    }

    return next.handle(request);
  }
}
