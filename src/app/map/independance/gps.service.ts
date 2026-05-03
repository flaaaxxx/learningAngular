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
  private simulationInterval: any = null;
  private isSimulating = false;

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
    // this._isTracking() ? this.stopTracking() : this.startTracking();
    this._isTracking() ? this.stopSimulation() : this.startSimulationSouth();
  }

  startSimulationSouth() {
    if (this.isSimulating) return;

    this.stopTracking(); // wyłącz prawdziwy GPS

    this.isSimulating = true;
    this._isTracking.set(true);

    let lat = 52.1606959;
    let lng = 22.2487434;

    const STEP = 0.0002; // ~20–25 metrów na sekundę

    this.simulationInterval = setInterval(() => {
      lat -= STEP; // 🔥 ruch na południe (w dół mapy)

      this._position.set({
        latlng: L.latLng(lat, lng),
        accuracy: 5
      });
    }, 1000);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    this._isTracking.set(false);
    this._position.set(null);
  }
}
