import { TaskRequest } from "./task-request.model";
import { TaskResponse } from "./task-response.model";

export interface ITask {
  preProcess(parentData?: any, parentRequestData?: any): Promise<any>;
  process(parentResponse?: TaskResponse): Promise<any>;
  postProcess(taskResponse: TaskResponse, parentData?: any): Promise<any>;
}