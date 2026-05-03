import {AfterViewInit, Component, inject} from '@angular/core';
import * as L from 'leaflet';
import {DrawMode, MapTools} from './map-tools/map-tools';
import {MapZoomService} from './independance/map-zoom.service';
import {MapCoreService} from './independance/map-core.service';
import {MapDrawService} from './map-draw.service';
import {MapMenuConfig} from './map-menu-config/map-menu-config';

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

  isPanelVisible = false;
  mode: DrawMode = DrawMode.CONTINUOUS;

  private map!: L.Map;
  private readonly homeCoordinates: [number, number] = [52.1606959, 22.2487434];
  private readonly zoomStart = 15;

  ngAfterViewInit(): void {
    this.map = this.coreService.initMap(this.homeCoordinates, this.zoomStart);

    this.map.on('click', (e: L.LeafletMouseEvent) =>
      this.drawService.switchModeLine(e.latlng, this.mode, this.map)
    );

    this.zoomService.setupZoom(this.map, (zoom) =>
      this.drawService.updatePopupsOnZoom(zoom)
    );
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

}
