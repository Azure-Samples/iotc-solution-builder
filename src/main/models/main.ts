export interface IIpcResult {
    result: boolean;
    message: string;
    payload?: any;
}

export enum ProvisioningState {
    Active,
    Inactive
}

export interface IServiceResponse {
    status: number;
    message: string;
    payload?: any;
}

export interface IAzureManagementApiResponse extends IServiceResponse {
    headers?: any;
}

export const serviceResponseSucceeded = (response: IServiceResponse): boolean => {
    return (response.status >= 200 && response.status <= 299);
};

export interface IServiceError {
    status: number;
    title: string;
    message: string;
}

export const emptyServiceError: IServiceError = {
    status: 200,
    title: '',
    message: ''
};
