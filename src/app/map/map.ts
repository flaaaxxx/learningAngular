import {AfterViewInit, Component, DestroyRef, inject} from '@angular/core';
import * as L from 'leaflet';
import {DrawMode, MapTools} from './map-tools/map-tools';
import {GpsPosition, GpsService} from './independance/gps.service';
import {MapZoomService} from './independance/map-zoom.service';
import {MapCoreService} from './independance/map-core.service';
import {MapDrawService} from './map-draw.service';
import {MapMarkerService} from './independance/map-marker.service';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {MapMenuConfig} from './map-menu-config/map-menu-config';
import {TrackRecorderService} from './track-recorder-service';

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
  private readonly markerService = inject(MapMarkerService);
  private readonly gpsService = inject(GpsService);
  private readonly trackRecorderService = inject(TrackRecorderService);

  isPanelVisible = false;
  isTracking = this.gpsService.isTracking;
  mode: DrawMode = DrawMode.CONTINUOUS;

  private map!: L.Map;
  private readonly homeCoordinates: [number, number] = [52.1606959, 22.2487434];
  private readonly zoomStart = 15;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    toObservable(this.gpsService.position).pipe(takeUntilDestroyed(this.destroyRef))
                                          .subscribe(this.handleGpsUpdate);
  }

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

  togglePanel(): void {
    this.isPanelVisible = !this.isPanelVisible;
  }

  toggleGps(): void {
    this.gpsService.toggle();
    // this.trackRecorderService.start();
  }

  private handleGpsUpdate = (pos: GpsPosition | null): void => {
    if (!this.map) return;
    pos
      ? this.markerService.updateUserMarker(this.map, pos.latlng, pos.accuracy)
      : this.markerService.removeUserFromMap(this.map);
  };
}
