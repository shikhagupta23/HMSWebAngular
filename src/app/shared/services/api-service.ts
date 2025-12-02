import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
 
@Injectable({
  providedIn: 'root'
})


export class ApiService {
 private http = inject(HttpClient);

 
  get<T>(url: string, params?: any): Observable<T> {
    return this.http.get<T>(url, {
      params: params ? new HttpParams({ fromObject: params }) : undefined
    });
  }

  getById<T>(url: string, id: any): Observable<T> {
    return this.http.get<T>(`${url}/${id}`);
  }
 
  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(url, body);
  }
 
  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(url, body);
  }
 
  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url);
  }
}