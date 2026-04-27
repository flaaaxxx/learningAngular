import { Component, AfterViewInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { LocationService, LocationInfo } from '../location-service/location-service';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { DrawMode, MapTools } from "./map-tools/map-tools";
import { WebcamData, WebcamService } from '../webcam-service/webcam-service';
import { Observable, of } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrl: './map.scss',
  imports: [CdkDrag, MapTools, AsyncPipe],
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
  private locationInfo: LocationInfo = { country: '', city: '', address: '', altitude: 0 };

  private firstPoint: L.LatLng | null = null;    // Przechowuje pierwszy kliknięty punkt
  private tempMarkers: L.Marker[] = [];          // Lista markerów pomocniczych
  private lines: L.Polyline[] = [];             // Aktualnie narysowana linia
  private markerData = new Map<L.Marker, LocationInfo>();

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


  activeWebcam: WebcamData | null = null;
  isLoadingCamera = false;

  private handleMapClick(latlng: L.LatLng) {
    this.drawLine(latlng);


    // 2. Szukanie kamery
    this.isLoadingCamera = true;
    this.activeWebcam = null; // Resetujemy poprzednią kamerę

    this.activeWebcam$ = this.webcamService.getNearbyWebcam(latlng.lat, latlng.lng);



    this.webcamService.getNearbyWebcam(latlng.lat, latlng.lng).subscribe(cam => {

      console.log('Otrzymane dane kamery:', cam);
      this.activeWebcam = cam;
      this.isLoadingCamera = false;

      if (!cam) {
        console.log("Brak kamer w promieniu 15km.");
      }
    });


  }

  private createMarker(latlng: L.LatLng): L.Marker {
    const marker = L.marker(latlng).addTo(this.map);

    marker.bindPopup('Szukam adresu...', {
      closeButton: false,     // usuwa przycisk zamykania
      autoPan: false,         // zapobiega automatycznemu przesuwaniu mapy
      offset: L.point(0, -10) // przesuwa popup lekko w górę, aby nie zasłaniał markera
    });

    marker.on('mouseover', () => marker.openPopup());
    marker.on('mouseout', () => marker.closePopup());

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

  private drawLine(latlng: L.LatLng) {
    switch (this.mode) {
      case DrawMode.SINGLE:
        if (this.tempMarkers.length > 1) {
          this.clearAllLines(); // Usuwamy starą linię i markery, jeśli istnieją
        }
        this.drawOneLine(latlng);
        // W trybie SINGLE: pierwszy klik ustawia punkt, drugi go czyści
        if (!this.firstPoint) {
          this.firstPoint = latlng;
        }
        break;
      case DrawMode.CONTINUOUS:
        // Każdy nowy punkt staje się punktem startowym dla kolejnego segmentu
        this.drawOneLine(latlng);
        this.firstPoint = latlng;

        break;
      case DrawMode.STAR:
        this.drawOneLine(latlng);
        // Jeśli firstPoint już istnieje, nie zmieniamy go (zawsze rysuj od pierwszego)
        // Jeśli jest null (pierwszy klik), ustawiamy go
        if (!this.firstPoint) {
          this.firstPoint = latlng;
        }
        break;
    }
  }

  private drawOneLine(latlng: L.LatLng) {
    // 1. Zawsze twórz marker dla klikniętego miejsca
    const marker = this.createMarker(latlng);
    this.loadLocationData(marker, latlng);
    this.tempMarkers.push(marker);

    // 2. Jeśli mamy już punkt odniesienia, rysujemy linię
    if (this.firstPoint) {
      const line = L.polyline([this.firstPoint, latlng], {
        color: '#58a6ff',
        weight: 4,
        opacity: 0.8,
        dashArray: this.mode === DrawMode.SINGLE ? '10, 10' : '5, 5'
      }).addTo(this.map);

      this.lines.push(line);
    }
  }



  // private handlePointSelection(latlng: L.LatLng) {
  //   if (!this.firstPoint) {
  //     // KROK 1: Zaznaczenie pierwszego punktu

  //     if (this.mode === DrawMode.SINGLE) {
  //       this.clearAllLines(); // Usuwamy starą linię i markery, jeśli istnieją
  //     }

  //     this.firstPoint = latlng;
  //     const marker = L.marker(latlng, { title: 'Punkt startowy' }).addTo(this.map);
  //     this.tempMarkers.push(marker);

  //     console.log('Zaznaczono pierwszy punkt. Kliknij drugi raz, aby narysować linię.');
  //   } else {
  //     // KROK 2: Zaznaczenie drugiego punktu i rysowanie linii
  //     const secondPoint = latlng;
  //     const marker = L.marker(secondPoint, { title: 'Punkt końcowy' }).addTo(this.map);
  //     this.tempMarkers.push(marker);

  //     // Rysowanie linii prostej między punktami
  //     const pointList = [this.firstPoint, secondPoint];

  //     const currentLine = L.polyline(pointList, {
  //       color: '#58a6ff',
  //       weight: 4,
  //       opacity: 0.8,
  //       dashArray: '10, 10'// linia przerywana
  //     }).addTo(this.map);

  //     this.lines.push(currentLine);

  //     // Dopasowanie widoku mapy, aby obiekt był widoczny
  //     //this.map.fitBounds(currentLine.getBounds(), { padding: [200, 200] });

  //     console.log('Linia narysowana!');

  //     // Resetujemy pierwszy punkt, aby można było zacząć nową linię
  //     this.firstPoint = null;
  //   }
  // }

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