import { injectable } from 'inversify';
import { MirPrsn } from '../models/mir-prsn.model';
import { MirRrePrsn } from '../models/mir-rre-prsn.model';
import { MraDataResolverService } from './mra-data-resolver-service';
import { PersonInfo } from '../models/person-info.model';
import { Task } from '../models/task/task.model';
import { TaskTree } from '../models/task/task-tree.model';
import { TaskResponse } from '../models/task/task-response.model';
import { IAuthorisedRepService } from './interfaces/authorised-rep-service.interface';
import { TaskNode } from '../models/task/task-node.model';
import { TaskRequest } from '../models/task/task-request.model';

@injectable()
export class AuthorisedRepService implements IAuthorisedRepService {
  TASK_PRSN_KEY = 'PersonTask';
  TASK_RRE_KEY = 'RreTask';

  createRrePersonTaskTree(): TaskTree<Task> {
    //create all tree nodes
    const prsnTask =  new Task(
                              this.TASK_PRSN_KEY,
                              new TaskRequest('/persons?email=${param1}',new Map([['${param1}', '']])),
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

    const nodeRre: TaskNode<Task> = new TaskNode(
      new Task(
        this.TASK_RRE_KEY,
        new TaskRequest('/persons/${param1}/rre',new Map([['${param1}', 'prsnId']])),
        new MraDataResolverService<MirRrePrsn>(),
      ),
    );

    /* create relationship: [PersonTask] -> [RreTask] */
    rootNode.addChild(nodeRre);

    return new TaskTree(rootNode);
  }

  async findRrePerson(email: string): Promise<PersonInfo> {
    const taskTree: TaskTree<Task> = this.createRrePersonTaskTree();
    taskTree.rootNode.task.request.paramsMap.set('${param1}', email);

    const result: Map<string, TaskResponse> = new Map<string, TaskResponse>();
    for await (const nodeRsp of taskTree.parse()) {
      //console.log({'place': 'inside gen-iter', 'key': nodeRsp.task.key, 'url': nodeRsp.task.request.url, 'response' : nodeRsp.task.response});
      result.set(nodeRsp.task.key, nodeRsp.task.response);
    }
    return this.formatRrePersonTaskResponse(result);
  }

  async findReporter(rreId: string | null): Promise<PersonInfo> {
    throw new Error('Method not implemented.');
  }

  formatRrePersonTaskResponse(responseMap: Map<string, TaskResponse>): Promise<PersonInfo> {
    const personInfo: PersonInfo = new PersonInfo();
    if (responseMap && responseMap.size > 0) {
      const prsnData = responseMap.get(this.TASK_PRSN_KEY);
      if (prsnData && prsnData.processingSuccess() && prsnData.hasData()) {
        personInfo.person = prsnData.result;
        personInfo.rreList = responseMap.get(this.TASK_RRE_KEY)?.processingSuccess() && responseMap.get(this.TASK_RRE_KEY)?.hasData()
          ? responseMap.get(this.TASK_RRE_KEY)?.result
          : []; //responseMap.get(this.TASK_RRE_KEY)?.errors;

        return Promise.resolve(personInfo);
      } else {
        personInfo.person = responseMap.get(this.TASK_PRSN_KEY)?.errors[0];
        return Promise.resolve(personInfo);
      }
    } else {
      return Promise.reject('Person not found');
    }
  }
}
