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

  private readonly _position = signal<GpsPosition | null>(null);
  private readonly _isTracking = signal(false);

  readonly position = this._position.asReadonly();
  readonly isTracking = this._isTracking.asReadonly();

  startTracking() {
    // guard
    if (this._isTracking() || !('geolocation' in navigator)) {
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this._position.set({
          latlng: L.latLng(pos.coords.latitude, pos.coords.longitude),
          accuracy: pos.coords.accuracy
        });

        // ustawiamy dopiero jak mamy dane
        if (!this._isTracking()) {
          this._isTracking.set(true);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        this.stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
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

  toggle() {
    this._isTracking() ? this.stopTracking() : this.startTracking();
  }
}
