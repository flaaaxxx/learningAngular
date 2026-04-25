import { Component, AfterViewInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { map } from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrl: './map.scss'
})
export default class MapComponent implements AfterViewInit {

  private center: [number, number] = [52.1606959, 22.2487434];
  private zoomStart = 15;
  private http = inject(HttpClient);

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
      popup
        .setLatLng(e.latlng)
        .setContent('Szukam adresu...')
        .openOn(map);

      // 2. Wysyłamy żądanie przez HttpClient (Observable)
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

      this.http.get<any>(url, { headers: { 'Accept-Language': 'pl' } })
        .subscribe({
          next: (data) => {
            // 3. Gdy dane przyjdą (strumień się "odezwie"), uaktualniamy treść
            const street = data.address?.road || 'Brak nazwy ulicy';
            const houseNumber = data.address?.house_number || '';

            popup.setContent(`<b>Adres:</b><br>${street} ${houseNumber}`);
          },
          error: (err) => {
            // 4. Jeśli wystąpi błąd (np. brak internetu), uaktualniamy informację
            popup.setContent('Nie udało się pobrać adresu.');
            console.error(err);
          }
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