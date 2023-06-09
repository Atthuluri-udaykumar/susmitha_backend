/*
 * Created on 2022-12-08 ( Time 13:18:11 )
 * Generated by Telosys Tools Generator ( version 3.3.0 )
 */
import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IBulletinBoardController } from '../../src/controllers/interfaces/bulletinboard-controller.interface';
import { BulletinBoardController } from '../../src/controllers/bulletinboard.controller';
import { IBulletinBoardService } from '../../src/services/interfaces/bulletinboard-service.interface';
import { BulletinBoardService } from '../../src/services/bulletinboard-service';
import { BulletinBoardRouter } from '../../src/routes/bulletinboard.router';
import { Symbols } from '../../src/utils/types';
import { IBulletinBoardRepository } from '../../src/repositories/interfaces/bulletinboard-repository.interface';
import { BulletinBoardRepositoryMock } from '../../__mocks__/respositories/bulletinboard-respository.mock';



describe('Test BulletinBoard Router', () => {

    let container: Container;
    let router: BulletinBoardRouter;
    const testRecord = [ {application: 'test', message:'test message' }, {application:'test', message:''}];

    beforeEach(() => {
        container = new Container();
        container.bind<IBulletinBoardRepository>(Symbols.IBulletinBoardRepository).to(BulletinBoardRepositoryMock);
        container.bind<IBulletinBoardService>(Symbols.IBulletinBoardService).to(BulletinBoardService);
        container.bind<IBulletinBoardController>(Symbols.IBulletinBoardController).to(BulletinBoardController);
        container.bind<BulletinBoardRouter>(BulletinBoardRouter).to(BulletinBoardRouter);
		
		router = container.resolve(BulletinBoardRouter);
    });

    test('Routes should initialize successfully', () => {
        expect(router.router.stack.length > 0).toBeTruthy();
    });

    test('validateBulletinBoardMessages should throw error message when it receives an invalid object', () => {
        expect(() => {
            router.validateBulletinBoardMessages({ someProperty: 'value' });
        }).toThrowError();
    });

    test('validateBulletinBoardMessages should return true when it receives a valid object', () => {
        expect(router.validateBulletinBoardMessages(testRecord)).toBeTruthy();
    });


});

