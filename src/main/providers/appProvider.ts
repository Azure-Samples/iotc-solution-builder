import {
    IpcMain,
    BrowserWindow
} from 'electron';

export abstract class AppProvider {
    protected ipcMain: IpcMain;
    protected authWindow: BrowserWindow;

    constructor(ipcMain: IpcMain, authWindow: BrowserWindow) {
        this.ipcMain = ipcMain;
        this.authWindow = authWindow;
    }

    public async initialize(): Promise<boolean> {
        return true;
    }

    protected abstract registerIpcEventHandlers(): void;
}
