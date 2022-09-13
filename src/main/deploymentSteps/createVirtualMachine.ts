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
import * as crypto from 'crypto';
import { sleep } from '../utils';

const ModuleName = 'DS_CreateVirtualMachine';
const MaxWaitForIoTEdgeRuntimeInMinutes = (60 * 8);
const EstVMProvisioningSeconds = 250;

export async function deploymentStep(deploymentConfig: ISbDeploymentConfig, context: ISbDeploymentContext, apiConfig: any, lroApiConfig?: any): Promise<IServiceResponse> {
    let response: IServiceResponse = {
        status: 200,
        message: ''
    };

    await context.showProgress('Creating Virtual Machine with Azure IoT Edge runtime...', false);

    try {
        // Specify a random (secure) password to satisfy the deployment. If the user wishes to access the VM
        // they can use the Azure Port and manually reset the password to something they want.
        apiConfig.data.properties.parameters.adminPasswordOrKey.value = `Ag2#${crypto.randomBytes(8).toString('hex')}`;

        response = await context.executeApi(apiConfig, deploymentConfig.api.apiAuthScope);

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
                response.message = 'Provisioning the Azure Virtual Machine with Azure IoT Edge runtime is taking longer than expected. There may be a problem with your subscription or access to Azure resources.';

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
