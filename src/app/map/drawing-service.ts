import { inject, Injectable, signal } from '@angular/core';
import { DrawMode } from './map-tools/map-tools';
import { LocationService } from '../location-service/location-service';

@Injectable({ providedIn: 'root' })
export class DrawingService {
  private map!: L.Map;
  private tempMarkers: L.Marker[] = [];
  private lines: L.Polyline[] = [];
  private mode = signal<DrawMode>(DrawMode.CONTINUOUS);

  // Wstrzyknij inne serwisy jeśli potrzebne
  private locationService = inject(LocationService);

  setMap(map: L.Map) { this.map = map; }

  // Tutaj przenieś:
  // - drawContinuousMode, drawStarMode, drawSingleMode, drawManyPointsMode
  // - createConnectedLine, updateLineTooltip
  // - redrawGraph i reconstruct...Path
  // - clearAllLines

  // Przykład metody po przeniesieniu:
  draw(latlng: L.LatLng, mode: DrawMode) {
    const marker = this.initMarker(latlng);
    // ... logika switch(mode) ...
  }

  private initMarker(latlng: L.LatLng): L.Marker {
    // Logika createMarker z obsługą contextmenu i dragend
  }
}
