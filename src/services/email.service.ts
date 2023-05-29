import { PersonDetails } from "../models/account-info.model";
import { AppType } from "../models/apptypes.model";
import { email } from "../utils/email";
import { http } from "../utils/http";


export class EmailService {

  public static async sendResetPinEmail(personDetails: PersonDetails, pin: string, appType: AppType): Promise<any> {

    let key : string;
    const category = 'EDI';
    if( appType == AppType.WCS) {
        key = 'W001';
    } else if ( appType == AppType.MRP) {
        key = 'M001';
    } else {
        key = 'C001';
    }

    const message =  {
        Category: category,
        Key: key,
        To: [personDetails.email],
        Cc: ["christopher.albrecht@gdit.com"],
        First: personDetails.firstName,
        Last: personDetails.lastName,
        Pin: pin
    };


    // POST https://b9fkl7egei.execute-api.us-east-1.amazonaws.com/dev/emails -H 'accept: */*' -H 'x-api-key: MuqlyRpR3o7m1hhJu5E4z4FgetGpEogt3eE3fEFp' 
    // '{"Category":"EDI","Key":"W001","From":"DoNotReply@mail.cob.cms.hhs.gov","To":"[chhabilata.gudu@gdit.com]","First":"Chhabi","Last":"Gudu","Pin":"1234"}'
    try {
        const response =  await email.post<any,any>('', message);
        if( response.status == 200) {
            return Promise.resolve();
        } else {
            return Promise.reject()
        }
    
    } catch (err ) {
        return Promise.reject(err);
    }

  }

}

