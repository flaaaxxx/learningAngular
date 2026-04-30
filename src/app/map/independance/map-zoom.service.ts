import { Injectable } from "@angular/core";
import L from 'leaflet';

@Injectable({
    providedIn: 'root'
})
export class MapZoomService {

  setupZoom(map: L.Map, onZoom: (zoom: number) => void) {
    map.on('zoomend', () => {
      onZoom(map.getZoom());
    });
  }
}
