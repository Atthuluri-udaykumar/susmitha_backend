import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IPersonInfoService } from '../../src/services/interfaces/person-info-service.interface';
import { PersonInfoMockService } from '../../src/services/mock/personinfo-mock.service';
import { Symbols } from '../../src/utils/types';

describe('Test PersonInfo Service', () => {

    let container: Container;
    let service: PersonInfoMockService;

    beforeEach(() => {
        container = new Container();
        container.bind<IPersonInfoService>(Symbols.IPersonInfoService).to(PersonInfoMockService);

        service = container.resolve( PersonInfoMockService);

    });

    test('Service should initialize successfully', () => {
        expect(service).toBeDefined();
    });

    test('Service:find should return valid response', async () => {
        let result = await service.find({id: 1234, name: 'MOCKER'},null, "abc123");
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    
    
    test('Service:update should return valid response', async () => {
        let prsnInfo = await service.find({id: 1234, name: 'MOCKER'},null, "abc123");
        let result = await service.update({id: 1234, name: 'MOCKER'}, prsnInfo);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
});

