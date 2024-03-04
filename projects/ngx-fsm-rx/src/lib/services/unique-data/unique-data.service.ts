
/*eslint-disable*/
import { Injectable } from '@angular/core';

export interface UniqueCustomData<T = void> {
  timestamp: number,
  id: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class UniqueDataService {

  constructor() { }

  public generateUID(): string {
    return crypto.randomUUID();
  }

  public generateUniqueCustomData<T>(data?: T): UniqueCustomData<T> {
    return {
      timestamp: Date.now(),
      id: this.generateUID(),
      data
    };
  }
}