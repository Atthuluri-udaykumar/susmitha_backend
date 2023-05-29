
import { AxiosRequestConfig } from 'axios';
import data from '../config/email-config.json'; // This should be the path of a docker volume folder
import { logger } from './winston.config';

const profile: string = process.env.DEPLOY_ENV || 'local'; // get profile from env variable

logger.info('Active email profile : ' + profile);

const configData = data.config as { [key: string]: any };

const emailConfig: AxiosRequestConfig = configData[profile];

export { emailConfig };