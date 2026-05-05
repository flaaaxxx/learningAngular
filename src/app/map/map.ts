import {AfterViewInit, Component, DestroyRef, inject, OnDestroy} from '@angular/core';
import * as L from 'leaflet';
import {DrawMode, MapTools} from './map-tools/map-tools';
import {MapZoomService} from './independance/map-zoom.service';
import {MapCoreService} from './independance/map-core.service';
import {MapDrawService} from './map-draw.service';
import {MapMenuConfig} from './map-menu-config/map-menu-config';
import {AreaService} from './area.service';
import {MapLayerService} from './independance/map-layer.service';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrl: './map.scss',
  imports: [MapTools, MapMenuConfig],
})
export default class MapComponent implements AfterViewInit {

  // serwisy
  private readonly coreService = inject(MapCoreService);
  private readonly zoomService = inject(MapZoomService);
  private readonly drawService = inject(MapDrawService);
  private readonly areaService = inject(AreaService);
  private readonly layerService = inject(MapLayerService);

  isPanelVisible = false;
  isDrawingMode = false;
  mode: DrawMode = DrawMode.CONTINUOUS;

  private map!: L.Map;
  private readonly homeCoordinates: [number, number] = [52.1606959, 22.2487434];
  private readonly zoomStart = 15;

  ngAfterViewInit(): void {
    this.map = this.coreService.initMap(this.homeCoordinates, this.zoomStart);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
        if (this.isDrawingMode) {
          this.drawService.addPointToDraft(e.latlng, this.map);
        }
      }
    );

    // this.map.on('click', (e: L.LeafletMouseEvent) =>
    //     this.drawService.switchModeLine(e.latlng, this.mode, this.map)
    // );

    this.zoomService.setupZoom(this.map, (zoom) =>
      this.drawService.updatePopupsOnZoom(zoom)
    );
  }

  ngOnDestroy(): void {
    this.map?.remove(); // Całkowite usunięcie instancji mapy z pamięci
  }

  setMode(newMode: DrawMode): void {
    this.mode = newMode;
    this.drawService.setMode(newMode, this.map);
  }

  clearAllLines(): void {
    this.drawService.clearAll(this.map);
  }

  togglePanel(event: boolean): void {
    this.isPanelVisible = event
  }

  toggleDrawingMode(event: boolean): void {
    this.isDrawingMode = event;

    if (this.isDrawingMode) {
      this.drawService.clearDraft(this.map);
    } else {
      this.drawService.clearDraft(this.map);
    }
  }

// map.ts[cite: 2]
  onConfirmArea() {
    const polygonGeoJson = this.drawService.finalizePolygon(this.map); //[cite: 3]

    if (polygonGeoJson) {
      // 1. Generujemy nową siatkę na podstawie narysowanego obszaru
      this.areaService.generateAreaGrid(polygonGeoJson); //[cite: 4]

      // 2. Pobieramy warstwę, na której wyświetlamy kafelki[cite: 6]
      const layer = this.layerService.getLayer('covered');
      this.areaService.regionsList().forEach(r => {
        layer.addLayer(r.polygon);
      });

      // 3. Czyścimy stare kafelki i rysunek pomocniczy[cite: 3, 6]
      layer.clearLayers();
      this.drawService.clearDraft(this.map);

      // 4. Dodajemy nowe heksagony na mapę[cite: 4, 11]
      this.areaService.regionsList().forEach(r => {
        layer.addLayer(r.polygon);
      });

      // this.toggleDrawingMode(false); // Wyłączamy tryb rysowania[cite: 2]
    }
  }

  // useArea(area: Area) {}

  protected readonly console = console;
}
