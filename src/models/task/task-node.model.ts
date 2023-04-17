import { ITaskNode } from './task-node.interface';
import { TaskRequest } from './task-request.model';
import { TaskResponse } from './task-response.model';
import { ITask } from './task.interface';
import { Task } from './task.model';

/*
   isFailoverNode= true will make this node a failover-node and is a child of the node being handled. 
   It will only get parsed if the failover error-criteria if provided is satified
*/
export class TaskNode<T extends Task> implements ITaskNode {
  public task: T;
  private children: TaskNode<T>[];
  public parent: TaskNode<T> | null;
  public isFailoverNode: boolean| false;
  public hasFailoverNode: boolean | false;
  public failoverErrorCriteria: string;

  constructor(task: T, failoverNode = false, failoverErrorCriteria = '') {
    this.task = task;
    this.parent = null;
    this.children = [];
    this.isFailoverNode = failoverNode;
    this.failoverErrorCriteria = failoverErrorCriteria;
    this.hasFailoverNode = false;

  }

  addChild(child: TaskNode<T>) {
    if (child) {
      child.parent = this;
      if(child.isFailoverNode) {
        this.hasFailoverNode=true;
      }
      this.children.push(child);
    }
  }

  /*
    A failover-node doesn't have access to its parent-node response data since the parent failed for some reason as given
    by the error reason. So, a failover-node request has to be created from the request-data that was used during parent-node 
    request submission.
  */
  allowFailover(): boolean {
    let allowFailover: boolean = false;

    if(this.parent){
      allowFailover = true;
      
      //VERIFY: that, all request params/body for failover endpoint are available
      if(this.task.request.paramsMap.size>0){
        let parentReqDataTxt: string = JSON.stringify(this.parent.task.request.gatherRequestDataPayload()).toLowerCase();
        this.task.request.paramsMap.forEach((objKey: string, srchFor: string) => {
          //console.log('Located[' + objKey + '] inside ' + parentReqDataTxt + ' at position ' + parentReqDataTxt.indexOf(objKey.toLowerCase()));
          allowFailover = allowFailover && parentReqDataTxt.indexOf(objKey.toLowerCase())>-1;
        });
      }

      //VERIFY: that, error critera matches the error-reason for parent-node
      if(this.failoverErrorCriteria && this.failoverErrorCriteria.length>0){
        allowFailover = allowFailover
                      && this.parent.task.response.errors.filter(err => err === this.failoverErrorCriteria).length>0;
      }
    }

    //All failover nodes will have a parent-node, if not then something is wrong!
    console.log('AllowFailover[' + this.task.key + ']? = ' + allowFailover);
    return allowFailover;
  }

  /*
    Parse out data from parent-node task for setting request parameter[s]/body
  */
  async preProcess(): Promise<ITaskNode> {
    //console.log('preProcess[' + this.task.key + '] ' + this.task.request.url);
    try{
      if (this.parent && this.parent.task) {
        if(this.parent.task.response.hasData()){
          const pData = 
          Array.isArray(this.parent.task.response.result) && this.parent.task.response.result.length > 0
          ? this.parent.task.response.result[0]
          : this.parent.task.response.result;
          this.task = await this.task.preProcess(pData);
        } else if(this.isFailoverNode) {//applies to failover node
          if(this.parent.task.request.method === 'POST'){
            this.task = await this.task.preProcess(null, this.parent.task.request.body);
          } else {
            this.task = await this.task.preProcess(null, Object.fromEntries(this.parent.task.request.paramsMap));
          }
        }
      } else { //applies to root node 
        this.task = await this.task.preProcess();
      }
      return this;
    } catch(errorTask){
      const errorResponse = errorTask as TaskResponse;
      this.task.response.errors = errorResponse.errors;
      this.task.response.status = errorResponse.status;
      return Promise.reject(this);
    }
  }

  async process(): Promise<any> {
    this.task = await this.task.process();
    //console.log({process: '[' + this.task.key + '] ' + this.task.request.url, data: this.task.response});
    return this;
  }

  async postProcess(): Promise<TaskNode<T>> {
    //console.log('postProcess[' + this.task.key + '] ' + this.task.request.url);
    if (this.parent && this.parent.task && this.parent.task.response.hasData()) {
      const pData =
      Array.isArray(this.parent.task.response.result) && this.parent.task.response.result.length > 0
          ? this.parent.task.response.result[0]
          : this.parent.task.response.result;
          this.task = await this.task.postProcess(this.task.response, pData);
      return this;
    }

    this.task = await this.task.postProcess(this.task.response);
    return this;
  }

  /*
    Works like a branch function for failover-node support
    If failover-node processes successfully, it will grab all its parent-node's children to be processed.

    This logic is based on specificity
  */
  fetchChildren(): TaskNode<T>[] {
    //console.log('fetchChildren[' + this.task.key + '] ' + this.task.request.url);
    if(this.task.response.hasData() && this.isFailoverNode){
      if(this.parent){
        this.parent.children
                  .filter(node => !node.isFailoverNode)
                  .forEach(node => this.addChild(node));
      }
      return this.children;
    } else if(this.task.response.hasData()){
      return this.children.filter(node => !node.isFailoverNode);
    } else if(this.task.response.hasError() && this.hasFailoverNode){
      return this.children.filter(node => node.isFailoverNode && node.allowFailover());
    } else { //has error
      return [];
    }
  }

}