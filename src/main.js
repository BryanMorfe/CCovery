const path = require('path')
const { app, BrowserWindow } = require('electron')

app.commandLine.appendSwitch('enable-transparent-visuals');
app.commandLine.appendSwitch('disable-gpu');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        frame: false,
        transparent: true,
        icon: path.join(__dirname, '../build/icons/AppIcon-512x512.png')
    });

    console.log(path.join(__dirname, '../build/icons/AppIcon-512x512.png'));

    win.loadFile('./src/index.html');

    //win.openDevTools();
}

function onAppReady() {
    createWindow();

    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}

app.on('ready', function() {
    setTimeout(onAppReady, 300);
});

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
