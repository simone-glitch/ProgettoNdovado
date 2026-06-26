import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getChartData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/charts`);
  }

  getChartDataForUser(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/charts/${userId}`);
  }
}
