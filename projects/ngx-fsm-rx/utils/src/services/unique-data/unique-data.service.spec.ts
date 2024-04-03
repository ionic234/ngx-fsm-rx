

import { TestBed } from '@angular/core/testing';
import { UniqueDataService } from './unique-data.service';

describe('UniqueDataService', () => {
  let service: UniqueDataService;
  const uuid: `${string}-${string}-${string}-${string}-${string}` = "502910c1-e1b0-454d-8fc7-053ec0e583d3";

  beforeEach(() => {
    TestBed.configureTestingModule({});
    spyOn(crypto, 'randomUUID').and.returnValue(uuid);
    service = TestBed.inject(UniqueDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return a UUID', () => {
    expect(service.generateUUID()).toEqual(uuid);
  });

  it('Should generate UniqueCustomData', () => {
    let data = "someData";
    expect(service.generateUniqueCustomData(data)).toEqual({
      uuid,
      data
    });
  });

});
