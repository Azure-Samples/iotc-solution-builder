export const AppProtocolId = 'd38cef1a-9200-449d-9ce5-3198067beaa5';
export const UserProfileScope = 'User.Read';
export const AzureManagementScope = 'https://management.azure.com/.default';
export const IoTCentralApiScope = 'https://apps.azureiotcentral.com/.default';
// eslint-disable-next-line no-template-curly-in-string
export const AzureDataExplorerApiScope = 'https://${clusterName}.${location}.kusto.windows.net/.default';

export interface IMsalConfig {
    clientId: string;
    tenantId: string;
    subscriptionId: string;
    aadAuthority: string;
}
