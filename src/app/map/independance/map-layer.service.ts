import {Injectable} from '@angular/core';
import * as L from 'leaflet';
import {GeoJSON} from 'leaflet';
import {Feature, FeatureCollection, LineString} from 'geojson';

export type LayerName = 'streets' | 'covered';

@Injectable({
  providedIn: 'root'
})
export class MapLayerService {
  private map!: L.Map;

  private layers = new Map<LayerName, L.LayerGroup>();
  private activeLayers = new Set<LayerName>();

  init(map: L.Map) {
    this.map = map;

    this.baseLayers['OpenStreetMap'].addTo(this.map);

    this.layers.set('streets', L.layerGroup().addTo(map));
    this.layers.set('covered', L.layerGroup().addTo(map)); // ustawienie na start

    // domyślnie włączone
    this.activeLayers.add('streets');
    this.addLayersControl(map);
  }

  // ----- Warstwy bazowe (przełączalne, tylko jedna aktywna) -----
  readonly baseLayers: Record<string, L.TileLayer> = {
    'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 20, keepBuffer: 50, updateWhenIdle: false, updateWhenZooming: true,
    }),
    'OpenTopoMap': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OpenStreetMap contributors | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      maxZoom: 17, keepBuffer: 50, updateWhenIdle: false, updateWhenZooming: true,
    }),
    'Humanitarian': L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors, Tiles by <a href="https://www.hotosm.org/">HOT</a>',
      maxZoom: 20, keepBuffer: 50, updateWhenIdle: false, updateWhenZooming: true,
    }),
    'Satelita (Esri)': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      maxZoom: 19,
    }),
    'Dark (CartoDB)': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 20, keepBuffer: 50, updateWhenIdle: false, updateWhenZooming: true,
    }),
    'Jasna (CartoDB)': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 20, keepBuffer: 50, updateWhenIdle: false, updateWhenZooming: true,
    }),
    'Rowerowa (CyclOSM)': L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
      attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 20, keepBuffer: 50, updateWhenIdle: false, updateWhenZooming: true,
    }),
  };

  getLayer(layerName: LayerName): L.LayerGroup {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw new Error(`Layer ${layerName} not found`);
    }
    return layer;
  }

  private addLayersControl(map: L.Map): void {
    // Warstwy nakładkowe pobrane z LayerService
    const overlays: Record<string, L.LayerGroup> = {
      'Pokrycie': this.getLayer('streets'),
      'Trasy': this.getLayer('covered'),
    };

    L.control.layers(this.baseLayers, overlays, {
      position: 'bottomleft',
      collapsed: true,   // zwinięty domyślnie, rozwija się po kliknięciu
    }).addTo(map);
  }

  loadToCoverageLayer(data: GeoJSON.Feature): void {
    const layerGroup = this.getLayer('streets');
    layerGroup.clearLayers();

    L.geoJson(data, {
      style: (feature) => {
        const isCompleted = feature?.properties?.['completed'];
        return {
          color: isCompleted ? '#22c55e' : '#ff4d4d', // Zielony vs Czerwony
          weight: isCompleted ? 6 : 4,
          opacity: 0.8
        };
      }
    }).addTo(layerGroup);
  }

  loadCoveredLayer(data: GeoJSON.Feature): void {
    const layerGroup = this.getLayer('covered');
    layerGroup.clearLayers();

    L.geoJson(data, {
      style: (feature) => {
        const isCompleted = feature?.properties?.['completed'];
        return {
          color: '#22c55e', // Zielony vs Czerwony
          weight: isCompleted ? 6 : 4,
          opacity: 0.8
        };
      }
    }).addTo(layerGroup);
  }

  // loadStreetsWithCoverage(streets: FeatureCollection<LineString>, coverage: Feature | null): void {
  //   const layerGroup = this.getLayer('covered');
  //   layerGroup.clearLayers();
  //
  //   const coveredSegments: L.LatLng[][] = coverage
  //     ? (coverage.geometry as any).coordinates.map((seg: number[][]) =>
  //       seg.map(([lng, lat]) => L.latLng(lat, lng))
  //     )
  //     : [];
  //
  //   L.geoJSON(streets, {
  //     style: (feature) => {
  //       const streetCoords = (feature?.geometry as LineString).coordinates;
  //
  //       const isCovered = coveredSegments.some(segment =>
  //         streetCoords.some(([lng, lat]) =>
  //           segment.some(point => point.distanceTo(L.latLng(lat, lng)) < 20)
  //         )
  //       );
  //
  //       return {
  //         color: isCovered ? '#22c55e' : '#ef4444',
  //         weight: 3,
  //         opacity: 0.8
  //       };
  //     },
  //     onEachFeature: (feature, layer) => {
  //       layer.bindPopup(feature.properties?.['name'] ?? 'Bez nazwy');
  //     }
  //   }).addTo(layerGroup);
  // }

  loadStreetsWithCoverage(streets: FeatureCollection<LineString>, coverage: Feature | null): void {
    const layerGroup = this.getLayer('covered');
    layerGroup.clearLayers();

    const coveredSegments: L.LatLng[][] = coverage
      ? (coverage.geometry as any).coordinates.map((seg: number[][]) =>
        seg.map(([lng, lat]) => L.latLng(lat, lng))
      )
      : [];

    L.geoJSON(streets, {
      style: (feature) => {
        const streetCoords = (feature?.geometry as LineString).coordinates;

        const isCovered = coveredSegments.some(segment =>
          streetCoords.some(([lng, lat], i) => {
            if (i === 0) return false;
            const prev = streetCoords[i - 1];
            const segStart = L.latLng(prev[1], prev[0]);
            const segEnd   = L.latLng(lat, lng);

            return segment.some(point =>
              this.pointToSegmentDistance(point, segStart, segEnd) < 15
            );
          })
        );

        return {
          color: isCovered ? '#22c55e' : '#ef4444',
          weight: 3,
          opacity: 0.8
        };
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(feature.properties?.['name'] ?? 'Bez nazwy');
      }
    }).addTo(layerGroup);
  }

  private pointToSegmentDistance(point: L.LatLng, segStart: L.LatLng, segEnd: L.LatLng): number {
    const x = point.lng,   y = point.lat;
    const x1 = segStart.lng, y1 = segStart.lat;
    const x2 = segEnd.lng,   y2 = segEnd.lat;

    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    const t = lenSq > 0
      ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq))
      : 0;

    return point.distanceTo(L.latLng(y1 + t * dy, x1 + t * dx));
  }

}
