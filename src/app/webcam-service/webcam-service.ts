import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { map, Observable, catchError, of } from 'rxjs';

export interface WebcamData {
  title: string;
  image: string;
  city?: string;
  url: string;
  playerUrl: SafeResourceUrl | null; 
}

@Injectable({ providedIn: 'root' })
export class WebcamService {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  // KLUCZOWE: Poprawny endpoint v3 z dokumentacji
  private readonly BASE_URL = 'https://api.windy.com/webcams/api/v3/webcams';
  private readonly API_KEY = 'UfeaAAoc0QociTQDLDCyMKrMtrMqdsA1';

  // getNearbyWebcam(lat: number, lng: number): Observable<any> {
  //   const headers = new HttpHeaders().set('x-windy-api-key', this.API_KEY);

  //   // HARDCODED: Współrzędne Wielkiej Piramidy w Gizie
  //   const fixedLat = 29.9792;
  //   const fixedLng = 31.1342;
  //   const radius = 50; // Zwiększony promień dla pewności

  //   const params = new HttpParams()
  //     // .set('nearby', `${fixedLat},${fixedLng},${radius}`)
  //     .set('include', 'images,location,player')
  //     .set('limit', '1');

  //   console.log('Testowanie kamery dla Gizy...');

  //   return this.http.get<any>(this.BASE_URL, { headers, params }).pipe(
  //     map(res => {
  //       // Sprawdzamy czy tablica webcams istnieje i ma elementy
  //       if (res && res.webcams && res.webcams.length > 0) {
  //         const cam = res.webcams[0];

  //         return {
  //           title: cam.title || 'Widok z kamery',
  //           // Dokładna ścieżka z Twojego JSON-a: images.current.preview
  //           image: cam.images?.current?.preview || cam.images?.current?.thumbnail || '',
  //           city: cam.location?.city || cam.location?.region || 'Nieznana lokalizacja',
  //           url: `https://www.windy.com/webcams/${cam.webcamId}` // Windy v3 często tak konstruuje linki
  //         };
  //       }
  //       return null;
  //     }),
  //     catchError(err => {
  //       console.error('Błąd Windy API:', err);
  //       return of(null);
  //     })
  //   );
  // }

  getNearbyWebcam(lat: number, lng: number): Observable<any> {
    const headers = new HttpHeaders().set('x-windy-api-key', this.API_KEY);

    // HARDCODED: Współrzędne Wielkiej Piramidy w Gizie
    const fixedLat = 29.9792;
    const fixedLng = 31.1342;
    const radius = 50; // Zwiększony promień dla pewności

    const params = new HttpParams()
      // .set('nearby', `${fixedLat},${fixedLng},${radius}`)
      .set('include', 'images,location,player')
      .set('limit', '1');

    console.log('Testowanie kamery dla Gizy...');

    return this.http.get<any>(this.BASE_URL, { headers, params }).pipe(
      map(res => {
        // Sprawdzamy czy tablica webcams istnieje i ma elementy
        if (res && res.webcams && res.webcams.length > 0) {
          const cam = res.webcams[0];

          return {
            title: cam.title,
            image: cam.images.current.preview,
            // Pobieramy widok z całego dnia ("day") i "czyścimy" link dla Angulara
            playerUrl: cam.player?.day
              ? this.sanitizer.bypassSecurityTrustResourceUrl(cam.player.day)
              : null,
            city: cam.location?.city || 'Giza'
          };
        }
        return null;
      }),
      catchError(err => {
        console.error('Błąd Windy API:', err);
        return of(null);
      })
    );
  }
}