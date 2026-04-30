import {Component} from '@angular/core';
import {MenuConfigButtons} from '../../share/menu-config-buttons/menu-config-buttons';

@Component({
  selector: 'app-map-menu-config',
  imports: [
    MenuConfigButtons
  ],
  templateUrl: './map-menu-config.html',
  styleUrl: './map-menu-config.scss',
})
export class MapMenuConfig {

  isLoadedCoverage = false;

  loadCoverage() {
    this.isLoadedCoverage = !this.isLoadedCoverage;

    if (this.isLoadedCoverage) {

    } else {

    }

  }

}

