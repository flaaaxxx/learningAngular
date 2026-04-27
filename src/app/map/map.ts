import { AfterViewInit, Component, inject } from '@angular/core';
import * as L from 'leaflet';
import { LocationInfo, LocationService } from '../location-service/location-service';
import { DrawMode, MapTools } from './map-tools/map-tools';
import { WebcamData, WebcamService } from '../webcam-service/webcam-service';
import { Observable, of } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrl: './map.scss',
  imports: [MapTools, AsyncPipe]
})
export default class MapComponent implements AfterViewInit {

  private webcamService = inject(WebcamService);
  activeWebcam$: Observable<WebcamData | null> = of(null);

  isMapFull = false;
  mode: DrawMode = DrawMode.SINGLE;
  isPanelVisible = false; // Panel domyślnie ukryty

  private map!: L.Map;
  private homeCooridantes: [number, number] = [52.1606959, 22.2487434];
  private zoomStart = 15;
  private locationService = inject(LocationService);
  private firstPoint: L.LatLng | null = null;    // Przechowuje pierwszy kliknięty punkt
  private tempMarkers: L.Marker[] = [];          // Lista markerów pomocniczych
  private lines: L.Polyline[] = [];             // Aktualnie narysowana linia
  private markerData = new Map<L.Marker, LocationInfo>();

  activeWebcam: WebcamData | null = null;
  isLoadingCamera = false;

  defaultMarkerIndicatorIcon = L.icon({
    iconUrl: 'map/markerIcon2x.png',
    shadowUrl: 'map/markerShadow2ng',

    iconSize: [25, 41],    // rozmiar z dokumentacji domyślnej ikony
    iconAnchor: [12, 41],  // punkt "szpilki", który dotyka mapy
    popupAnchor: [1, -34], // skąd ma wychodzić dymek
    shadowSize: [0, 0],   // rozmiar cienia
  });

  ngAfterViewInit() {
    this.initMap();
    this.setupMapClickListener();
    this.setupZoomListener();
    this.addHomeCircle();
  }

  setMode(newMode: DrawMode) {
    this.mode = newMode;
    this.clearAllLines(); // Resetujemy przy zmianie trybu
  }

  clearAllLines() {
    // 1. Usuń wszystkie linie
    this.lines.forEach(line => {
      this.map.removeLayer(line);
    });
    this.lines = [];

    // 2. Usuń markery
    this.tempMarkers.forEach(marker => {
      this.map.removeLayer(marker);
      this.markerData.delete(marker);
    });
    this.tempMarkers = [];

    // 3. Reset punktu
    this.firstPoint = null;
  }

  toggleePanel() {
    this.isPanelVisible = !this.isPanelVisible;
  }

  private initMap() {
    this.map = L.map('map').setView(this.homeCooridantes, this.zoomStart);

    // L.Marker.prototype.options.icon = this.defaultMarkerIndicatorIcon;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20
    }).addTo(this.map);
  }

  private setupMapClickListener() {
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.handleMapClick(e.latlng);
    });
  }

  private handleMapClick(latlng: L.LatLng) {
    switch (this.mode) {
      case DrawMode.SINGLE: this.drawSingleMode(latlng); break;
      case DrawMode.CONTINUOUS: this.drawContinuousMode(latlng); break;
      case DrawMode.STAR: this.drawStarMode(latlng); break;
      case DrawMode.MANY_POINTS: this.drawManyPointsMode(latlng); break;
    }


    //   // 2. Szukanie kamery
    //   // this.isLoadingCamera = true;
    //   // this.activeWebcam = null; // Resetujemy poprzednią kamerę

    //   // this.activeWebcam$ = this.webcamService.getNearbyWebcam(latlng.lat, latlng.lng);


    //   // this.webcamService.getNearbyWebcam(latlng.lat, latlng.lng).subscribe(cam => {

    //   //   console.log('Otrzymane dane kamery:', cam);
    //   //   this.activeWebcam = cam;
    //   //   this.isLoadingCamera = false;

    //   //   if (!cam) {
    //   //     console.log('Brak kamer w promieniu 15km.');
    //   //   }
    //   // });
  }

  // --- STRATEGIE RYSOWANIA ---

  private drawSingleMode(latlng: L.LatLng) {
    if (this.tempMarkers.length >= 2) this.clearAllLines();

    const marker = this.initMarkerWithData(latlng);

    if (this.firstPoint) {
      this.createConnectedLine(this.tempMarkers[0], marker, 'SINGLE');
      this.firstPoint = null;
    } else {
      this.firstPoint = latlng;
    }
  }

  private drawContinuousMode(latlng: L.LatLng) {
    const marker = this.initMarkerWithData(latlng);

    if (this.firstPoint) {
      const prevMarker = this.tempMarkers[this.tempMarkers.length - 2];
      this.createConnectedLine(prevMarker, marker, 'CONTINUOUS');
    }
    this.firstPoint = latlng;
  }

  private drawStarMode(latlng: L.LatLng) {
    const marker = this.initMarkerWithData(latlng);

    if (!this.firstPoint) {
      this.firstPoint = latlng;
    } else {
      const centerMarker = this.tempMarkers[0];
      this.createConnectedLine(centerMarker, marker, 'STAR');
    }
  }

  private drawManyPointsMode(latlng: L.LatLng) {
    const marker = this.initMarkerWithData(latlng);

    if (this.firstPoint) {
      const prevMarker = this.tempMarkers[this.tempMarkers.length - 2];
      this.createConnectedLine(prevMarker, marker, 'MANY_POINTS');
      this.firstPoint = null;
    } else {
      this.firstPoint = latlng;
    }
  }

  // --- FUNKCJE POMOCNICZE (REUŻYWALNE) ---

  /** Tworzy marker, ładuje dane i dodaje do rejestru */
  private initMarkerWithData(latlng: L.LatLng): L.Marker {
    const marker = this.createMarker(latlng);
    this.loadLocationData(marker, latlng);
    this.tempMarkers.push(marker);
    return marker;
  }

  /** Tworzy linię między dwoma markerami i wiąże ich ruch z jej aktualizacją */
  private createConnectedLine(start: L.Marker, end: L.Marker, type: string): L.Polyline {
    const line = L.polyline([start.getLatLng(), end.getLatLng()], {
      color: '#58a6ff',
      weight: 4,
      opacity: 0.9,
      dashArray: type === 'SINGLE' ? '10, 10' : '0'
    }).addTo(this.map);

    this.lines.push(line);

    // Reakcja na przeciąganie
    const onDrag = () => {
      line.setLatLngs([start.getLatLng(), end.getLatLng()]);
      this.updateLineTooltip(line, start, end, type);
      if (type === 'CONTINUOUS') this.recalculateTotalDistances();
    };

    start.on('drag', onDrag);
    end.on('drag', onDrag);

    // Inicjalne ustawienie tooltipa
    this.updateLineTooltip(line, start, end, type);

    return line;
  }

  /** Zarządza tylko i wyłącznie treścią etykiety */
  private updateLineTooltip(line: L.Polyline, start: L.Marker, end: L.Marker, type: string) {
    const dist = start.getLatLng().distanceTo(end.getLatLng());
    let content = this.formatDistance(dist);

    if (type === 'CONTINUOUS') {
      // W trybie ciągłym przeliczamy sumę (obsługiwane też przez recalculateTotalDistances)
      const runningTotal = this.calculateRunningTotalUntil(line);
      content = `Suma: ${this.formatDistance(runningTotal)}`;
    }

    line.bindTooltip(content, {
      permanent: true,
      direction: 'center',
      className: type === 'CONTINUOUS' ? 'distance-tooltip-total' : 'distance-tooltip'
    }).openTooltip();
  }

  /** Oblicza sumę dystansów do konkretnej linii włącznie */
  private calculateRunningTotalUntil(targetLine: L.Polyline): number {
    let total = 0;
    for (const line of this.lines) {
      const pts = line.getLatLngs() as L.LatLng[];
      total += pts[0].distanceTo(pts[1]);
      if (line === targetLine) break;
    }
    return total;
  }

  private createMarker(latlng: L.LatLng): L.Marker {
    const marker = L.marker(latlng, { icon: this.defaultMarkerIndicatorIcon, draggable: true }).addTo(this.map);

    marker.bindPopup('Szukam adresu...', {
      closeButton: false,     // usuwa przycisk zamykania
      autoPan: false,         // zapobiega automatycznemu przesuwaniu mapy
      offset: L.point(0, -10) // przesuwa popup lekko w górę, aby nie zasłaniał markera
    });

    marker.on('mouseover', () => marker.openPopup());
    marker.on('mouseout', () => marker.closePopup());

    marker.on('dragend', (event) => {
      const newPos = event.target.getLatLng();
      this.loadLocationData(marker, newPos);
      marker.openPopup();
    });

    return marker;
  }

  private loadLocationData(marker: L.Marker, latlng: L.LatLng) {
    this.locationService.getLocationData(latlng.lat, latlng.lng)
      .subscribe({
        next: (info) => {
          this.markerData.set(marker, info);

          marker.setPopupContent(
            this.setContent(info, this.map.getZoom())
          );
        },
        error: () => marker.setPopupContent('Błąd pobierania danych.')
      });
  }

  private setupZoomListener() {
    this.map.on('zoomend', () => {
      this.updatePopupsOnZoom();
    });
  }

  private updatePopupsOnZoom() {
    this.zoomStart = this.map.getZoom();

    this.tempMarkers.forEach(marker => {
      const info = this.markerData.get(marker);

      if (info) {
        marker.setPopupContent(
          this.setContent(info, this.zoomStart)
        );
      }
    });
  }

  private recalculateTotalDistances() {
    let runningTotal = 0;

    this.lines.forEach((line, index) => {
      const latlngs = line.getLatLngs() as L.LatLng[];
      const dist = latlngs[0].distanceTo(latlngs[1]);
      runningTotal += dist;
      line.setTooltipContent(`Suma: ${this.formatDistance(runningTotal)}`);
    });

  }

  private formatDistance(d: number): string {
    return d > 1000
      ? `${(d / 1000).toFixed(2)} km`
      : `${Math.round(d)} m`;
  }

  private addHomeCircle() {
    L.circle(this.homeCooridantes, {
      color: '#f03',
      fillColor: '#f03',
      fillOpacity: 0.1,
      radius: 30
    }).addTo(this.map);
  }

  private setContent(info: LocationInfo, currentZoom: number): string {
    return `
      <div style="font-family: Arial, sans-serif;">
        <b style="color: #2c3e50;">${info.country}</b>, ${info.city}<br>
        <span style="color: #047e87;">${info.address}</span>
        <hr style="margin: 5px 0;">
        <small>Wysokość: <b>${info.altitude} m n.p.m.</b></small>
        <hr style="margin: 5px 0;">
        <div class="extra">
          <strong>Czas znacznika:</strong> ${new Date().toLocaleTimeString()}<br>
          <strong>Zoom:</strong> ${currentZoom}
        </div>
      </div>
    `;
  }
}
