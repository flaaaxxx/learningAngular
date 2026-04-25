import { Component, AfterViewInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { LocationService, LocationInfo } from '../location-service/location-service';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrl: './map.scss'
})
export default class MapComponent implements AfterViewInit {

  isMapFull = false;

  private map!: L.Map;
  private center: [number, number] = [52.1606959, 22.2487434];
  private zoomStart = 15;
  private locationService = inject(LocationService);
  private locationInfo: LocationInfo = { country: '', city: '', address: '', altitude: 0 };

  ngAfterViewInit(): void {
    this.map = L.map('map').setView(this.center, this.zoomStart);

    const popup = L.popup();
    var marker: L.Marker;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 22
    }).addTo(this.map);

    // marker.bindPopup(this.getPopupContent(map.getZoom()))
    //   .openPopup();


    // 1. Stwórz jeden uniwersalny popup

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // L.marker([lat, lng]).addTo(map);

      if (marker) {
        marker.setLatLng(e.latlng); // Przesuń istniejący
      } else {
        marker = L.marker(e.latlng).addTo(this.map); // Stwórz pierwszy
      }

      popup.setLatLng(e.latlng)
        .setContent('Szukam adresu...')
        .openOn(this.map);

      this.locationService.getLocationData(lat, lng)
        .subscribe({
          next: (info) => {
            this.locationInfo = info;
            popup.setContent(this.setContent(this.locationInfo, this.zoomStart));
          },
          error: () => popup.setContent('Błąd pobierania danych.')
        });
    });

    // nasłuchiwanie zmian zoomu
    this.map.on('zoomend', () => {
      this.zoomStart = this.map.getZoom();
      console.log('Aktualny zoom:', this.zoomStart);
      popup.setContent(this.setContent(this.locationInfo, this.zoomStart));
    });


    var circle = L.circle(this.center, {
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
        <span style="color: #7f8c8d;">${info.address}</span>
        <hr style="margin: 5px 0;">
        <small>Wysokość: <b>${info.altitude} m n.p.m.</b></small>
        <hr style="margin: 5px 0;">
        <div class="extra">
          <strong>Zoom:</strong> ${currentZoom}<br>
          <strong>Czas:</strong> ${new Date().toLocaleTimeString()}
        </div>
      </div>
    `;
  }
}