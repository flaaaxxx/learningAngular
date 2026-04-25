import { Component, AfterViewInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { LocationService } from '../location-service/location-service';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrl: './map.scss'
})
export default class MapComponent implements AfterViewInit {

  private center: [number, number] = [52.1606959, 22.2487434];
  private zoomStart = 15;
  private locationService = inject(LocationService);

  ngAfterViewInit(): void {
    const map = L.map('map').setView(this.center, this.zoomStart);
    const marker = L.marker(this.center).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 22
    }).addTo(map);

    marker.bindPopup(this.getPopupContent(map.getZoom()))
      .openPopup();


    // 1. Stwórz jeden uniwersalny popup
    const popup = L.popup();

    // 2. Dodaj obsługę kliknięcia na mapie
    // map.on('click', async (e: L.LeafletMouseEvent) => {
    //   const { lat, lng } = e.latlng;

    //   // Pokaż popup z informacją "Ładowanie..."
    //   const tempPopup = L.popup()
    //     .setLatLng(e.latlng)
    //     .setContent('Ładowanie adresu...')
    //     .openOn(map);

    //   try {
    //     const data = await this.getAddress(lat, lng);
    //     const address = data.address;

    //     // Budujemy czytelną treść dymka
    //     const street = address.road || 'Brak nazwy ulicy';
    //     const houseNumber = address.house_number || '';
    //     const city = address.city || address.town || address.village || '';
    //     const postcode = address.postcode || '';

    //     const content = `
    //       <div class="popup-address">
    //         <b style="color: #d32f2f;">📍 Adres:</b><br>
    //         ${street} ${houseNumber}<br>
    //         ${postcode} ${city}<br>
    //         <hr>
    //         <small>Współrzędne: ${lat.toFixed(5)}, ${lng.toFixed(5)}</small>
    //       </div>
    //     `;

    //     tempPopup.setContent(content);
    //   } catch (error) {
    //     tempPopup.setContent('Błąd podczas pobierania adresu.');
    //     console.error(error);
    //   }
    // });


    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // 1. Ustawiamy pustą wartość/loader od razu
      popup .setLatLng(e.latlng)
            .setContent('Szukam adresu...')
            .openOn(map);

      this.locationService.getLocationData(lat, lng)
        .subscribe({
          next: (info) => {
            const content = `
              <div style="font-family: Arial, sans-serif;">
                <b style="color: #2c3e50;">${info.country}</b>, ${info.city}<br>
                <span style="color: #7f8c8d;">${info.address}</span>
                <hr style="margin: 5px 0;">
                <small>Wysokość: <b>${info.altitude} m n.p.m.</b></small>
              </div>
            `;
            popup.setContent(content);
          },
          error: () => popup.setContent('Błąd pobierania danych.')
        });
    });


    // nasłuchiwanie zmian zoomu
    map.on('zoomend', () => {
      marker.setPopupContent(this.getPopupContent(map.getZoom()));
      // Opcjonalnie: otwórz go ponownie, jeśli chcesz, by zawsze był widoczny
      if (!marker.isPopupOpen()) {
        marker.openPopup();
      }
    });


    var circle = L.circle(this.center, {
      color: '#f03',
      fillColor: '#f03',
      fillOpacity: 0.1,
      radius: 30
    }).addTo(map);
  }

  private getPopupContent(currentZoom: number): string {
    return `
    <div class="popup">
      <div class="title">Siedlce</div>

      <div class="coords">
        <strong>Współrzędne:</strong><br>
        52.1677, 22.2902
      </div>

      <div class="extra">
        <strong>Zoom:</strong> ${currentZoom}<br>
        <strong>Czas:</strong> ${new Date().toLocaleTimeString()}
      </div>
      
    </div>
  `;
  }

  private async getAddress(lat: number, lng: number): Promise<any> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'pl' // Chcemy nazwy po polsku
      }
    });
    return await response.json();
  }
}