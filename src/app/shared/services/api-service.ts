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
 
 post<T>(url: string, body: any, options?: any): Observable<any> {
  return this.http.post(url, body, options);
 }

  put<T>(url: string, body: any, options?: any): Observable<any> {
    return this.http.put(url, body, options);
  }
 
  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url);
  }

  patch<T>(url: string, body: any, options?: any): Observable<any> {
    return this.http.patch(url, body, options);
  }
}