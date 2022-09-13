import logger from '../logger';
import {
    ISbDeploymentConfig,
    ISbDeploymentContext
} from '../models/sbSolution';
import { IServiceResponse, serviceResponseSucceeded } from '../models/main';

const ModuleName = 'DS_GetOpcDeviceAttestation';

export async function deploymentStep(deploymentConfig: ISbDeploymentConfig, context: ISbDeploymentContext, apiConfig: any, _lroApiConfig?: any): Promise<IServiceResponse> {
    let response: IServiceResponse = {
        status: 200,
        message: ''
    };

    await context.showProgress('Retrieving edge gateway device attestation properties...');

    try {
        response = await context.executeApi(apiConfig, deploymentConfig.api.apiAuthScope);

        if (serviceResponseSucceeded(response)) {
            context.parameters[deploymentConfig.itemStep] = {
                ...context.parameters[deploymentConfig.itemStep],
                scopeId: response.payload.idScope,
                symmetricKey: response.payload.symmetricKey
            };
        }
    }
    catch (ex) {
        logger.log([ModuleName, 'error'], `${deploymentConfig.itemStep} error: ${ex.message}`);
    }

    return response;
}
