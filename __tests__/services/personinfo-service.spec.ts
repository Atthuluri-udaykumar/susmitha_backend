import { describe, expect, test, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IPersonInfoService } from '../../src/services/interfaces/person-info-service.interface';
import { PersonInfoService } from '../../src/services/person-info.service';
import { Symbols } from '../../src/utils/types';
import { http } from '../../src/utils/http';

describe('Test PersonInfo Service', () => {
    let container: Container;
    let service: PersonInfoService;
    const axiosGetSpy = jest.spyOn(http, 'get');
    const axiosPostSpy = jest.spyOn(http, 'post');
    
    beforeAll(() => {
        jest.resetModules();

        axiosGetSpy.mockImplementation(async (url) => {
            //console.log('[prsn-srvc] [GET]= ' + url);
            if ((url === '/persons?loginid=abc123') || (url === '/persons?email=123@abc.com')) {
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
            } else if (url === '/persons/1234/questions') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "prsnId": 10232,
                                "qstnCdId": 1,
                                "qstnAswrTxt": "abcdefgh",
                            },
                            {
                                "prsnId": 10232,
                                "qstnCdId": 12,
                                "qstnAswrTxt":"bumblebee"
                            }
                        ]
                    }
                });
            } else if (url === '/api/v1/submitters/123@abc.com') {
                return Promise.resolve({
                    data: [
                            {
                                "systemIndicator": "G",
                                "role": "AM",
                                "id": 137838,
                                "name": "ACTIVE - LOCAL 328",
                                "status": "A"
                            },
                            {
                                "systemIndicator": "G",
                                "role": "AM",
                                "id": 137898,
                                "name": "GROUP HEALTH INCOPORATED",
                                "status": "A"
                            },
                            {
                                "systemIndicator": "S",
                                "role": "AM",
                                "id": 22703,
                                "name": "TEST CNT TESTING 11",
                                "status": "P"
                            }
                        ]
                });
            } else if (url === '/api/v1/users/get_ar_info/xyz123@ayz.com') {
                return Promise.resolve({
                    data: {
                    "firstName": "First",
                    "middleName": "",
                    "lastName": "Last",
                    "email": "xyz123@ayz.com",
                    "status": "I"
                    }
                });
            }
        });        

        axiosPostSpy.mockImplementation(async (url) => {
            //console.log('[prsn-srvc] [POST]= ' + url);
            if (url === '/api/v1/users/mfa-id-proofing') {
                return Promise.resolve({
                    data: {
                        systemIndicator: '',
                        action: '',
                        personId: '1234',
                        sbmtrId: '',
                        mfaStatus: '',
                        failedCount: '0',
                        referenceNumber: '',
                        failedDate: '',
                        failedReason: null,
                        email: '123@abc.com',
                        mfaStatusDescription: '',
                        mfaStatusDate: '12/05/2022'
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
        container.bind<IPersonInfoService>(Symbols.IPersonInfoService).to(PersonInfoService);

        service = container.resolve( PersonInfoService);

    });

    test('Service should initialize successfully', () => {
        expect(service).toBeDefined();
    });

    test('Service-findByLoginId should return valid response', async () => {
        let result = await service.find({id: 1234, name: 'TESTER'},null, "abc123");
       
        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });

    test('Service-findByEmail should return valid response', async () => {
        let result = await service.find({id: 1234, name: 'TESTER'},"xyz123@ayz.com", "");
       
        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    
    test('Service-idProofAction should return valid response', async () => {
        let prsnInfo = await service.find({id: 1234, name: 'TESTER'},null, "abc123");

        prsnInfo.actionInfo.actionIdProofUser = true;
        let result = await service.update({id: 1234, name: 'MOCKER'}, prsnInfo);

        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    test('Service-restartIdProofAction should return valid response', async () => {
        let prsnInfo = await service.find({id: 1234, name: 'TESTER'},null, "abc123");

        prsnInfo.actionInfo.actionRestartIdProof = true;
        let result = await service.update({id: 1234, name: 'MOCKER'}, prsnInfo);

        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
});

