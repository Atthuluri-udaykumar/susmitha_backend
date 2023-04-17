/*
 * Created on 2022-12-08 ( Time 13:18:11 )
 * Generated by Telosys Tools Generator ( version 3.3.0 )
 */
import { describe, expect, test, beforeEach } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IBulletinBoardService } from '../../src/services/interfaces/bulletinboard-service.interface';
import { BulletinBoardService } from '../../src/services/bulletinboard-service';
import { Symbols } from '../../src/utils/types';
import { IBulletinBoardRepository } from '../../src/repositories/interfaces/bulletinboard-repository.interface';
import { BulletinBoardRepositoryMock } from '../../__mocks__/respositories/bulletinboard-respository.mock';
import { User } from '../../src/types/custom';



describe('Test BulletinBoard Service', () => {

    let container: Container;
    let service: BulletinBoardService;
    const testRecord = [ {application: 'test', message:'test message' }, {application:'test', message:''}];

    beforeEach(() => {
        container = new Container();
        container.bind<IBulletinBoardRepository>(Symbols.IBulletinBoardRepository).to(BulletinBoardRepositoryMock);
        container.bind<IBulletinBoardService>(Symbols.IBulletinBoardService).to(BulletinBoardService);

        service = container.resolve( BulletinBoardService);

    });

    test('Service should initialize successfully', () => {
        expect(service).toBeDefined();
    });

    test('Service should return latest messages', async () => {
  
       let result = await service.getLatestMessages();
       
       expect(service).toBeDefined();
       expect(result).toBeDefined();
       expect(Array.isArray(result)).toEqual(true);
       expect(result[0]).toBeTruthy();
    //    expect(result[0].ediCntntAuthedDt).toEqual(mockBulletinBoard.ediCntntAuthedDt);
        
    });

    test('Update message', async () => {
        const user: User = {id: 0, name: ''};
        await service.updateMessages(user, testRecord);
        
        expect(service).toBeDefined();
     });
 


});

