import {inject, Injectable, signal} from '@angular/core';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { FeatureCollection, LineString, Polygon, Feature } from 'geojson';
import {HttpCoverageService} from './http-services/http-coverage.service';

export interface Region {
  id: string;
  polygon: L.Polygon;
  isVisited: boolean;
  feature: Feature<Polygon>;
}

@Injectable({ providedIn: 'root' })
export class AreaService {
  private readonly coverageApiService = inject(HttpCoverageService);

  private regions = signal<Region[]>([]);
  public readonly regionsList = this.regions.asReadonly();

  // generateStreetRegions(geojsonData: FeatureCollection<LineString>) {
  //   try {
  //     const fixedData = turf.rewind(geojsonData, { reverse: true }) as FeatureCollection<LineString>;
  //     const bbox = turf.bbox(fixedData);
  //
  //
  //     // console.log(geojsonData)
  //     console.log(bbox)
  //     // console.log(boxx)
  //     // 1. Tworzymy siatkę IDEALNYCH, identycznych komórek.
  //     // 0.05 oznacza, że każdy kafelek będzie miał dokładnie ten sam rozmiar.
  //     const grid = turf.hexGrid(bbox, 0.05, { units: 'kilometers' });
  //
  //     // 2. Bufor ulicy służy TYLKO do sprawdzenia, które kafelki narysować.
  //     const streetsBuffer = turf.buffer(fixedData, 0.001, { units: 'kilometers' });
  //     const bufferFeature = streetsBuffer?.features?.[0] as any;
  //
  //     if (!bufferFeature) return;
  //
  //     const newRegions: Region[] = [];
  //
  //     grid.features.forEach((cell, index) => {
  //       // 3. Sprawdzamy tylko, czy dany kafelek dotyka obszaru ulicy.
  //       // NIE PRZYCINAMY GO - dzięki temu zachowuje idealny kształt i równe linie.
  //       if (turf.booleanIntersects(cell as any, bufferFeature)) {
  //
  //         const coords = cell.geometry.coordinates[0] as number[][];
  //         // Konwersja na format Leaflet
  //         const leafletCoords = coords.map(c => [c[1], c[0]] as L.LatLngTuple);
  //
  //         const poly = L.polygon(leafletCoords, {
  //           color: '#2c3e50',      // Ciemne, równe krawędzie
  //           fillColor: '#e74c3c',  // Kolor wypełnienia
  //           fillOpacity: 0.4,
  //           weight: 1,             // Stała grubość linii
  //           interactive: false
  //         });
  //
  //         newRegions.push({
  //           id: `cell-${index}`,
  //           polygon: poly,
  //           isVisited: false,
  //           feature: cell as any // Zapisujemy oryginalny, pełny kształt
  //         });
  //       }
  //     });
  //
  //     this.regions.set(newRegions);
  //     // console.log(`Wygenerowano ${newRegions.length} identycznych komórek.`);
  //
  //   } catch (error) {
  //     console.error("Błąd:", error);
  //   }
  // }

  generateStreetRegions() {
    try {
      // 1. Definicja Twojego obszaru Siedlec (GeoJSON [Lng, Lat])
      const siedlceMask = turf.polygon([[
        [22.295, 52.21], // Góra (Szczyt) - ZMNIEJSZONE z 52.23 na 52.21
        [22.37, 52.18],  // Prawy górny
        [22.34, 52.12],  // Prawy dolny
        [22.25, 52.12],  // Lewy dolny
        [22.22, 52.18],  // Lewy górny
        [22.295, 52.21]  // Zamknięcie (musi być identyczne jak pierwszy punkt)
      ]]);

      // 2. Pobranie granic (BBox) bezpośrednio z Twojego polygonu
      const bbox = turf.bbox(siedlceMask);

      // 3. Generowanie idealnej siatki heksagonów (komórek)
      // 0.15 km to rozmiar kafelka. Zmień na mniejszy (np. 0.08) dla drobniejszej siatki.
      const grid = turf.hexGrid(bbox, 0.08, { units: 'kilometers' });

      const newRegions: Region[] = [];

      // 4. Przetwarzanie kafelków
      grid.features.forEach((cell, index) => {
        // Opcjonalne: Sprawdzamy czy kafelek leży wewnątrz maski,
        // aby siatka nie była idealnym prostokątem, a trzymała się Twoich punktów.
        if (turf.booleanIntersects(cell as any, siedlceMask)) {

          const coords = cell.geometry.coordinates[0] as number[][];

          // Konwersja na format Leaflet [Lat, Lng]
          const leafletCoords = coords.map(c => [c[1], c[0]] as L.LatLngTuple);

          const poly = L.polygon(leafletCoords, {
            color: '#2c3e50',      // Ciemna ramka (idealne linie)
            fillColor: '#3498db',  // Kolor kafelka
            fillOpacity: 0.03,
            weight: 0.5,
            interactive: false
          });

          const bbox = turf.bbox(cell);
          newRegions.push({
            id: `hex-${bbox.map(v => v.toFixed(5)).join('-')}`,
            polygon: poly,
            isVisited: false,
            feature: cell as any
          });
        }
      });

      // 5. Aktualizacja sygnału/stanu
      this.regions.set(newRegions);
      console.log(`Wygenerowano matrycę Siedlec: ${newRegions.length} kafelków.`);

    } catch (error) {
      console.error("Błąd podczas generowania siatki Siedlec:", error);
    }
  }

  checkGpsInRegions(latlng: L.LatLng): void {
    const point = turf.point([latlng.lng, latlng.lat]);

    let visitedRegionId: string | null = null;

    this.regions.update(regions =>
      regions.map(region => {
        if (!region.isVisited && turf.booleanPointInPolygon(point, region.feature)) {
          region.polygon.setStyle({
            color: '#2ecc71',
            fillColor: '#2ecc71',
            fillOpacity: 0.5,
            weight: 1
          });

          visitedRegionId = region.id;
          return { ...region, isVisited: true };
        }
        return region;
      })
    );

    if (visitedRegionId !== null) {
      this.saveCoverage(visitedRegionId);
    }
  }

  private saveCoverage(visitedRegionId: string): void {
    this.coverageApiService.saveCoverage({visitedRegionId: visitedRegionId}).subscribe();
  }
}
