import { Component, AfterViewInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { LocationService, LocationInfo } from '../location-service/location-service';
import { CdkDrag } from '@angular/cdk/drag-drop';

export type DrawMode = 'single' | 'continuous' | 'star';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrl: './map.scss',
  imports: [CdkDrag],
})
export default class MapComponent implements AfterViewInit {

  isMapFull = false;

  private map!: L.Map;
  private homeCooridantes: [number, number] = [52.1606959, 22.2487434];
  private zoomStart = 15;
  private locationService = inject(LocationService);
  private locationInfo: LocationInfo = { country: '', city: '', address: '', altitude: 0 };

  private firstPoint: L.LatLng | null = null; // Przechowuje pierwszy kliknięty punkt
  private tempMarkers: L.Marker[] = [];       // Lista markerów pomocniczych
  private currentLine: L.Polyline | null = null; // Aktualnie narysowana linia
  mode: DrawMode = 'single';
  isPanelVisible = true; // Panel domyślnie otwarty 

  ngAfterViewInit(): void {
    this.map = L.map('map').setView(this.homeCooridantes, this.zoomStart);

    const popup = L.popup();
    var marker: L.Marker;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 22
    }).addTo(this.map);


    // 1. Stwórz jeden uniwersalny popup
    this.map.on('click', (e: L.LeafletMouseEvent) => {
    
      this.handlePointSelection(e.latlng);
    
      // const { lat, lng } = e.latlng;

      // // L.marker([lat, lng]).addTo(map);

      // if (marker) {
      //   marker.setLatLng([lat, lng]); // Przesuń istniejący
      // } else {
      //   marker = L.marker([lat, lng]).addTo(this.map); // Stwórz pierwszy
      // }

      // popup.setLatLng([lat, lng])
      //      .setContent('Szukam adresu...')
      //      .openOn(this.map);

      // this.locationService.getLocationData(lat, lng)
      //   .subscribe({
      //     next: (info) => {
      //       this.locationInfo = info;
      //       popup.setContent(this.setContent(this.locationInfo, this.zoomStart));
      //     },
      //     error: () => popup.setContent('Błąd pobierania danych.')
      //   });
    });

    // nasłuchiwanie zmian zoomu
    this.map.on('zoomend', () => {
      this.zoomStart = this.map.getZoom();
      console.log('Aktualny zoom:', this.zoomStart);
      popup.setContent(this.setContent(this.locationInfo, this.zoomStart));
    });

   L.circle(this.homeCooridantes, {
      color: '#f03',
      fillColor: '#f03',
      fillOpacity: 0.1,
      radius: 30
    }).addTo(this.map);
  }

  setMode(newMode: DrawMode) {
  this.mode = newMode;
  this.clearPreviousLine(); // Resetujemy przy zmianie trybu
}

  private handlePointSelection(latlng: L.LatLng) {
    if (!this.firstPoint) {
      // KROK 1: Zaznaczenie pierwszego punktu
      // this.clearPreviousLine(); // Opcjonalnie usuwamy starą linię przed nowym rysowaniem
      
      this.firstPoint = latlng;
      const marker = L.marker(latlng, { title: 'Punkt startowy' }).addTo(this.map);
      this.tempMarkers.push(marker);
      
      console.log('Zaznaczono pierwszy punkt. Kliknij drugi raz, aby narysować linię.');
    } else {
      // KROK 2: Zaznaczenie drugiego punktu i rysowanie linii
      const secondPoint = latlng;
      const marker = L.marker(secondPoint, { title: 'Punkt końcowy' }).addTo(this.map);
      this.tempMarkers.push(marker);

      // Rysowanie linii prostej między punktami
      const pointList = [this.firstPoint, secondPoint];
      this.currentLine = L.polyline(pointList, {
        color: '#58a6ff', // Twój kolor primary
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10' // Opcjonalnie: linia przerywana
      }).addTo(this.map);

      // Dopasowanie widoku mapy, aby obiekt był widoczny
      this.map.fitBounds(this.currentLine.getBounds(), { padding: [50, 50] });

      console.log('Linia narysowana!');
      
      // Resetujemy pierwszy punkt, aby można było zacząć nową linię
      this.firstPoint = null; 
    }
  }

  clearPreviousLine() {
    // 1. Usuń linię, jeśli istnieje
    if (this.currentLine) {
      this.map.removeLayer(this.currentLine);
      this.currentLine = null;
    }

    // 2. Usuń wszystkie tymczasowe markery z mapy
    this.tempMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });

    // 3. Wyczyść tablicę markerów
    this.tempMarkers = [];

    // 4. Zresetuj punkt startowy
    this.firstPoint = null;
  }

  togglePanel() {
    this.isPanelVisible = !this.isPanelVisible;
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
          <strong>Czas:</strong> ${new Date().toLocaleTimeString()}<br>
          <strong>Zoom:</strong> ${currentZoom}
        </div>
      </div>
    `;
  }
}