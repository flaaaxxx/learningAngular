import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  isMapFull = signal(false);

  toggleMap() {
    this.isMapFull.update(v => !v);
  }
}