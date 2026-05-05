import {inject, Injectable} from '@angular/core';
import L from 'leaflet';
import * as turf from '@turf/turf';
import {DrawMode} from './map-tools/map-tools';
import {MapMarkerService} from './independance/map-marker.service';
import {MapLineService} from './independance/map-line.service';
import {MapLayerService} from './independance/map-layer.service';
import { AreaService } from "./area.service";

/**
 * MapDrawService — jedyna odpowiedzialność: orkiestracja trybów rysowania.
 *
 * Nie tworzy bezpośrednio markerów ani linii — deleguje to do odpowiednich serwisów.
 * Przechowuje wyłącznie stan logiczny: listę markerów i aktywny tryb.
 */
@Injectable({providedIn: 'root'})
export class MapDrawService {
  private markerService = inject(MapMarkerService);
  private lineService = inject(MapLineService);
  private layerService = inject(MapLayerService);
  private areaService = inject(AreaService);

  private markers: L.Marker[] = [];
  private firstPoint: L.LatLng | null = null;
  private currentMode: DrawMode = DrawMode.CONTINUOUS;

  // ----- Tryb -----

  setMode(newMode: DrawMode, map: L.Map): void {
    this.currentMode = newMode;
    this.clearAll(map);
  }

  // ----- Obsługa kliknięcia -----

  switchModeLine(latlng: L.LatLng, mode: DrawMode, map: L.Map): void {
    // SPRAWDZENIE: Jeśli użytkownik odznaczył warstwę "Trasy" w menu,
    // nie pozwól na dodawanie nowych punktów.
    const routesLayer = this.layerService.getLayer('covered');

    if (!map.hasLayer(routesLayer)) return;

    switch (mode) {
      case DrawMode.SINGLE:
        this.handleSingleMode(latlng, map);
        break;
      case DrawMode.CONTINUOUS:
        this.handleContinuousMode(latlng, map);
        break;
      case DrawMode.STAR:
        this.handleStarMode(latlng, map);
        break;
      case DrawMode.MANY_POINTS:
        this.handleManyPointsMode(latlng, map);
        break;
    }
  }


  // ----- Reset -----

  clearAll(map: L.Map): void {
    this.lineService.clearAll(map);
    this.markers.forEach((m) => this.markerService.removeMarker(map, m));
    this.markers = [];
    this.firstPoint = null;
  }

  // ----- Synchronizacja popupów -----

  updatePopupsOnZoom(zoom: number): void {
    this.markerService.refreshAllPopups(this.markers, zoom);
  }

  // ----- Strategie rysowania -----

  private handleSingleMode(latlng: L.LatLng, map: L.Map): void {
    if (this.markers.length >= 2) this.clearAll(map);

    const marker = this.spawnMarker(latlng, map);

    if (this.firstPoint) {
      this.lineService.createConnectedLine(map, this.markers[0], marker, DrawMode.SINGLE);
      this.firstPoint = null;
    } else {
      this.firstPoint = latlng;
    }
  }

  private handleContinuousMode(latlng: L.LatLng, map: L.Map): void {
    const marker = this.spawnMarker(latlng, map);

    if (this.firstPoint) {
      const prev = this.markers[this.markers.length - 2];
      this.lineService.createConnectedLine(map, prev, marker, DrawMode.CONTINUOUS);
    }
    this.firstPoint = latlng;
  }

  private handleStarMode(latlng: L.LatLng, map: L.Map): void {
    const marker = this.spawnMarker(latlng, map);

    if (!this.firstPoint) {
      this.firstPoint = latlng; // pierwszy marker = środek gwiazdy
    } else {
      const center = this.markers[0];
      this.lineService.createConnectedLine(map, center, marker, DrawMode.STAR);
    }
  }

  private handleManyPointsMode(latlng: L.LatLng, map: L.Map): void {
    const marker = this.spawnMarker(latlng, map);

    if (this.firstPoint) {
      const prev = this.markers[this.markers.length - 2];
      this.lineService.createConnectedLine(map, prev, marker, DrawMode.MANY_POINTS);
      this.firstPoint = null;
    } else {
      this.firstPoint = latlng;
    }
  }

  // ----- Prywatne -----

  refreshLiveGrid() {
    if (this.markers.length < 3) return;

    const coords = this.markers.map(m => [m.getLatLng().lng, m.getLatLng().lat]);
    coords.push([this.markers[0].getLatLng().lng, this.markers[0].getLatLng().lat]); // domknięcie

    const currentPolygon = turf.polygon([coords]);
    this.areaService.generateAreaGrid(currentPolygon);

    // 2. Pobieramy warstwę, na której wyświetlamy kafelki[cite: 6]
    const layer = this.layerService.getLayer('covered');
    this.areaService.regionsList().forEach(r => {
      layer.addLayer(r.polygon);
    });
  }

  /**
   * Tworzy marker przez MarkerService, rejestruje eventy (usuwanie, drag),
   * dodaje do wewnętrznej listy i zwraca.
   */
  private spawnMarker(latlng: L.LatLng, map: L.Map): L.Marker {
    const marker = this.markerService.createInteractiveMarker(map, latlng, {
      onDrag: () => {
        // Linie reagują same przez eventy zarejestrowane w LineService.
        // Tu możemy np. aktualizować stan UI jeśli potrzeba.
        this.refreshLiveGrid();
      },
      onDragEnd: (m) => {
        this.markerService.loadLocationData(m, m.getLatLng(), map.getZoom());
      },
      onContext: (m) => {
        this.removeMarkerWithRedraw(m, map);
      },
    });

    this.markers.push(marker);
    return marker;
  }

  private removeMarkerWithRedraw(marker: L.Marker, map: L.Map): void {
    const index = this.markers.indexOf(marker);
    if (index === -1) return;

    this.markerService.removeMarker(map, marker);
    this.markers.splice(index, 1);

    this.rebuildLines(map);
  }

  /** Przerysowuje wszystkie linie po zmianie listy markerów. */
  private rebuildLines(map: L.Map): void {
    this.lineService.clearAll(map);
    if (this.markers.length < 2) return;

    switch (this.currentMode) {
      case DrawMode.CONTINUOUS:
        for (let i = 0; i < this.markers.length - 1; i++) {
          this.lineService.createConnectedLine(map, this.markers[i], this.markers[i + 1], DrawMode.CONTINUOUS);
        }
        break;

      case DrawMode.STAR:
        for (let i = 1; i < this.markers.length; i++) {
          this.lineService.createConnectedLine(map, this.markers[0], this.markers[i], DrawMode.STAR);
        }
        break;

      case DrawMode.MANY_POINTS:
        for (let i = 0; i + 1 < this.markers.length; i += 2) {
          this.lineService.createConnectedLine(map, this.markers[i], this.markers[i + 1], DrawMode.MANY_POINTS);
        }
        break;
    }
  }

  /**
   * Wywoływana przy kliknięciu w mapę, dodaje marker i zapisuje współrzędną do tymczasowej tablicy.
   */
  addPointToDraft(latlng: L.LatLng, map: L.Map) {
    this.handleContinuousMode(latlng, map);
  }

  /**
   *  Dynamicznie rysuje/aktualizuje tymczasowy poligon na mapie w miarę dodawania punktów.
   */
  previewDraftPolygon() {
  }

  /**
   * Czyści markery i tymczasowy poligon (np. po anulowaniu).
   */
  clearDraft(map: L.Map): void {
    this.clearAll(map);
  }

  /**
   * Pobiera punkty, domyka poligon (pierwszy punkt = ostatni) i zwraca obiekt GeoJSON (używając turf.polygon).
   */
  finalizePolygon(map: L.Map) {
    if (this.markers.length < 3) {
      console.error('Potrzeba minimum 3 punktów, aby stworzyć obszar!');
      return null;
    }
// 1. Wizualne domknięcie: Rysujemy linię od ostatniego do pierwszego markera[cite: 3, 7]
    const firstMarker = this.markers[0];
    const lastMarker = this.markers[this.markers.length - 1];

    this.lineService.createConnectedLine(map, lastMarker, firstMarker, DrawMode.CONTINUOUS);

    // 2. Przygotowanie danych GeoJSON dla Turf
    const coords = this.markers.map(m => [m.getLatLng().lng, m.getLatLng().lat]);

    // Domykamy tablicę współrzędnych dla formatu Polygon (pierwszy == ostatni)
    coords.push([firstMarker.getLatLng().lng, firstMarker.getLatLng().lat]);

    return turf.polygon([coords]);
  }
}
