'use strict';

import React, { Component } from 'react';
import { Link } from 'react-router';
import styles from './RepositoryList.css';
import path from 'path';
import _ from 'lodash';
import cx from 'classnames';

import { bindActionCreators } from 'redux';
import {connect} from 'react-redux';

import * as repoActions from '../../actions/repositories' ;

class RepositoryListItem extends Component {

  constructor(props){
    super(props);
  }

  onDeleteRepository() {
    var {removeRepository} = this.props
    removeRepository(this.props.index);
  }

  render() {

    var {path, status} = this.props.data;
    var {ahead, behind, current, tracking} = status || {};
    var health;
    //path/to/the/repository

    //gives back just "repository"
    var shortPathName = path.match(/[^/]*$/)[0];

    if(ahead == 0 && behind == 0){
      health = "healthy";
    }else if(ahead < 5 && behind < 5){
      health = 'stomachache';
    }else{
      health = 'flu';
    }

    return (
      <div className={cx(styles.listItem, styles[health])}>

          <div className={true}>
            <label>{shortPathName}</label>
            <div className={styles.branchInfo}>
              <div className={styles.current}>Local Branch: <span>{current}</span></div>
              <div className={styles.tracking}>-> Tracks Remote: <span>{tracking}</span></div>
            </div>
          </div>

          <div className={styles.buttons}>
            <If condition={health !== 'healthy'}>
              <button className={styles.pull}>git pull</button>
            </If>
          </div>

          <div className={styles.status}>
            <If condition={health === 'healthy'}>
              <div className={styles.upToDate}>
                <span>Up to Date!</span>
              </div>
            <Else/>
              <div className={styles.ahead}>+{ahead}</div>
                <div className={styles.divider}>/</div>
              <div className={styles.behind}>-{behind}</div>
            </If>
          </div>
          <div className={styles.actions}>
            <i onClick={this.onDeleteRepository.bind(this)} className={cx(styles.actionButton, "fa fa-trash")}></i>
          </div>

      </div>
    );
  }

}

function mapDispatchToProps(dispatch){
  return bindActionCreators(repoActions, dispatch);
}

export default connect(null, mapDispatchToProps)(RepositoryListItem);
