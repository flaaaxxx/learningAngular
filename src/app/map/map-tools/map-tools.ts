import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

// export type DrawMode = 'single' | 'continuous' | 'star';

export enum DrawMode {
  SINGLE,
  CONTINUOUS,
  STAR
}

@Component({
  selector: 'app-map-tools',
  imports: [CommonModule, CdkDrag],
  templateUrl: './map-tools.html',
  styleUrl: './map-tools.scss',
})
export class MapTools {
  boundaryElement = input.required<HTMLElement>();
  modeChange = output<DrawMode>();
  clear = output<void>();
  close = output<boolean>();

  DRAW_MODE = DrawMode;
  mode = DrawMode.SINGLE;

  setMode(mode: DrawMode) {
    this.mode = mode;
    this.modeChange.emit(mode);
  }

  onClear() {
    this.clear.emit();
  }

  onClose() {
    this.close.emit(false);
  }
}
