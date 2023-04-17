import { TaskResponse } from "../models/task/task-response.model";

export class TaskResponseUtils {
  /*static handleSettledResponse(rsp: PromiseSettledResult<any>): TaskResponse {
    const taskResponse: TaskResponse = new TaskResponse();
    if (rsp.status === 'fulfilled') {
      taskResponse.result = rsp.value;
    } else {
      taskResponse.status = rsp.reason['status'];
      taskResponse.errors.push(rsp.reason['nessage']);
    }

    return taskResponse;
  }*/

  static handleValidDataResponse(
    response: any,
    message: string = '',
  ): TaskResponse {
    const taskResponse: TaskResponse = new TaskResponse();
    if (response) {
      taskResponse.result = response;
    } else {
      taskResponse.result = null;
      taskResponse.errors.push(message);
    }

    return taskResponse;
  }

  /*
   static async fetchTaskData(taskList: TaskList): Promise<TaskResponse> {
    let response = new TaskResponse();
    try {
      const rspData = await taskList.mainTask.srvc.getDataArray(
        taskList.mainTask.url,
      );

      //console.log(rspData);
      if (rspData) {
        if (rspData.length === 0) {
          //response.errors.push('Key not found');
          taskList.mainTask.response =
            TaskHandlerV0Service.handleValidDataResponse(null, 'Key not found');
        } else if (rspData.length > 1) {
          //response.errors.push('Key Not Unique');
          taskList.mainTask.response =
            TaskHandlerV0Service.handleValidDataResponse(null, 'Key Not Unique');
        } else {
          taskList.mainTask.response =
            TaskHandlerV0Service.handleValidDataResponse(rspData);
          const subTaskPromises: Promise<any>[] = [];
          TaskHandlerV0Service.replaceUrlParams(
            taskList.subTasks,
            rspData[0],
          ).forEach((url, idx) => {
            taskList.subTasks[idx].url = url;
            subTaskPromises.push(taskList.subTasks[idx].srvc.getDataArray(url));
          });

          if (subTaskPromises && subTaskPromises.length > 0) {
            const rspList = await Promise.allSettled(subTaskPromises);
            if (rspList) {
              rspList.forEach((rsp, idx) => {
                taskList.subTasks[idx].response =
                  TaskHandlerV0Service.handleSettledResponse(rsp);
              });
            }
          }

          //console.log(taskList);
        }
      } else {
        response.status = 500;
        response.errors = rspData.errors;
        return Promise.reject(response);
      }

      response = TaskHandlerV0Service.handleValidDataResponse(taskList);
      return Promise.resolve(response);
    } catch (error: any) {
      response.status = 500;
      response.errors.push((error.message ??= 'Unknown error message'));
      //error.message ??= 'Unknown error message';
      return Promise.reject(response);
    }
  }*/
}
