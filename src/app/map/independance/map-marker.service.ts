import { inject, Injectable } from '@angular/core';
import {Marker, Circle, icon, LeafletEvent, Map as MapLeaf, LatLng, circle, marker, point} from 'leaflet';
import { LocationInfo, LocationService } from './location.service';
import {MapLayerService} from './map-layer.service';

// MapMarkerService jest właścicielem wszystkiego co dotyczy markerów na mapie. Ma dwie odrębne odpowiedzialności:
// Marker użytkownika (GPS)
//
// updateUserMarker — tworzy lub przesuwa marker GPS wraz z kółkiem dokładności
// removeUserFromMap — usuwa marker GPS z mapy i czyści referencje
//
// Markery interaktywne (narzędzia rysowania)
//
// createInteractiveMarker — tworzy w pełni skonfigurowany marker: ikonę, popup, eventy (mouseover, mouseout, drag, dragend, contextmenu) i od razu ładuje dane lokalizacji
// removeMarker — usuwa marker z mapy i kasuje jego dane z wewnętrznej mapy
// loadLocationData — odpytuje LocationService o adres/wysokość dla danej pozycji i aktualizuje popup markera
// refreshAllPopups — po zmianie zoomu aktualizuje treść popupów wszystkich aktywnych markerów
//
// Wewnętrzny rejestr
// Trzyma Map<Marker, LocationInfo> — jedyne miejsce w całej aplikacji gdzie żyją dane lokalizacji. Ani MapDrawService ani MapLineService nie mają do tego dostępu.
// Kluczowa zasada: MapMarkerService nigdy nie decyduje kiedy marker powstaje ani który tryb rysowania jest aktywny — to należy do MapDrawService. On tylko wie jak marker stworzyć i jak nim zarządzać.


export interface MarkerCallbacks {
  onDrag: (e: LeafletEvent) => void;
  onDragEnd: (marker: Marker) => void;
  onContext: (marker: Marker) => void;
}

@Injectable({ providedIn: 'root' })
export class MapMarkerService {
  private locationService = inject(LocationService);
  private layerService = inject(MapLayerService);

  /** Wewnętrzny rejestr danych lokalizacji per marker */
  private markerData = new Map<Marker, LocationInfo>();

  private userMarker: Marker | null = null;
  private accuracyCircle: Circle | null = null;

  // ----- Ikony -----

  private readonly userIcon = icon({
    iconUrl: 'map/markerIcon2x.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  private readonly defaultIcon = icon({
    iconUrl: 'map/markerIcon2x.png',
    shadowUrl: 'map/markerShadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [0, 0],
  });

  // ----- Marker użytkownika (GPS) -----

  updateUserMarker(map: MapLeaf, latlng: LatLng, accuracy: number): void {
    const gpsLayer = this.layerService.getLayer('covered'); // Pobierasz grupę

    if (!this.userMarker) {
      this.userMarker = marker(latlng, { icon: this.userIcon }).addTo(gpsLayer);
      this.accuracyCircle = circle(latlng, { radius: accuracy, weight: 1 }).addTo(gpsLayer);
      map.setView(latlng, 16);
    } else {
      this.userMarker.setLatLng(latlng);
      this.accuracyCircle?.setLatLng(latlng).setRadius(accuracy);
    }
  }

  removeUserFromMap(map: MapLeaf): void {
    if (this.userMarker) {
      map.removeLayer(this.userMarker);
      if (this.accuracyCircle) map.removeLayer(this.accuracyCircle);
      this.userMarker = null;
      this.accuracyCircle = null;
    }
  }

  // ----- Markery interaktywne (narzędzia rysowania) -----

  /**
   * Tworzy w pełni skonfigurowany marker interaktywny.
   * Odpowiedzialność: tworzenie, popup, eventy, ładowanie danych lokalizacji.
   */
  createInteractiveMarker(map: MapLeaf, latlng: LatLng, callbacks: MarkerCallbacks): Marker {
    const routesLayer = this.layerService.getLayer('covered');
    const currentMarker = marker(latlng, { icon: this.defaultIcon, draggable: true }).addTo(routesLayer);

    currentMarker.bindPopup('Szukam adresu...', {
      closeButton: false,
      autoPan: false,
      offset: point(0, -10),
    });

    currentMarker.on('mouseover', () => currentMarker.openPopup());
    currentMarker.on('mouseout', () => currentMarker.closePopup());
    currentMarker.on('drag', (e: LeafletEvent) => callbacks.onDrag(e));
    currentMarker.on('contextmenu', () => callbacks.onContext(currentMarker));
    currentMarker.on('dragend', () => {
      callbacks.onDragEnd(currentMarker);
      currentMarker.openPopup();
    });

    this.loadLocationData(currentMarker, latlng, map.getZoom());
    return currentMarker;
  }

  removeMarker(map: MapLeaf, marker: Marker): void {
    map.removeLayer(marker);
    this.markerData.delete(marker);
  }

  // ----- Dane lokalizacji -----

  loadLocationData(marker: Marker, latlng: LatLng, zoom: number): void {
    this.locationService.getLocationData(latlng.lat, latlng.lng).subscribe({
      next: (info) => {
        this.markerData.set(marker, info);
        marker.setPopupContent(this.buildPopupContent(info, zoom));
      },
      error: () => marker.setPopupContent('Błąd pobierania danych.'),
    });
  }

  refreshAllPopups(markers: Marker[], zoom: number): void {
    markers.forEach((marker) => {
      const info = this.markerData.get(marker);
      if (info) marker.setPopupContent(this.buildPopupContent(info, zoom));
    });
  }

  // ----- Prywatne -----

  private buildPopupContent(info: LocationInfo, zoom: number): string {
    return `
      <div style="font-family: Arial, sans-serif;">
        <b style="color: #2c3e50;">${info.country}</b>, ${info.city}<br>
        <span style="color: #047e87;">${info.address}</span>
        <hr style="margin: 5px 0;">
        <small>Wysokość: <b>${info.altitude} m n.p.m.</b></small>
        <hr style="margin: 5px 0;">
        <div class="extra">
          <strong>Czas znacznika:</strong> ${new Date().toLocaleTimeString()}<br>
          <strong>Zoom:</strong> ${zoom}
        </div>
      </div>
    `;
  }
}
