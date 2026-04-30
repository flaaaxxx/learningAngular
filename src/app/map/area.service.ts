import { Injectable, signal } from '@angular/core';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { FeatureCollection, LineString, Polygon, Feature } from 'geojson';

export interface Region {
  id: string;
  polygon: L.Polygon;
  isVisited: boolean;
  feature: Feature<Polygon>;
}

@Injectable({ providedIn: 'root' })
export class AreaService {
  private regions = signal<Region[]>([]);
  public readonly regionsList = this.regions.asReadonly();

  generateStreetRegions(geojsonData: FeatureCollection<LineString>) {
    try {
      const fixedData = turf.rewind(geojsonData, { reverse: true }) as FeatureCollection<LineString>;
      const bbox = turf.bbox(fixedData);

      // 1. Tworzymy siatkę IDEALNYCH, identycznych komórek.
      // 0.05 oznacza, że każdy kafelek będzie miał dokładnie ten sam rozmiar.
      const grid = turf.hexGrid(bbox, 0.05, { units: 'kilometers' });

      // 2. Bufor ulicy służy TYLKO do sprawdzenia, które kafelki narysować.
      const streetsBuffer = turf.buffer(fixedData, 0.03, { units: 'kilometers' });
      const bufferFeature = streetsBuffer?.features?.[0] as any;

      if (!bufferFeature) return;

      const newRegions: Region[] = [];

      grid.features.forEach((cell, index) => {
        // 3. Sprawdzamy tylko, czy dany kafelek dotyka obszaru ulicy.
        // NIE PRZYCINAMY GO - dzięki temu zachowuje idealny kształt i równe linie.
        if (turf.booleanIntersects(cell as any, bufferFeature)) {

          const coords = cell.geometry.coordinates[0] as number[][];
          // Konwersja na format Leaflet
          const leafletCoords = coords.map(c => [c[1], c[0]] as L.LatLngTuple);

          const poly = L.polygon(leafletCoords, {
            color: '#2c3e50',      // Ciemne, równe krawędzie
            fillColor: '#e74c3c',  // Kolor wypełnienia
            fillOpacity: 0.4,
            weight: 2,             // Stała grubość linii
            interactive: false
          });

          newRegions.push({
            id: `cell-${index}`,
            polygon: poly,
            isVisited: false,
            feature: cell as any // Zapisujemy oryginalny, pełny kształt
          });
        }
      });

      this.regions.set(newRegions);
      console.log(`Wygenerowano ${newRegions.length} identycznych komórek.`);

    } catch (error) {
      console.error("Błąd:", error);
    }
  }
}
