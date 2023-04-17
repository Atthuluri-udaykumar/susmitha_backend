/*
 * Created on 2020-03-12 ( Time 18:21:49 )
 * Generated by Telosys Tools Generator ( version 3.1.2 )
 */

import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { nullable } from '../utils/model.util';

@JsonObject('ServiceResponse')
export class ServiceResponse {

        @JsonProperty('status', Number)
        public status: number = 0;

        // List<ServiceError>
        @JsonProperty('errors', Any)
        public errors: any = undefined;

        @JsonProperty('result', Any, true, nullable)
        public result: any = undefined;

        @JsonProperty('timestamp', Any)
        public timestamp: any = undefined;

}