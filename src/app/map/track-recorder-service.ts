import {DestroyRef, inject, Injectable} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {GpsService} from './independance/gps.service';
import {filter, Subscription, switchMap} from 'rxjs';
import L, {GeoJSON} from 'leaflet';
import {RouteStorageService} from './route-storage-service';

/**
 *  odpowiada za jedno: nagrywanie trasy od startu do stopu.
 */

// Struktura pomocnicza dla ulicy
interface TrackableStreet {
  id: string;
  coords: L.LatLng[];
  startPoint: L.LatLng;
  endPoint: L.LatLng;
  isStartReached: boolean;
  isEndReached: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TrackRecorderService {

  private readonly gpsService = inject(GpsService);
  private readonly routeStorage = inject(RouteStorageService);
  private readonly destroyRef = inject(DestroyRef);

  private points: L.LatLng[] = [];
  private recording = false;
  private subscription?: Subscription;

  start(): void {
    this.points = [];
    this.recording = true;

    this.subscription = toObservable(this.gpsService.position)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(pos => this.recording && pos !== null), // punkt odrzucony, nie trafia do tablicy,  przepuszcza tylko gdy GPS faktycznie ma pozycję
      )
      .subscribe(pos => {
        this.points.push(pos!.latlng);
      });
  }

  stop(): void {
    this.recording = false;
    this.subscription?.unsubscribe();

    const route = this.buildGeoJson();
    this.routeStorage.save(route);  // deleguje zapis
  }

  private buildGeoJson(): GeoJSON.Feature {
    return {
      type: 'Feature',
      properties: {
        date: new Date().toISOString(),
        pointCount: this.points.length,
      },
      geometry: {
        type: 'LineString',
        coordinates: this.points.map(p => [p.lng, p.lat]) // GeoJSON: [lon, lat] !
      }
    };
  }
  //
  // // Logika w serwisie walidującym
  // checkStreetStatus(userPos: L.LatLng, street: TrackableStreet) {
  //   const threshold = 15; // metry
  //
  //   if (userPos.distanceTo(street.startPoint) < threshold) {
  //     street.isStartReached = true;
  //   }
  //
  //   if (userPos.distanceTo(street.endPoint) < threshold) {
  //     street.isEndReached = true;
  //   }
  //
  //   // Jeśli oba końce zostały zaliczone w trakcie jednej sesji
  //   if (street.isStartReached && street.isEndReached) {
  //     this.markStreetAsCompleted(street.id);
  //   }
  // }

}
