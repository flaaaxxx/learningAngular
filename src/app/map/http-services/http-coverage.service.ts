import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

export interface CoverageDto {
  visitedRegionId: string;
}

@Injectable({
  providedIn: 'root',
})
export class HttpCoverageService {
  private readonly http = inject(HttpClient);
  private readonly ALL_COVERED_PENTAGON_URL = 'http://localhost:3001/coverage';
  private readonly API_URL = 'http://localhost:3002/custom-area';

  saveCoverage(dto: CoverageDto) {
    return this.http.post(this.ALL_COVERED_PENTAGON_URL, dto);
  }

  /**
   * – metoda POST do /custom-areas.
   * @param polygon
   */
  saveCustomArea(polygon: any) {
    return this.http.post(this.API_URL, polygon);
  }

  /**
   * Pobiera listę wszystkich zapisanych obszarów.
   */
  getCustomAreas(){
    return this.http.get(this.API_URL);
  }

  /**
   * Usuwa wskazany obszar.
   * @param id
   */
  deleteCustomArea(id: string) {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
