import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { GpsService } from '../navigate/gps.service';

// export type DrawMode = 'single' | 'continuous' | 'star';

export enum DrawMode {
  SINGLE,
  MANY_POINTS,
  CONTINUOUS,
  STAR
}

@Component({
  selector: 'app-map-tools',
  imports: [CommonModule, CdkDrag],
  templateUrl: './map-tools.html',
  styleUrl: './map-tools.scss',
  standalone: true
})
export class MapTools {

  private gpsService = inject(GpsService);

  isTracking = this.gpsService.isTracking;
  boundaryElement = input.required<HTMLElement>();
  currentMode = input(DrawMode.SINGLE);
  modeChange = output<DrawMode>();
  clear = output<void>();
  close = output<boolean>();

  DRAW_MODE = DrawMode;
  mode = DrawMode.SINGLE;

  setMode(mode: DrawMode) {
    this.mode = mode;
    this.modeChange.emit(mode);
    this.onClose();
  }

  onClear() {
    this.clear.emit();
    this.onClose();
  }

  onClose() {
    this.close.emit(false);
  }

  toggleGps() {
    if (this.isTracking()) {
      this.gpsService.stopTracking();
    } else {
      this.gpsService.startTracking();
    }
  }
}
