import {DestroyRef, inject, Injectable} from '@angular/core';
import L, {circle, Map as MapLeaf, map} from 'leaflet';
import {MapLayerService} from './map-layer.service';
import {CoverageService} from '../coverage-service';
import {StreetsService} from '../streets.service';
import {AreaService} from '../area.service';

@Injectable({providedIn: 'root'})
export class MapCoreService {
  private readonly layerService = inject(MapLayerService);
  private readonly coverageService = inject(CoverageService);
  private readonly streetsService = inject(StreetsService);
  private readonly areaService = inject(AreaService);
  private readonly destroyRef = inject(DestroyRef);

  private map!: MapLeaf;

  initMap(center: [number, number], zoom: number): MapLeaf {
    this.map = map('map').setView(center, zoom);
    this.layerService.init(this.map);
    this.addHomeCircle(center);

    // wczytanie danych na start
    // forkJoin({
    //   streets: this.streetsService.loadStreets(),
    //   coverage: this.coverageService.loadCoverage()
    // })
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(({ streets, coverage }) => {
    //     this.layerService.loadStreetsWithCoverage(streets, coverage);
    //   });

    this.areaService.generateStreetRegions();
    // this.areaService.regionsList().forEach(r => r.polygon.addTo(this.map));
    this.areaService.regionsList().forEach(r => {
      const layer = this.layerService.getLayer('covered');
      layer.addLayer(r.polygon);
    });

    return this.map;
  }

  getMap() {
    return this.map;
  }

  private addHomeCircle(center: [number, number]): void {
    circle(center, {
      color: '#f03',
      fillColor: '#f03',
      fillOpacity: 0.1,
      radius: 30,
    }).addTo(this.map);
  }
}
