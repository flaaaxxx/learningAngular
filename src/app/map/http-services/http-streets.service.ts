import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {FeatureCollection, LineString} from 'geojson';

@Injectable({
  providedIn: 'root'
})
export class HttpStreetsService {
  private readonly http = inject(HttpClient);
  private readonly ALL_STREETS_GEO_URL = 'http://localhost:3000/streets';

  loadStreets(): Observable<FeatureCollection<LineString>> {
    return this.http.get<FeatureCollection<LineString>>(this.ALL_STREETS_GEO_URL);
  }
}
