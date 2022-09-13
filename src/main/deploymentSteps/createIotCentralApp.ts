import logger from '../logger';
import {
    ISbDeploymentConfig,
    ISbDeploymentContext
} from '../models/sbSolution';
import {
    IServiceResponse,
    serviceResponseSucceeded
} from '../models/main';
import { differenceInSeconds } from 'date-fns';
import { sleep } from '../utils';

const ModuleName = 'DS_CreateIoTCentralApp';
const maxWaitForIoTCentralAppInMinutes = (60 * 5);

export async function deploymentStep(deploymentConfig: ISbDeploymentConfig, context: ISbDeploymentContext, apiConfig: any, lroApiConfig?: any): Promise<IServiceResponse> {
    let response: IServiceResponse = {
        status: 200,
        message: ''
    };

    await context.showProgress('Creating IoT Central app...', false);

    try {
        response = await context.executeApi(apiConfig, deploymentConfig.api.apiAuthScope);

        if (serviceResponseSucceeded(response)) {
            context.parameters[deploymentConfig.itemStep] = {
                ...context.parameters[deploymentConfig.itemStep],
                applicationId: response.payload.properties.applicationId,
                displayName: response.payload.properties.displayName,
                identity: {
                    type: response.payload.identity.type,
                    tenantId: response.payload.identity.tenantId,
                    principalId: response.payload.identity.principalId
                }
            };
        }

        await context.showProgress('Waiting for app instance...');

        const startTime = Date.now();
        let waitingForIoTCentralApp = true;

        do {
            const waitResponse = await context.executeApi(lroApiConfig, deploymentConfig.lroApi.apiAuthScope);

            if (serviceResponseSucceeded(waitResponse)) {
                waitingForIoTCentralApp = false;

                break;
            }

            const waitSeconds = differenceInSeconds(Date.now(), startTime);

            logger.log([ModuleName, 'info'], `Waiting for IoT Central app - elapsed ${waitSeconds} sec....`);

            if (waitSeconds > maxWaitForIoTCentralAppInMinutes) {
                response.status = 500;
                response.message = 'Provisioning the Azure IoT Central app is taking longer than expected. You can try to provision the remaining steps manually. See the README for help with this.';

                break;
            }

            await sleep(3000);
        } while (waitingForIoTCentralApp);
    }
    catch (ex) {
        logger.log([ModuleName, 'error'], `${deploymentConfig.itemStep} error: ${ex.message}`);
    }

    return response;
}
