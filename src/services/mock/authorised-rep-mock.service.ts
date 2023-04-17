import { inject, injectable } from 'inversify';
import { PersonInfo } from '../../models/person-info.model';
import { IAuthorisedRepService } from '../interfaces/authorised-rep-service.interface';

@injectable()
export class AuthorisedRepMockService implements IAuthorisedRepService {
  findRrePerson(emailId: string | null): Promise<PersonInfo> {
    const prsnInfo: PersonInfo = new PersonInfo();
    prsnInfo.person = {
      prsnId: 1234,
      prsn1stName: 'John',
      prsnMdlInitlName: 'William',
      prsnLastName: 'Doe',
      birthDt: '01/01/1988',
      jobTitleDesc: '',
      emailAdr: 'john.w.doe@gmail.com',
      telNum: '800-555-5678',
      faxNum: '',
      line1Adr: '123 main st.',
      line2Adr: '',
      cityName: 'austin',
      stateId: 0,
      zip5Cd: '78701',
      zipPlus4Cd: '',
      loginId: 'JA777YA',
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
    };

    prsnInfo.rreList = [
      { rrePrsnId: 123, roleId: 3 },
      { rrePrsnId: 456, roleId: 3 },
      { rrePrsnId: 7890, roleId: 3 },
    ];

    return Promise.resolve(prsnInfo);
  }
  findReporter(rreId: string | null): Promise<PersonInfo> {
    throw new Error('Method not implemented.');
  }
}
