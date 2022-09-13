import Store from 'electron-store';

export enum StoreKeys {
    lastOAuthError = 'lastOAuthError',
    configurationName = 'configurationName',
    clientId = 'clientId',
    tenantId = 'tenantId',
    subscriptionId = 'subscriptionId',
    aadAuthority = 'aadAuthority',
    graphEndpointHost = 'graphEndpointHost',
    graphMeEndpoint = 'graphMeEndpoint',
    appProtocolId = 'appProtocolId',
    lastConfiguration = 'lastConfiguration',
    provisioningState = 'provisioningState'
}

interface StoreType {
    lastOAuthError: string;
    configurationName: string;
    clientId: string;
    tenantId: string;
    subscriptionId: string;
    aadAuthority: string;
    graphEndpointHost: string;
    graphMeEndpoint: string;
    appProtocolId: string;
    lastConfiguration: string;
    provisioningState: boolean;
}

const store = new Store<StoreType>({
    defaults: {
        lastOAuthError: '',
        configurationName: '',
        clientId: '',
        tenantId: '',
        subscriptionId: '',
        aadAuthority: 'https://login.microsoftonline.com/common/',
        graphEndpointHost: 'https://graph.microsoft.com/',
        graphMeEndpoint: 'v1.0/me',
        appProtocolId: '',
        lastConfiguration: '',
        provisioningState: false
    }
});

export default store;
