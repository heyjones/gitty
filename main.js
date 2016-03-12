/* eslint strict: 0 */
'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const path = require('path');

var Job = require('./jobs/jobs');
var RepositoryProcess = require('./process/RepositoryProcess');

const electron = require('electron');
const app = electron.app;
const ipc = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const crashReporter = electron.crashReporter;
const Tray = electron.Tray;
const shell = electron.shell;
const dialog = electron.dialog;

var Positioner = require('electron-positioner');
var storage = require('electron-json-storage');
var appIcon;
var positioner; //holds cornerWindow position

let menu;
let template;
var mainWindow = null;
var cornerWindow = null;

var isDarwin = (process.platform === 'darwin');
var isLinux = (process.platform === 'linux');
var isWindows = (process.platform === 'win32');

crashReporter.start();

const ITEM_HEIGHT = 60;
const ITEM_HEIGHT_EXTRAS = 45;
const hasSetup = false;

var job = new Job();
var repoProcess = new RepositoryProcess();

const doKill = false;


if (process.env.NODE_ENV === 'development') {
  require('electron-debug')();
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('ready', () => {

  //killswitch
  if(doKill){
    storage.remove('repositories');
    return;
  }

  var value = new Promise(function(resolve, reject){
    return storage.get('repositories', function(err, data){
    if(err) reject(err);
    resolve(data);
    });
  })
  .then(function(data){

    if(data.length){
      start();
    }else{
      loadSetup();
    }

    return data;
  });

});


var loadSetup = function(event){

  if(cornerWindow){
    cornerWindow.close();
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 850,
    frame: false,
    title: 'Gitty'
  });
  mainWindow.loadURL(`file://${__dirname}/app/app.html`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipc.on('app-quit', function() {
    app.quit();
  });

  if (process.env.NODE_ENV === 'development') {
    //mainWindow.openDevTools();
  }

}

var start = function(event){

  if(mainWindow){
    mainWindow.close();
  }

  appIcon = new Tray( path.join( __dirname, '/images/gitty-icon-50.png' ));

   var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Repositories',
      type: 'radio',
      click: function(item, focusedWindow){
        cornerWindow.show();
      }
    },
    {
      label: 'Add Repositories',
      type: 'radio',
      click: onAddRepository
    },
    {
      label: 'Move Window',
      submenu: [
        {
          label: 'Top Left',
          click: function(event, index){
            if(cornerWindow && positioner){
              positioner.move('topLeft');
            }
          }
        },
        {
          label: 'Top Right',
          click: function(event, index){
            if(cornerWindow && positioner){
              positioner.move('topRight');
            }
          }
        },
        {
          label: 'Bottom Left',
          click: function(event, index){
            if(cornerWindow && positioner){
              positioner.move('bottomLeft');
            }
          }

        },
        {
          label: 'Bottom Right',
          click: function(event, index){
            if(cornerWindow && positioner){
              positioner.move('bottomRight');
            }
          }
        }
      ]
    },
    {
      label: 'Hide',
      type: 'radio',
      click: function(){
        cornerWindow.hide();
      }
    }
  ]);


  appIcon.setContextMenu(contextMenu)

  //create the corner window
  cornerWindow = new BrowserWindow({
    width: 600,
    height: 200,
    show: false,
    resizable: true,
    skipTaskbar: true,
    title: 'Gitty',
    frame: false });
  cornerWindow.on('closed', function(){
     cornerWindow = null;
     appIcon.destroy();
  });

  if (process.env.NODE_ENV === 'development') {
    //cornerWindow.openDevTools();
  }
  cornerWindow.loadURL(`file://${__dirname}/app/app.html#repositories`);
  cornerWindow.setMenuBarVisibility(false);
  cornerWindow.show();

  positioner = new Positioner(cornerWindow);
  positioner.move('topRight');

  cornerWindow.on('closed', () => {
    job.stop();
  })

  cornerWindow.on('blur', function(){
    //cornerWindow.hide();
  })

  storage.get('repositories', function(err,data){
    var paths = data;
    cornerWindow.setSize(600, calculateHeight(paths.length) );
    repoProcess.set(cornerWindow);
    job.set( repoProcess.getStatus() );
    job.start(30000);
  });

}

ipc.on('setup', loadSetup);

ipc.on('start', start);

ipc.on('resizeCornerWindow', function(event){
  storage.get('repositories', function(err,data){
    var paths = data;
    cornerWindow.setSize(600, calculateHeight(paths.length) );
  });
})


ipc.on('react-app-started', function(event, index){
  if(repoProcess){
    storage.get('repositories', function(err, data){
      if(cornerWindow){
        repoProcess.set(cornerWindow);
        cornerWindow.setSize(600, calculateHeight(data.length))
      }
      (repoProcess.getStatus())();

    })
  }
});

ipc.on('refreshRepositories', function(evt, index){
  if(repoProcess){
    repoProcess.getStatus()();
  }
})


ipc.on('git-pull', function(event, index){

  var gitProcess = new RepositoryProcess();
  gitProcess.set(cornerWindow);
  gitProcess.pullStorageIndex(index);

})


const onAddRepository = function(event, index){
  dialog.showOpenDialog({
    properties: [ 'openFile', 'openDirectory', 'multiSelections' ]
  }, function(pathArray){
    if(pathArray){
      cornerWindow.webContents.send('addRepositories', pathArray);
    }
  });

}

const calculateHeight = function(numItems){
  return numItems * ITEM_HEIGHT;
}

