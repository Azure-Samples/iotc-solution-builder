import { app, BrowserWindow } from 'electron';
// import store, { StoreKeys } from './store';
import logger from './logger';
import { MainApp } from './mainApp';

const ModuleName = 'main';

// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    // eslint-disable-line global-require
    app.quit();
}

// const appProtocol = store.get(AppProtocolId);
// app.setAsDefaultProtocolClient(appProtocol);

const mainApp = new MainApp();

app.on('open-url', (ev: Event, appUrl: string) => {
    ev.preventDefault();

    logger.log([ModuleName, 'info'], `electorn app 'open-url' received - ${appUrl}`);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    logger.log([ModuleName, 'info'], `electorn app 'ready' received - initializing app...`);

    void mainApp.initializeApp();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    logger.log([ModuleName, 'info'], `electron app 'window-all-closed' message received - checking platform...`);

    if (process.platform !== 'darwin') {
        logger.log([ModuleName, 'info'], `electron app 'window-all-closed' received - closing app`);
        app.quit();
    }
});

app.on('activate', () => {
    // logger.log([ModuleName, 'info'], `electron app 'activate' message received`);
    // eslint-disable-next-line no-console
    console.log(`electron app 'activate' message received`);

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        logger.log([ModuleName, 'info'], `electron app 'activate' message received - re-creating main window`);

        mainApp.createMainWindow();
    }
});
