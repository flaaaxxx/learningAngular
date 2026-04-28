import { Injectable, signal } from '@angular/core';
import * as L from 'leaflet';

export interface GpsPosition {
  latlng: L.LatLng;
  accuracy: number;
}

@Injectable({
  providedIn: 'root'
})
export class GpsService {
  private watchId: number | null = null;

  // Prywatne sygnały (stan)
  private _position = signal<GpsPosition | null>(null);
  private _isTracking = signal<boolean>(false);

  // Publiczne sygnały tylko do odczytu (wystawione na zewnątrz)
  public readonly position = this._position.asReadonly();
  public readonly isTracking = this._isTracking.asReadonly();

  startTracking() {
    if (!('geolocation' in navigator)) return;

    this._isTracking.set(true);

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this._position.set({
          latlng: L.latLng(pos.coords.latitude, pos.coords.longitude),
          accuracy: pos.coords.accuracy
        });
      },
      (error) => {
        console.error('GPS Error:', error);
        this.stopTracking();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this._isTracking.set(false);
    this._position.set(null);
  }
}