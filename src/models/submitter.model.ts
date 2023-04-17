export class Submitter {
  public systemIndicator = '';
  public role= '';
  public id = 0;
  public name= '';
  public status= '';
  //not in db
  public appName? = '';
  public roleName? = '';
  public acctStatusName? = '';

  static getAppName(systemIndicator: any): string {
    switch(systemIndicator){
      case 'W': return 'WCS';
      case 'M': return 'MRP';
      case 'G': return 'CRCP';
      default: return 'Section 111 MRA';//default
    }
  }

  static getRoleName(role: any): string {
    switch(role){
      case 'AM': return 'Account Manager';
      case 'AD': return 'Designee';
      case 'AR': return 'Account Representative';
      default: return '';//default
    }
  }

  static getAcctStatusName(status: any, systemIndicator: any): string {
    switch(status){
      case 'A': return 'Active'; 
      case 'I': return 'Initial Setup'; 
      case 'S': return 'Setup'; 
      case 'M': return 'Mailed'; 
      case 'L': return 'Locked'; 
      case 'T': return 'Testing'; 
      case 'C': return 'Discontinued'; 
      case 'P': {
        if(systemIndicator && systemIndicator === 'S'){
          return 'Production'; 
        } else {
          return 'Pending'; 
        }
        
      }
      case 'D': 
      default:   return ''; 
    }
  }
}
