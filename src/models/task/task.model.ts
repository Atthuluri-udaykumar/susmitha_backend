import { ITask } from "./task.interface";
import { TaskRequest } from "./task-request.model";
import { TaskResponse } from "./task-response.model";
import { TaskResponseUtils } from "../../utils/task-response.utils";

interface ReplaceResponseType { 
  success: boolean,
  data: string,
  error: string  
}

/*
 key: unique identifier
 request: place holder for request
 dataResolver: DataResolverService instance for submitting request and resolving JSON response received from REST endpoint
 response: place holder for returning response back to the calling function
 allowMany: do you expect 1 or many records to show up?
*/
export class Task implements ITask{
  key: string;
  request: TaskRequest;
  dataResolver: any;
  response: TaskResponse;
  allowMany: boolean;
  
  constructor(
    key: string,
    request: TaskRequest,
    dataResolver: any,
    allowMany = true, // set to false if expecting a single unique record
  ) {
    this.key = key;
    this.request = request;
    this.dataResolver = dataResolver;
    this.response = new TaskResponse();
    this.allowMany = allowMany;
  }

  //Replace request object with corresponding values from parent-data
  async preProcess(parentResponseData?: any, parentRequestData?: any): Promise<any> {
    if(parentResponseData){
      const urlResponse:ReplaceResponseType = this.replaceParams(parentResponseData, false);
      if(urlResponse.success){
        this.request.url = urlResponse.data;
        if(this.request.method === 'POST'){
          const bodyResponse:ReplaceResponseType = this.replaceParams(parentResponseData, true);
          if(bodyResponse.success){
            this.request.body = JSON.parse(bodyResponse.data);
          } else {
            this.response.status = 200;
            this.response.errors.push(bodyResponse.error);
            return Promise.reject(this.response);
          }
        }
      } else {
        this.response.status = 200;
        this.response.errors.push(urlResponse.error);
        return Promise.reject(this.response);
      }
    } else if(parentRequestData){//applies to failover node 
      const urlResponse:ReplaceResponseType = this.replaceParams(parentRequestData, false);
      if(urlResponse.success){
        this.request.url = urlResponse.data;
        if(this.request.method === 'POST'){
          const bodyResponse:ReplaceResponseType = this.replaceParams(parentRequestData);
          if(bodyResponse.success){
            this.request.body = JSON.parse(bodyResponse.data);
          } else {
            this.response.status = 200;
            this.response.errors.push(bodyResponse.error);
            return Promise.reject(this.response);
          }
        } 
      } else {
        this.response.status = 200;
        this.response.errors.push(urlResponse.error)
        return Promise.reject(this.response);
      } 
    } else { //applies to root node 
      const urlResponse:ReplaceResponseType = this.replaceParams(null, false , true);
      if(urlResponse.success){
        this.request.url = urlResponse.data;
        if(this.request.method === 'POST'){
          const bodyResponse:ReplaceResponseType = this.replaceParams(null, true, true);
          if(bodyResponse.success){
            this.request.body = JSON.parse(bodyResponse.data);
          }
        }
      }
    }
    return Promise.resolve(this);
  }

  /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Should be self-contained !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    i.e. Handle all valid, invalid data scenarios and Exceptions
    Always return a Promise in resolved or rejected status
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Should be self-contained !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
  async process(parentResponse?: TaskResponse): Promise<any> {
    try {
      if (this.request.isValid()) {
        let taskResponse = null;
        if (this.request.method === 'POST') {
          taskResponse = await this.dataResolver.postData(
            this.request.url,
            this.request.body,
          );
        } else {
          //fallback is GET
          taskResponse = await this.dataResolver.getDataArray(
            this.request.url,
          );
        }

        if (taskResponse) {
          if (!this.allowMany && taskResponse.length > 1) {
            this.response = TaskResponseUtils.handleValidDataResponse(
                null,
                'Key Not Unique',
              );
          } else if (taskResponse.length === 0) {
            this.response = TaskResponseUtils.handleValidDataResponse(
              null,
              'Key not found',
            );
          } else {
            this.response = TaskResponseUtils.handleValidDataResponse(taskResponse);
          }

          return Promise.resolve(this);
        } else {
          this.response.status = 500;
          this.response.errors = taskResponse.errors;
          return Promise.reject(this);
        }
      }
    } catch (error: any) {
      this.response.status = 500;
      this.response.errors.push((error.message ??= 'Unknown error message'));
      return Promise.reject(this);
    }
  }

  
  /*
  currently nothing: used for transforming data
  */
  async postProcess(taskResponse: TaskResponse, parentData?: any): Promise<any> {
    if(parentData) {
      //do something with parent data
    }

    this.response =  taskResponse;
    return Promise.resolve(this);
  }
  
  /*  
    Replace each ${param} with its corresponding value pulled from passed Parent Response object. 
    parent-object[paramsMap.value] ------> will replace /abc/${paramsMap.key}/xyz. 
        
    Example:   
      For a taskList consisting of the following items:
      Parent  : task fetches Person object from remote by login-id or email-id or rre-id
              /persons?loginid=abc@def.com
      Children: task are dependent on the parent-response['personId'] item value which then is used by each of the task for 
              submitting their request to remote rendpoint(s). Each of these task might be say fetch questionaries, assoicated RREs, the AM or AR info by person-id
              Then for each of these children task, the url would look something like this:
              url: /persons/${param1}/qstns
                  /persons/${param1}/rres
              paramsMap: new Map([['${param1}', 'prsnId']]) 
              where, "prsnId" value is the name of the item-key found inside the parent's response object. This value 
                      would then replace the corresponding ${param1} in the url before being submitted to remote.
              The final url before submission for each one would then look something like these:
              /persons/1234/qstns
              /persons/1234/rres
  */
  private replaceParams(replacementDataObj: any, replaceBody:boolean = false, skipCheck: boolean = false): ReplaceResponseType {
    let response:ReplaceResponseType = {
      success: true, 
      data: replaceBody? JSON.stringify(this.request.body):this.request.url, 
      error:''
    };

    if (this.request.paramsMap && this.request.paramsMap.size > 0) {
      this.request.paramsMap.forEach((objKey, srchFor) => {
        if(skipCheck){
          response.data = response.data.replace(srchFor, objKey);
        } else {
          if(replacementDataObj && this.isKeyOfObject(objKey, replacementDataObj)){
            const keyVal = replacementDataObj[objKey];
            if( keyVal!= null){
              response.data = response.data.replace(srchFor, keyVal);
            } else {
              //console.log({'replaceParams': response, 'srchfor': srchFor,'replaceWith': objKey, 'contextData': keyVal});
              response.success = false;
              response.error= `${objKey} value is undefined`;  
            }
          } else {
            //console.log({'replaceParams': response, 'contextData': replacementDataObj});
            response.success = false;
            response.error= `${objKey} not found`;
          }
          /*console.log({'replaceParams': this.key,
                      'srchfor': srchFor,
                      'replaceWith': objKey, 
                      'data': response.data, 
                      'contextData': replacementDataObj});*/
        }
      });
    }
    return response;
  }

  private isKeyOfObject<T extends object>(
    key: string | number | symbol,
    obj: T,
  ): key is keyof T {
    return key in obj;
  }
}