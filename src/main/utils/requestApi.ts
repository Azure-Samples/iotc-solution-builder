import axios from 'axios';
import logger from '../logger';

const ModuleName = 'requestApi';

export interface IApiResponse {
    status: number;
    message: string;
    payload?: any;
}

export async function requestApi(config: any): Promise<IApiResponse> {
    logger.log([ModuleName, 'info'], `requestApi: (${config.method}) - ${config.url}`);

    const apiResponse: IApiResponse = {
        status: 200,
        message: ''
    };

    try {
        const axiosResponse = await axios.request(config);

        apiResponse.status = axiosResponse.status;
        apiResponse.message = axiosResponse.statusText || `${axiosResponse.status}`;

        if (axiosResponse.data) {
            apiResponse.payload = axiosResponse.data;
        }

        logger.log([ModuleName, apiResponse.status > 299 ? 'error' : 'info'], `requestApi: status: ${apiResponse.status}`);
    }
    catch (ex) {
        if (ex.isAxiosError && ex.response) {
            apiResponse.status = ex.response.status;
            apiResponse.message = `An error occurred during the request: ${ex.response.status}`;
        }
        else {
            apiResponse.status = 500;
            apiResponse.message = `An error occurred during the request: ${ex.message}`;
        }
    }

    return apiResponse;
}
