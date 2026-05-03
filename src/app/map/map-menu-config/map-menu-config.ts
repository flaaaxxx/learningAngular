import {Component, DestroyRef, inject, output} from '@angular/core';
import {MenuConfigButtons} from '../../share/menu-config-buttons/menu-config-buttons';
import {GpsPosition, GpsService} from '../independance/gps.service';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {MapCoreService} from '../independance/map-core.service';
import {MapMarkerService} from '../independance/map-marker.service';
import {EMPTY, switchMap} from 'rxjs';
import {AreaService} from '../area.service';

@Component({
  selector: 'app-map-menu-config',
  imports: [
    MenuConfigButtons
  ],
  templateUrl: './map-menu-config.html',
  styleUrl: './map-menu-config.scss',
})
export class MapMenuConfig {
  private readonly gpsService = inject(GpsService);
  private readonly areaService = inject(AreaService);
  private readonly coreService = inject(MapCoreService);
  private readonly markerService = inject(MapMarkerService);
  private readonly position$ = toObservable(this.gpsService.position);
  private readonly destroyRef = inject(DestroyRef);

  isPanelVisible = false;
  _isPanelVisible = output<boolean>();
  isTracking = this.gpsService.isTracking;

  constructor() {
    toObservable(this.isTracking).pipe(
      switchMap(isTracking => isTracking ? this.position$ : EMPTY),
      takeUntilDestroyed(this.destroyRef)
    )
      .subscribe(pos => this.handleGpsUpdate(pos));
  }

  toggleGps(): void {
    this.gpsService.toggle();
  }

  togglePanel(): void {
    this.isPanelVisible = !this.isPanelVisible;
    this._isPanelVisible.emit(this.isPanelVisible)
  }

  private handleGpsUpdate = (pos: GpsPosition | null): void => {
    const map = this.coreService.getMap();
    if(pos) {
        this.markerService.updateUserMarker(map, pos.latlng, pos.accuracy);
        this.areaService.checkGpsInRegions(pos.latlng);
      } else {
      this.markerService.removeUserFromMap(map);
    }
  };

}

