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

const ModuleName = 'DS_DeployEdgeToArcServer';
const MaxWaitForIoTEdgeRuntimeInMinutes = (60 * 60);
const EstVMProvisioningSeconds = 250;

export async function deploymentStep(deploymentConfig: ISbDeploymentConfig, context: ISbDeploymentContext, apiConfig: any, lroApiConfig?: any): Promise<IServiceResponse> {
    let response: IServiceResponse = {
        status: 200,
        message: ''
    };

    await context.showProgress('Deploying Azure IoT Edge runtime to Arc enabled server...', false);

    try {
        response = await context.executeApi(apiConfig, deploymentConfig.api.apiAuthScope);
        if (!serviceResponseSucceeded(response)) {
            response.message = 'An error occurred trying to execute the Azure ARM template on the Arc enabled server. \
                Please check the configuration for this step and examine the deployment logs for the specified resource group.';

            return response;
        }

        await context.showProgress('Waiting for Azure IoT Edge runtime startup...');

        const startTime = Date.now();
        let waitingForIoTEdgeRuntime = true;

        do {
            const waitResponse = await context.executeApi(lroApiConfig, deploymentConfig.lroApi.apiAuthScope);

            if (serviceResponseSucceeded(waitResponse)) {
                waitingForIoTEdgeRuntime = false;

                break;
            }

            const waitSeconds = differenceInSeconds(Date.now(), startTime);

            await context.showProgress(`Waiting for Azure IoT Edge runtime startup (est. ${Math.floor((waitSeconds * 100) / EstVMProvisioningSeconds)}%)...`, false);
            logger.log([ModuleName, 'info'], `Waiting for Azure Virtual Machine - elapsed ${waitSeconds} sec....`);

            if (waitSeconds > MaxWaitForIoTEdgeRuntimeInMinutes) {
                response.status = 500;
                // eslint-disable-next-line max-len
                response.message = 'Deploying Azure IoT Edge runtime on the Arc enabled server is taking longer than expected. There may be a problem with your subscription or access to Azure resources.';

                break;
            }

            await sleep(3000);
        } while (waitingForIoTEdgeRuntime);
    }
    catch (ex) {
        logger.log([ModuleName, 'error'], `${deploymentConfig.itemStep} error: ${ex.message}`);
    }

    return response;
}
