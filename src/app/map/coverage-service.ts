/**
 *  obsługuje tryb "objazdu miasta" —
 *  śledzi które segmenty ulic już przejechałeś i zaznacza je na mapie.
 */

import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {forkJoin, map, Observable, of, switchMap} from 'rxjs';
import L, {GeoJSON} from 'leaflet';

@Injectable({
  providedIn: 'root',
})
export class CoverageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/coverage/siedlce-coverage';

  private coveredSegments: L.LatLng[][] = [];
  private activeSegment: L.LatLng[] = [];
  private isRecording = false;

  // ----- Odczyt -----

  loadCoverage(): Observable<GeoJSON.Feature | null> {
    return this.http.get<GeoJSON.Feature>(this.apiUrl)
  }

  // // ----- Start / Stop -----
  //
  // start(): void {
  //   this.activeSegment = [];
  //   this.isRecording = true;
  // }
  //
  // addPoint(latlng: L.LatLng): void {
  //   if (!this.isRecording) return;
  //   this.activeSegment.push(latlng);
  // }
  //
  // stop(): Observable<void> {
  //   this.isRecording = false;
  //
  //   if (this.activeSegment.length < 2) return of(void 0);
  //
  //   this.coveredSegments.push([...this.activeSegment]);
  //   const segment = [...this.activeSegment];
  //   this.activeSegment = [];
  //
  //   return this.saveCoverage().pipe(
  //     switchMap(() => this.updateCoveredStreets(segment))
  //   );
  // }
  //
  private updateCoveredStreets(segment: L.LatLng[]): Observable<void> {
    return this.http.get<any[]>('http://localhost:3000/streets').pipe(
      switchMap(streets => {
        const toUpdate = streets.filter(street =>
          this.segmentCoversStreet(segment, street.geometry.coordinates)
        );

        // PATCH każdą pokrytą ulicę
        const updates$ = toUpdate.map(street =>
          this.http.patch(`http://localhost:3000/streets/${street.id}`, { covered: true })
        );

        return updates$.length > 0 ? forkJoin(updates$).pipe(map(() => void 0)) : of(void 0);
      })
    );
  }

  private segmentCoversStreet(segment: L.LatLng[], streetCoords: number[][]): boolean {
    // sprawdź czy którykolwiek punkt segmentu jest bliżej niż 20m od ulicy
    return streetCoords.some(([lng, lat]) =>
      segment.some(point =>
        point.distanceTo(L.latLng(lat, lng)) < 20
      )
    );
  }

  //
  // // ----- Prywatne -----
  //
  // private saveCoverage(): Observable<void> {
  //   const geoJson = this.buildGeoJson();
  //   return this.http.put<void>(this.apiUrl, geoJson);
  // }
  //
  // private buildGeoJson(): GeoJSON.Feature {
  //   return {
  //     type: 'Feature',
  //     properties: {
  //       updatedAt: new Date().toISOString(),
  //       totalSegments: this.coveredSegments.length,
  //     },
  //     geometry: {
  //       type: 'MultiLineString',
  //       coordinates: this.coveredSegments.map(segment =>
  //         segment.map(p => [p.lng, p.lat])
  //       )
  //     }
  //   };
  // }
}
