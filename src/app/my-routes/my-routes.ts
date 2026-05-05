import {AfterViewInit, Component} from '@angular/core';
import L from 'leaflet';
import {DatePipe, NgForOf} from '@angular/common';

@Component({
  selector: 'app-my-routes',
  imports: [
    NgForOf,
    DatePipe
  ],
  templateUrl: './my-routes.html',
  styleUrl: './my-routes.scss',
})
export default class MyRoutes implements AfterViewInit{

  routes = [
    {
      id: 1,
      date: new Date(),
      distance: 5.2,
      duration: '00:25:10',
      points: 120,
      path: [
        [52.16, 22.24],
        [52.161, 22.241],
        [52.162, 22.242],
      ]
    },
    {
      id: 2,
      date: new Date(),
      distance: 5.3,
      duration: '00:25:10',
      points: 120,
      path: [
        [52.16, 22.24],
        [52.161, 22.241],
        [52.162, 22.242],
      ]
    },
    {
      id: 3,
      date: new Date(),
      distance: 54.2,
      duration: '00:15:10',
      points: 120,
      path: [
        [52.16, 22.24],
        [52.161, 22.241],
        [52.162, 22.242],
      ]
    }
  ];

  private startX = 0;
  private currentX = 0;

  onPointerDown(event: PointerEvent) {
    this.startX = event.clientX;
  }

  onPointerMove(event: PointerEvent, route: any) {
    this.currentX = event.clientX;
    const diff = this.currentX - this.startX;

    const el = event.currentTarget as HTMLElement;

    if (diff < 0) {
      el.style.transform = `translateX(${diff}px)`;
    }
  }

  onPointerUp(route: any) {
    const diff = this.currentX - this.startX;

    if (diff < -80) {
      // this.delete(route); // 🔥 swipe delete
    } else {
      // wróć na miejsce
      const el = document.querySelector(`[id="map-${route.id}"]`)?.parentElement;
      if (el) el.style.transform = `translateX(0)`;
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMiniMaps(), 0);
  }

  initMiniMaps() {
    this.routes.forEach(route => {
      const map = L.map('map-' + route.id, {
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

      const latlngs = route.path.map(p => L.latLng(p[0], p[1]));

      const poly = L.polyline(latlngs, { color: '#4fd1c5' }).addTo(map);

      map.fitBounds(poly.getBounds());
    });
  }

}
