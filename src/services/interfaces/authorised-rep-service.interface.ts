import { PersonInfo } from "../../models/person-info.model";

export interface IAuthorisedRepService {
    findRrePerson(emailId: string|null): Promise<PersonInfo>;
    findReporter(rreId: string|null): Promise<PersonInfo>;
}