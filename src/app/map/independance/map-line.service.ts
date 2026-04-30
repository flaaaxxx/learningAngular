import {inject, Injectable} from '@angular/core';
import {polyline, Marker, Map, Polyline, LatLng} from 'leaflet';
import { DrawMode } from '../map-tools/map-tools';
import {MapLayerService} from './map-layer.service';

/**
 * MapLineService — jedyna odpowiedzialność: tworzenie, aktualizacja i usuwanie linii.
 * Nie wie nic o markerach ani trybach rysowania poza tym, co jest potrzebne do renderowania.
 */
@Injectable({ providedIn: 'root' })
export class MapLineService {
  private layerService = inject(MapLayerService);

  private lines: Polyline[] = [];
  /**
   * Tworzy linię między dwoma markerami i wiąże jej aktualizację z ich ruchem.
   * Zwraca gotową linię dodaną do mapy.
   */
  createConnectedLine(map: Map, start: Marker, end: Marker, mode: DrawMode): Polyline {
    const routesLayer = this.layerService.getLayer('covered'); // TODO teraz jest tylko na jednej warstwie mozliwe markowanie Pobierasz grupę

    const line = polyline([start.getLatLng(), end.getLatLng()], {
      color: '#58a6ff',
      weight: 4,
      opacity: 0.9,
      dashArray: '0',
    }).addTo(routesLayer);

    this.lines.push(line);
    this.refreshLineTooltip(line, start, end, mode);

    const onDrag = () => {
      line.setLatLngs([start.getLatLng(), end.getLatLng()]);
      this.refreshLineTooltip(line, start, end, mode);
      if (mode === DrawMode.CONTINUOUS) this.recalculateCumulativeDistances();
    };

    start.on('drag', onDrag);
    end.on('drag', onDrag);

    return line;
  }

  /** Usuwa wszystkie zarządzane linie z mapy i resetuje stan. */
  clearAll(map: Map): void {
    this.lines.forEach((line) => map.removeLayer(line));
    this.lines = [];
  }

  // ----- Prywatne -----

  private refreshLineTooltip(line: Polyline, start: Marker, end: Marker, mode: DrawMode): void {
    const dist = start.getLatLng().distanceTo(end.getLatLng());

    const content =
      mode === DrawMode.CONTINUOUS ? `Suma: ${this.formatDistance(this.cumulativeDistanceUntil(line))}` : this.formatDistance(dist);

    const cssClass =
      mode === DrawMode.CONTINUOUS ? 'distance-tooltip-total' : 'distance-tooltip';

    line.bindTooltip(content, { permanent: true, direction: 'center', className: cssClass })
        .openTooltip();
  }

  /** Oblicza dystans dla pojedynczej linii na podstawie jej punktów. */
  private getLineDistance(line: Polyline): number {
    const pts = line.getLatLngs() as LatLng[];
    return pts[0].distanceTo(pts[1]);  // Leaflet distanceTo zwraca dystans w metrach
  }

  /** Przeszukuje tablicę this.lines, sumując długości wszystkich odcinków, aż trafi na wskazaną linię. */
  private cumulativeDistanceUntil(targetLine: Polyline): number {
    let total = 0;
    for (const line of this.lines) {
      total += this.getLineDistance(line); // Użycie nowej metody
      if (line === targetLine) break;
    }
    return total;
  }

  /** Przelicza i aktualizuje tooltip sumy dla wszystkich linii trybu CONTINUOUS. */
  recalculateCumulativeDistances(): void {
    let total = 0;
    this.lines.forEach((line) => {
      total += this.getLineDistance(line); // Użycie nowej metody
      line.setTooltipContent(`Suma: ${this.formatDistance(total)}`);
    });
  }

  private formatDistance(d: number): string {
    return d > 1000 ? `${(d / 1000).toFixed(2)} km` : `${Math.round(d)} m`;
  }
}
