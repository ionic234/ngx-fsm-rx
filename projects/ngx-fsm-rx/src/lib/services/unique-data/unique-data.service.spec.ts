
/*
import { TestBed } from '@angular/core/testing';
import { UniqueDataService } from './unique-data.service';

describe('UniqueDataService', () => {
  let service: UniqueDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UniqueDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});


import { TestBed } from '@angular/core/testing';
import { UniqueCustomEvent, UniqueDataService } from './unique-data.service';

describe('UniqueDataService', () => {
  let service: UniqueDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UniqueDataService],
    });
    service = TestBed.inject(UniqueDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a UID of the specified length', () => {
    const length = 10;
    const uid = service.generateUID(length);
    expect(uid.length).toBe(length);
  });

  it('should generate a non-empty UID if length is not specified', () => {
    const uid = service.generateUID();
    expect(uid.length).toBeGreaterThan(0);
  });

  it('should generate a UniqueCustomEvent object', () => {
    const timestamp: number = 441633600000;
    const customEvent: UniqueCustomEvent = service.generateUniqueCustomEvent();

    //spyOn(Math, 'random').and.returnValue(0.5);
    //spyOn(Date, 'now').and.returnValue(timestamp);

    console.log('Generated custom event:', customEvent);

    expect(customEvent).toEqual({
      timestamp,
      id: "2732e3"
    });
  });

});
*/