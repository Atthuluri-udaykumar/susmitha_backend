import { describe, expect, test, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IAuthorisedRepService } from '../../src/services/interfaces/authorised-rep-service.interface';
import { AuthorisedRepService } from '../../src/services/authorised-rep.service';
import { Symbols } from '../../src/utils/types';
import { http } from '../../src/utils/http';

describe('Test AuthrorizedRep Service', () => {
    let container: Container;
    let service: AuthorisedRepService;
    const axiosGetSpy = jest.spyOn(http, 'get');
    
    beforeAll(() => {
        jest.resetModules();

        axiosGetSpy.mockImplementation(async (url) => {
            if (url === '/persons?email=123@abc.com') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                            prsnId: 1234,
                            prsn1stName: 'John',
                            prsnMdlInitlName: 'William',
                            prsnLastName: 'Doe',
                            birthDt: '01/01/1988',
                            jobTitleDesc: '',
                            emailAdr: '123@abc.com',
                            telNum: '800-555-5678',
                            faxNum: '',
                            line1Adr: '123 main st.',
                            line2Adr: '',
                            cityName: 'austin',
                            stateId: 0,
                            zip5Cd: '78701',
                            zipPlus4Cd: '',
                            loginId: 'abc123',
                            vldtnStusId: 1,
                            ssn: '',
                            recAddTs: '',
                            recAddUserName: '',
                            recUpdtTs: '',
                            recUpdtUserName: '',
                            lastLoginTs: '01/01/2021 11:10 AM',
                            wcsRoleId: 0,
                            faildLoginCnt: 0,
                            faildLoginTs: '',
                            mrpRoleId: 0,
                            ghpRoleId: 0,
                            adSw: 'Y',
                            }
                        ]
                    }
                });
            } else if (url === '/persons/1234/rre') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            { rrePrsnId: 123, roleId: 3 },
                            { rrePrsnId: 456, roleId: 3 },
                        ]
                    }
                });
            }
          });        
    });

    afterAll(() => {
        axiosGetSpy.mockRestore();
    });

    beforeEach(() => {
        container = new Container();
        container.bind<IAuthorisedRepService>(Symbols.IPersonInfoService).to(AuthorisedRepService);

        service = container.resolve( AuthorisedRepService);

    });

    test('Service should initialize successfully', () => {
        expect(service).toBeDefined();
    });

    test('Service should return valid response', async () => {
        let result = await service.findRrePerson("123@abc.com");
       
        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    
});

