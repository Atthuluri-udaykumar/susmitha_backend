import { PersonInfo } from "../../models/person-info.model";

export interface IAuthorisedRepService {
    findARbyEmail(emailId: string|null): Promise<PersonInfo>;
    findARbyRptrId(rreId: string|null): Promise<PersonInfo>;
}