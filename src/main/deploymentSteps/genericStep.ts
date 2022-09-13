import logger from '../logger';
import {
    ISbDeploymentConfig,
    ISbDeploymentContext
} from '../models/sbSolution';
import { IServiceResponse } from '../models/main';

export async function deploymentStep(deploymentConfig: ISbDeploymentConfig, context: ISbDeploymentContext, apiConfig: any, _lroApiConfig?: any): Promise<IServiceResponse> {
    const ModuleName = `DS_${deploymentConfig.itemStep}`;

    let response: IServiceResponse = {
        status: 200,
        message: ''
    };

    await context.showProgress(deploymentConfig.name);

    try {
        response = await context.executeApi(apiConfig, deploymentConfig.api.apiAuthScope);
    }
    catch (ex) {
        logger.log([ModuleName, 'error'], `${deploymentConfig.itemStep} error: ${ex.message}`);
    }

    return response;
}
