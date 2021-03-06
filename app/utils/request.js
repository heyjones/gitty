
import * as repositoryActions from '../actions/repositories';
import * as ActionTypes from '../constants/ActionTypes';
import storage from 'electron-json-storage';
import _ from 'lodash';

const remote = require('remote').remote;

export default function({getState, dispatch}){
  return (next) => (action) => {

    const returnValue = next(action);

    switch(action.type){

      case ActionTypes.GET_REPOSITORIES:

        storage.get('repositories', function(err, data){
          if(err) throw err;
          if(!_.isEmpty(data))
            dispatch(repositoryActions.saveRepositories(data));
            dispatch(repositoryActions.refreshRepositories());
        });
        break;

      case ActionTypes.CLEAR_REPOSITORIES:
        storage.remove('repositories', function(err, data){
          if(err) throw err;
          dispatch(repositoryActions.reset())
        });
      break;

      case ActionTypes.SAVE_REPOSITORIES:
        dispatch(repositoryActions.setLoading());
        storage.set('repositories', action.data, function(err,data){
          dispatch(repositoryActions.finishLoading());
        });
      break;

      case ActionTypes.REMOVE_REPOSITORY:
        storage.get('repositories', function(err,data){
          if(err) throw err;

          var deleteIndex = action.data;
          data.splice(deleteIndex, 1);

          storage.set('repositories', data, (err, res) =>{

            if(data && data.length === 0){
              dispatch( repositoryActions.rerunSetup() );
            }else{
              dispatch( repositoryActions.resizeCornerWindow() );
            }
          });
        })

      break;

      case ActionTypes.ADD_REPOSITORIES:

        var options = action.options || {};

         storage.has('repositories', function(err,hasKey){
          if(err) throw err;
          if(hasKey){
            storage.get('repositories', function(err,data){

              var newStorage = data.concat(action.data);

              storage.set('repositories', newStorage, function(err,data){
                if(err) throw err;

                  dispatch(repositoryActions.finishLoading());

                  if( !options.noRefresh){
                    dispatch(repositoryActions.refreshRepositories() );
                  }
                  else{ console.log(2); }

              });
            });
          }else{
            storage.set('repositories', action.data, function(err,data){
              dispatch(repositoryActions.finishLoading());
            });
          }
        });
      break;

    }

    return returnValue;
  }
}
