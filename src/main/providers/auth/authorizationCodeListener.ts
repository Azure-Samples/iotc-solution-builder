export abstract class AuthorizationCodeListener {
    private internalProtocol: string;

    // A string that represents the host name that should be listened on (i.e. 'msal' or '127.0.0.1')
    constructor(protocol: string) {
        this.internalProtocol = protocol;
    }

    public get protocol(): string {
        return this.internalProtocol;
    }

    public abstract registerProtocolAndStartListening(timeout: number): Promise<string>;
    public abstract unregisterProtocol(): void;
}
