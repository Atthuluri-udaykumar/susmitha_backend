
import { describe, expect, test, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { createResponse, createRequest } from 'node-mocks-http';
import 'reflect-metadata';

import { Symbols } from '../../src/utils/types';
import { http } from '../../src/utils/http';
import { Container } from 'inversify';
import { AuthorisedRepController } from '../../src/controllers/authorised-rep.controller';
import { AuthorisedRepService } from '../../src/services/authorised-rep.service';
import { IAuthorisedRepService } from '../../src/services/interfaces/authorised-rep-service.interface';

describe('Test AuthorisedRep Controller', () => {
    let container: Container;
    let controller: AuthorisedRepController ;
    let service: AuthorisedRepService;
    const axiosGetSpy = jest.spyOn(http, 'get');
    
    beforeAll(() => {
        jest.resetModules();

        axiosGetSpy.mockImplementation(async (url) => {
            if ((url === '/ar?rreid=abc123') || (url === '/ar?email=123@abc.com')) {
                return Promise.resolve({
                    data: [
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
                        rreid: 'abc123',
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
                });
            } else if (url === '/ar/1234/questions') {
                return Promise.resolve({data: [
                    {
                        "prsnId": 10232,
                        "qstnCdId": 1,
                        "qstnAswrTxt": "abcdefgh"
                    },
                    {
                        "prsnId": 10232,
                        "qstnCdId": 12,
                        "qstnAswrTxt":"bumblebee"
                    }
                ]});
            } else if (url === '/ar/1234/rre') {
                return Promise.resolve({
                    data: [
                    { rrePrsnId: 123, roleId: 3 },
                    { rrePrsnId: 456, roleId: 3 },
                ]});
            } else if (url === '/ar?rreid=multiple') {
                return Promise.resolve({
                    data: [
                        {
                        prsnId: 123485,
                        prsn1stName: 'John1',
                        prsnMdlInitlName: 'William',
                        prsnLastName: 'Doe1',
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
                        rreid: 'abc123',
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
                        },
                        {
                        prsnId: 985443,
                        prsn1stName: 'John2',
                        prsnMdlInitlName: 'William',
                        prsnLastName: 'Doe2',
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
                        rreid: 'abc123',
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
                });
            } else if (url === '/ar?email=iam@dummy.com') {
                return Promise.resolve({data: []});
            } else if (url === '/ar?rreid=boom') {
                throw 'test exception!';
            }

          });        
    });

    afterAll(() => {
        axiosGetSpy.mockRestore();
    });

    beforeEach(() => {
        container = new Container();
        container.bind<IAuthorisedRepService>(Symbols.IAuthorisedRepService).to(AuthorisedRepService);
        service = container.resolve( AuthorisedRepService);
        controller = new AuthorisedRepController(service);
    });

    /*test('Test with only rreid', async () => {
        const request = createRequest({ query: { rreid: "abc123"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });*/
    test('Test with only email', async () => {
        const request = createRequest({ query: { email: "123@abc.com"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test with email not found', async () => {
        const request = createRequest({ query: { email: "iam@dummy.com"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    }); 
    test('Test without rreid or email', async () => {
        const request = createRequest({ query: {} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(400);
        expect(response.json).toBeDefined();
    });
    /*test('Test not unique', async () => {
        const request = createRequest({ query: { rreid: "multiple"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });*/
    test('Test exception', async () => {
        const request = createRequest({ query: { rreid: "boom"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
  
});



