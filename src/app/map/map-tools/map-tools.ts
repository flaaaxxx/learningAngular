import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

// export type DrawMode = 'single' | 'continuous' | 'star';

export enum DrawMode {
  SINGLE,
  MANY_POINTS,
  CONTINUOUS,
  STAR
}

@Component({
  selector: 'app-map-tools',
  imports: [CommonModule, CdkDrag, CdkDragHandle],
  templateUrl: './map-tools.html',
  styleUrl: './map-tools.scss',
  standalone: true
})
export class MapTools {
  boundaryElement = input.required<HTMLElement>();
  currentMode = input(DrawMode.SINGLE);
  modeChange = output<DrawMode>();
  clear = output<void>();
  close = output<boolean>();

  DRAW_MODE = DrawMode;
  mode = this.currentMode();

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
}
