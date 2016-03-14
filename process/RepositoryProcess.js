'use strict';

var ipcMain = require('electron').ipcMain;

var path = require('path');
var storage = require('electron-json-storage');
var simpleGit = require('simple-git');

var _ = require('lodash');

class RepositoryProcess {

  constructor(){

  }

  set(renderWindow){
  this.window = renderWindow || null;
  }

  getStatus(){
    console.log('JOB - getStatus()');
    return () => {
      console.log('JOB - running job');
      var self = this;

      try{
        storage.get('repositories', function(err, data){
          if(err) throw err;

          _.map(data, (repoPath, index) => {

            if(!repoPath) return;
            try{
              simpleGit( path.resolve(repoPath))
              .fetch()
              .status((err, status)=>{
                if(err) throw err;
                console.log('---------------------------');
                console.log('Git Status for: ', repoPath);
                console.log(status);
                //send status update
                if(self.window){
                  self.window.webContents.send('statusUpdate', {
                    index: index,
                    status: status
                  });
                }
              });
            }
            catch(err){
              console.log('error ', err);
            }
          })

        });
      }
      catch(err){
        console.error('JOB ERROR', err.stack)
      }
    }
  }

  getIndividualStatus(repoPath, index){

    simpleGit( path.resolve(repoPath))
    .fetch()
    .status((err, status)=>{
      if(err) throw err;
      console.log('--Individual Status-------------------------');
      console.log('Git Status for: ', repoPath);
      console.log(status);
      if(this.window){
        this.window.webContents.send('statusUpdate', {
          index: index,
          status: status
        });

        this.window.webContents.send('makeClean', {
          index: index
        });
      }
    });

  }

  pullStorageIndex(pullIndex){
    try{
      var self = this;
      storage.get('repositories', function(err, data){
        if(err) throw err;

        var pullPath = data[pullIndex];
        if(pullPath){
          simpleGit(pullPath)
          .pull(function(err, update){
            console.log('updateeee')
            console.log(update);;

            if(update && update.summary.changes){
              self.getIndividualStatus(pullPath, pullIndex)
            }
            else if(!update){
              self.window.webContents.send('makeDirty', {
                index: pullIndex
              })
            }
          })
        }
      });
    }
    catch(err){
      console.error('Error:', err.stack);
    }

  }

}


module.exports = RepositoryProcess;
