import { injectable } from 'inversify';
import { MirPrsn } from '../models/mir-prsn.model';
import { MirPrsnQstn } from '../models/mir-prsn-qstn.model';
import { MraDataResolverService } from './mra-data-resolver-service';
import { IPersonInfoService } from './interfaces/person-info-service.interface';
import { PersonInfo } from '../models/person-info.model';
import { Task } from '../models/task/task.model';
import { TaskTree } from '../models/task/task-tree.model';
import { TaskRequest } from '../models/task/task-request.model';
import { TaskResponse } from '../models/task/task-response.model';
import { TaskNode } from '../models/task/task-node.model';
import { IdProof } from '../models/id-proof.model';
import { Submitter } from '../models/submitter.model';
import { User } from '../types/custom';
import { CobDataResolverService } from './cob-data-resolver-service';

@injectable()
export class PersonInfoService implements IPersonInfoService {
  TASK_PRSN_KEY = 'PersonTask';
  TASK_PRSN_FAILOVER_KEY = 'PersonFailoverTask';
  TASK_QSTN_KEY = 'QstnTask';
  TASK_RRE_KEY = 'RreTask';
  TASK_MFA_KEY = 'MfaTask';
  TASK_SBMTR_KEY = 'SbmtrTask';

  //Refer to /app/section111/blob/master/mra-common/src/main/java/gov/hhs/cms/cob/mir/common/enums/MIRRoleType.java
  ROLE_ID_AR = 1;
  ID_PROOF_MFA_STATUS = 'E';
  RESTART_ID_PROOF_MFA_STATUS = 'X';

  /*  ----------------------------------------------------
    Find a person
  */
  public async find( user: User, email: string | null, loginId: string | null): Promise<PersonInfo> {
    const taskTree: TaskTree<Task> = this.createTaskTree(user);
    if (loginId) {
      taskTree.rootNode.task.request.paramsMap.set('${param1}', 'loginid');
      taskTree.rootNode.task.request.paramsMap.set('${param2}', loginId);
    } else if(email) {
      taskTree.rootNode.task.request.paramsMap.set('${param1}', 'email');
      taskTree.rootNode.task.request.paramsMap.set('${param2}', email);
    }

    const result: Map<string, TaskResponse> = new Map<string, TaskResponse>();
    for await (const nodeRsp of taskTree.parse()) {
      //console.log({'place': 'inside gen-iter', 'key': nodeRsp.task.key, 'url': nodeRsp.task.request.url, 'response' : nodeRsp.task.response});
      result.set(nodeRsp.task.key, nodeRsp.task.response);
    }
    return this.formatTaskResponse(result);
  }

  /* ----------------------------------------------------
    Update Person based on action selected
  */
  public async update(user: User, personAction: PersonInfo): Promise<PersonInfo> {
    const personInfo: PersonInfo = new PersonInfo();
    
    if(personAction.actionInfo.actionIdProofUser){
      return this.mfaProofAction(user, personAction, this.ID_PROOF_MFA_STATUS);
    } else if(personAction.actionInfo.actionRestartIdProof) {
      return this.mfaProofAction(user, personAction, this.RESTART_ID_PROOF_MFA_STATUS);
    } else {
      return personInfo;
    }
  }
  
  /* -----------------------------------------------------
    Private helper methods
  */
  private createTaskTree(user: User): TaskTree<Task> {
    //create root node
    const prsnTask = new Task(
                            this.TASK_PRSN_KEY,
                            new TaskRequest('/persons?${param1}=${param2}',new Map([['${param1}', ''],['${param2}', '']])),
                            new MraDataResolverService<MirPrsn>(),
                            false, //UNIQUE
                          );
    //override default postProcessing method on this task
    prsnTask.postProcess = (taskResponse: TaskResponse) => {
                              if (taskResponse && taskResponse.hasData()) {
                                if (Array.isArray(taskResponse.result)) {
                                  for(let prsn of taskResponse.result) {
                                    if(prsn){
                                      prsn.vldtnStusDesc = MirPrsn.getVldtnStusDesc(prsn.vldtnStusId);

                                      if(!prsnTask.allowMany) {//access the first element
                                        taskResponse.result = prsn;
                                        break;
                                      }
                                    }
                                  };
                                }
                              }

                              prsnTask.response = taskResponse;
                              return Promise.resolve(prsnTask);
                            };
    const rootNode: TaskNode<Task> = new TaskNode(prsnTask);

    //create failover node
    const prsnFailoverTask = new Task(
                                    this.TASK_PRSN_FAILOVER_KEY,
                                    //replace $param1 with the value found for $param2 inside the parent-node request
                                    new TaskRequest('/api/v1/users/get_ar_info/${param1}', new Map([['${param1}', '${param2}']])),
                                    new CobDataResolverService<Submitter>(user),
                                    false, //UNIQUE
                                  );
    //Transform the data received to a MIR_PRSN object
    prsnFailoverTask.postProcess = (taskResponse: TaskResponse) => {
                                      if (taskResponse && taskResponse.hasData()) {
                                        if(taskResponse.result){
                                          const prsn: MirPrsn = new MirPrsn();
                                          prsn.prsn1stName = taskResponse.result.firstName;
                                          prsn.prsnMdlInitlName = taskResponse.result.middleName;
                                          prsn.prsnLastName = taskResponse.result.lastName;
                                          prsn.emailAdr = taskResponse.result.email;
                                          prsn.vldtnStusId = taskResponse.result.status;
                                          prsn.vldtnStusDesc = MirPrsn.getVldtnStusDesc(taskResponse.result.status);
                                          taskResponse.result = prsn;
                                        }
                                        prsnFailoverTask.response = taskResponse;
                                      }
                                      return Promise.resolve(prsnFailoverTask);
                                    };
    const prsnFailoverNode = new TaskNode(prsnFailoverTask, 
                                          true, //Is Failover Node
                                          'Key not found');  //failover criteria

    //create all dependent child nodes
    const qstnTaskNode: TaskNode<Task> = new TaskNode(
                                              new Task(
                                                  this.TASK_QSTN_KEY,
                                                  new TaskRequest('/persons/${param1}/questions',new Map([['${param1}', 'prsnId']])),
                                                  new MraDataResolverService<MirPrsnQstn>(),
                                              ));

    // we ONLY set the user for CobDataResolverService when calling existing COB REST-API backend and not for MRA-DL
    const idProofTaskNode: TaskNode<Task> = new TaskNode(
                                                new Task(
                                                  this.TASK_MFA_KEY,
                                                  new TaskRequest('/api/v1/users/mfa-id-proofing',
                                                    new Map([['${param1}', 'prsnId']]),
                                                    'REST' , 
                                                    'POST', 
                                                    {
                                                      'systemIndicator': 'E',//EDI
                                                      'action': 'I', //Inquiry
                                                      'personId': '${param1}',
                                                    },
                                                  ),
                                                  new CobDataResolverService<IdProof>(user),
                                                ),
                                              );

    const sbmtrTask = new Task(
                          this.TASK_SBMTR_KEY,
                          new TaskRequest('/api/v1/submitters/${param1}', new Map([['${param1}', 'emailAdr']])),
                          new CobDataResolverService<Submitter>(user),
                        );
    //override default postProcessing method on this task
    sbmtrTask.postProcess = (taskResponse: TaskResponse) => {
                                        if (taskResponse && taskResponse.hasData()) {
                                          if (Array.isArray(taskResponse.result)) {
                                            taskResponse.result.forEach((sbmtr: Submitter) => {
                                              sbmtr.appName = Submitter.getAppName(sbmtr.systemIndicator);
                                              sbmtr.roleName = Submitter.getRoleName(sbmtr.role);
                                              sbmtr.acctStatusName = Submitter.getAcctStatusName(sbmtr.status, sbmtr.systemIndicator);
                                            });
                                          }
                                          sbmtrTask.response = taskResponse;
                                        }
                                        return Promise.resolve(sbmtrTask);
                                      };
    const sbmtrTaskNode: TaskNode<Task> = new TaskNode(sbmtrTask);
    
    /* Create node relationships:
                          [ PersonTask ] 
                        /             \
                    [pass]            [fail]
                        \                 \
                          \        [PersonTaskFailover]
                          \        /       \
                            \    [pass]    [fail]=>Stop processing
                            \   /                     
                    ---------------------         
                    |        |         |        
              [QstnTask] [MfaTask] [SbmtrTask]  
    */
    //All nodes with there sub-nodes need to be defined before adding to root-node
    rootNode.addChild(prsnFailoverNode);
    rootNode.addChild(qstnTaskNode);
    rootNode.addChild(idProofTaskNode);
    rootNode.addChild(sbmtrTaskNode);

    return new TaskTree(rootNode);
  }
  
  private formatTaskResponse(responseMap: Map<string, TaskResponse>): Promise<PersonInfo> {
    const personInfo: PersonInfo = new PersonInfo();

    if (responseMap && responseMap.size > 0) {
      let prsnData = responseMap.get(this.TASK_PRSN_KEY);
      if (!prsnData || !prsnData.processingSuccess() || !prsnData.hasData()) {
        prsnData = responseMap.get(this.TASK_PRSN_FAILOVER_KEY);
      }

      if (prsnData && prsnData.processingSuccess() && prsnData.hasData()) {
        personInfo.person = prsnData.result;
        personInfo.qstnList = responseMap.get(this.TASK_QSTN_KEY)?.processingSuccess() && responseMap.get(this.TASK_QSTN_KEY)?.hasData()
          ? responseMap.get(this.TASK_QSTN_KEY)?.result
          : [];//responseMap.get(this.TASK_QSTN_KEY)?.errors;
        personInfo.idProof = responseMap.get(this.TASK_MFA_KEY)?.processingSuccess() && responseMap.get(this.TASK_MFA_KEY)?.hasData()
          ? responseMap.get(this.TASK_MFA_KEY)?.result
          : {};//responseMap.get(this.TASK_MFA_KEY)?.errors;
        personInfo.sbmtrList = responseMap.get(this.TASK_SBMTR_KEY)?.processingSuccess() && responseMap.get(this.TASK_SBMTR_KEY)?.hasData()
          ? responseMap.get(this.TASK_SBMTR_KEY)?.result
          : [];//responseMap.get(this.TASK_SBMTR_KEY)?.errors;

        /*
          handle UI specific logic
        */
        if(personInfo.person){
          personInfo.displayInfo = this.gatherDisplayInfo(personInfo.person, 
                                                          personInfo.sbmtrList, 
                                                          personInfo.idProof);
        }

        return Promise.resolve(personInfo);
      } else {
        personInfo.person = responseMap.get(this.TASK_PRSN_KEY)?.errors[0];
        return Promise.resolve(personInfo);
      }
    } else {
      return Promise.reject('Person not found');
    }
  }

  private gatherDisplayInfo(person: MirPrsn, sbmtrList: any, idProof: any): any {
    const displayInfo = {
      showIdProofDetails: false,
      optionRestartIdProof: false,
      optionIdProofUser: false,
      optionResetPwd: false,
      optionUnlockUserAcct: false,
      optionReactivate: false,
      optionSendToken: false,
    };

    if(person){
      if( (person.mrpRoleId && person.mrpRoleId !== this.ROLE_ID_AR)
        || ( person.ghpRoleId && person.ghpRoleId !== this.ROLE_ID_AR)
      ){
        displayInfo.showIdProofDetails = true;
      }
      
      switch(person.vldtnStusId){
        case MirPrsn.VLD_STUS_ACTIVE: 
          displayInfo.optionResetPwd = person.loginId? true: false; //is not null or empty
          break;
        case MirPrsn.VLD_STUS_INACTIVE: 
          displayInfo.optionReactivate = true; 
          break;
        case MirPrsn.VLD_STUS_LOCKED: 
          displayInfo.optionResetPwd = person.loginId? true: false;
          displayInfo.optionUnlockUserAcct = true;
          break;
        default:
          break;
      }
      //console.log(idProof);
      if(idProof) {
        if(idProof.mfaStatus){
          if(idProof.mfaStatus === 'F' || idProof.mfaStatus === 'P'){
            displayInfo.optionRestartIdProof = true;
            if(idProof.mfaStatus === 'F') {
              displayInfo.optionIdProofUser = true;
            }
          }
        }
      }
      if(sbmtrList){
        //find any submitter-acct with a role of AM and verify person is in pending status with a null login-id
        displayInfo.optionSendToken = ((person.loginId? false: true) && person.vldtnStusId === MirPrsn.VLD_STUS_PENDING)
                                      &&  ((sbmtrList as Submitter[]).filter(sbmtr => sbmtr.role === 'AM')?.length>0);
      }
    }

    return displayInfo;
  }

  /* -------------------------------------------
     Action methods
  */
  private async mfaProofAction(user: User, personInfo: PersonInfo, mfaStatus: string = 'E'){
    const cobDataResolver = new CobDataResolverService<IdProof>(user);
    try{
      //create and update request payload
      const idProof: IdProof = new IdProof();
      idProof.systemIndicator = 'E';//EDI
      idProof.action = 'U';//Update
      idProof.mfaStatus = mfaStatus; //this is the change
      idProof.personId = personInfo.person?.prsnId? personInfo.person?.prsnId: 0;

      //call endpoint
      const updateResponse: IdProof = await cobDataResolver.postData(
          '/api/v1/users/mfa-id-proofing',
          idProof
      );

      //handle response
      if(updateResponse){
        personInfo.idProof = idProof;
        if(idProof.mfaStatus === this.ID_PROOF_MFA_STATUS){
          personInfo.displayInfo.optionIdProofUser = false;
        } else if(idProof.mfaStatus === this.RESTART_ID_PROOF_MFA_STATUS){
          personInfo.displayInfo.optionRestartIdProof = false;
        }
        return Promise.resolve(personInfo);
      } else {
        personInfo.actionInfo.status = 500;
        personInfo.actionInfo.errors.push(`mfaProofAction: Unknown error trying to set mfaStatus: ${mfaStatus}`);
        return Promise.reject(personInfo);
      }
    } catch(error){
      personInfo.actionInfo.status = 500;
      personInfo.actionInfo.errors.push(error);
      return Promise.reject(personInfo);
    }
  }
}
