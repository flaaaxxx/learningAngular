import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';

export interface LocationInfo {
  country: string;
  city: string;
  address: string;
  altitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  private readonly API_URL = 'https://nominatim.openstreetmap.org/reverse';

  getLocationData(lat: number, lng: number): Observable<LocationInfo> {
    const address$ = this.http.get<any>(this.API_URL, {
      params: {
          format: 'jsonv2',
          lat: lat.toString(), 
          lon: lng.toString()
      },
      headers: { 'Accept-Language': 'pl' }
    });

    const elevation$ = this.http.get<any>('https://api.open-meteo.com/v1/elevation', {
      params: { latitude: lat.toString(), longitude: lng.toString() }
    });

    return forkJoin([address$, elevation$]).pipe(
      map(([addrData, elevData]) => {
        const addr = addrData.address;
        return {
          country: addr?.country || 'Nieznany kraj',
          city: addr?.city || addr?.town || addr?.village || 'Nieznane miasto',
          address: `${addr?.road || 'Brak ulicy'} ${addr?.house_number || ''}`.trim(),
          altitude: elevData.elevation[0] || 0
        };
      }),
      catchError(err => {
        console.error('Błąd:', err);
        return of({ country: 'Błąd', city: '-', address: '-', altitude: 0 });
      })
    );
  }
}