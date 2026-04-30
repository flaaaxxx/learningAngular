import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {GeoJSON} from 'leaflet';

/** To jedyne miejsce w aplikacji które czyta i zapisuje trasy,
 * enkapsuluje całą komunikację z JSON Server.
 */
@Injectable({
  providedIn: 'root'
})
export class RouteStorageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/covered';

  // ----- Odczyt -----
  loadCovered(): Observable<GeoJSON.Feature[]> {
    return this.http.get<GeoJSON.Feature[]>(this.apiUrl);
  }

  getGroupedByDate(): Observable<Record<string, GeoJSON.Feature[]>> {
    return this.loadCovered().pipe(
      map(routes => this.groupByDate(routes))
    );
  }

  // ----- Zapis -----
  save(route: GeoJSON.Feature): Observable<GeoJSON.Feature> {
    return this.http.post<GeoJSON.Feature>(this.apiUrl, route);
  }

  // ----- Usuwanie -----
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /*
  * Zamiast zwracać płaską listę, grupuje trasy po dacie
  * żeby komponent mógł wyświetlić sekcje "dzisiaj", "wczoraj" itd.
  */
  private groupByDate(routes: GeoJSON.Feature[]): Record<string, GeoJSON.Feature[]> {
    return routes.reduce((acc, route) => {
      const date = new Date(route.properties!['date'])
        .toLocaleDateString('pl-PL'); // np. "02.05.2026"

      if (!acc[date]) acc[date] = [];
      acc[date].push(route);
      return acc;
    }, {} as Record<string, GeoJSON.Feature[]>);
  }
}
