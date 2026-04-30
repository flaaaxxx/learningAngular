import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {GeoJSON} from 'leaflet';
import {FeatureCollection, LineString} from 'geojson';

@Injectable({
  providedIn: 'root'
})
export class StreetsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/streets';

  // ----- Odczyt -----
  loadStreets(): Observable<FeatureCollection<LineString>> {
    return this.http.get<FeatureCollection<LineString>>(this.apiUrl);
  }

}
