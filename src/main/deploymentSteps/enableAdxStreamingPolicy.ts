import logger from '../logger';
import {
    ISbDeploymentConfig,
    ISbDeploymentContext
} from '../models/sbSolution';
import { IServiceResponse } from '../models/main';
import _template from 'lodash.template';
import { v4 as uuidv4 } from 'uuid';

const ModuleName = 'DS_EnableAdxStreamingPolicy';

export async function deploymentStep(deploymentConfig: ISbDeploymentConfig, context: ISbDeploymentContext, apiConfig: any, _lroApiConfig?: any): Promise<IServiceResponse> {
    let response: IServiceResponse = {
        status: 200,
        message: ''
    };

    await context.showProgress('Enable streaming ingestion policy for raw opc data table...', false);

    try {
        const apiScopeTemplate = _template(deploymentConfig.api.apiAuthScope);
        const apiAuthScope = apiScopeTemplate({
            clusterName: context.parameters.createAdxCluster.clusterName,
            resourceLocation: context.parameters.context.resourceLocation
        });

        apiConfig.headers = {
            ['x-ms-client-request-id']: uuidv4(),
            ['x-ms-app']: context.parameters.context.resourceNameSuffix,
            ['x-ms-user-id']: context.parameters.context.resourceNameSuffix,
            ['Content-Type']: 'application/json; charset=utf-8',
            Accept: 'application/json',
            Host: `${context.parameters.createAdxCluster.clusterName}.${context.parameters.context.resourceLocation}.kusto.windows.net`
        };

        response = await context.executeApi(apiConfig, apiAuthScope);
    }
    catch (ex) {
        logger.log([ModuleName, 'error'], `${deploymentConfig.itemStep} error: ${ex.message}`);
    }

    return response;
}
