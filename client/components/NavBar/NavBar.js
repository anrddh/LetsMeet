import React, { Component } from 'react';
import autobind from 'autobind-decorator';
import FlatButton from 'material-ui/FlatButton';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Avatar from 'material-ui/Avatar';
import RaisedButton from 'material-ui/RaisedButton';
import { browserHistory } from 'react-router';
import Toggle from 'material-ui/Toggle';

import NotificationBar from '../NotificationBar/NotificationBar';
import avatarPlaceHolder from '../../assets/Profile_avatar_placeholder_large.png';

class NavBar extends Component {
  constructor(props) {
    super(props);
    const { isAuthenticated, curUser, showPastEvents } = this.props;
    this.state = {
      userAvatar: avatarPlaceHolder,
      isAuthenticated,
      curUser,
      conditionalHomeLink: '/',
      toggleVisible: true,
      showPastEvents,

    };
  }

  componentWillMount() {
    const { location, curUser, isAuthenticated, showPastEvents } = this.props;
    this.setState({ curUser, isAuthenticated, userAvatar: curUser.Avatar, showPastEvents });
    this.MenuVisibility(location);
  }

  componentWillReceiveProps(nextProps) {
    const { location, curUser, isAuthenticated, showPastEvents } = nextProps;
    this.MenuVisibility(location);
    this.setState({ curUser, isAuthenticated, userAvatar: curUser.avatar, showPastEvents });
  }

  MenuVisibility(location) {
    if (location.pathname === '/dashboard') {
      this.setState({ toggleVisible: true });
    } else {
      this.setState({ toggleVisible: false });
    }
  }

  @autobind
  handleAuthClick() {
    this.props.cbOpenLoginModal('/dashboard');
  }

  @autobind
  handleDashboardClick() {
    browserHistory.push('/dashboard');
  }

  @autobind
  handleFilterToggle(ev, isInputChecked) {
    this.props.cbFilter(isInputChecked);
  }

  renderLastGroup() {
    const { toggleVisible } = this.state;
    const styles = {
      button: {
        fontSize: '15px',
        color: '#ffffff',
        margin: 0,
        border: 0,
      },
      loginButton: {
        color: '#ffffff',
        primary: true,
        fontSize: '22px',
        backgroundColor: 'transparent',
        boxShadow: '0px',
      },
      TollbarGroup: {
        paddingRight: '5%',
      },
      block: {
        maxWidth: 400,
      },
      toggle: {
        marginTop: 0,
        paddingLeft: 0,
        marginRight: 4,
        label: {
          color: 'white',
          fontSize: '18px',
          width: 100,
        },
        thumbSwitched: {
          backgroundColor: 'red',
        },
      },
    };
    const { isAuthenticated, curUser, userAvatar, showPastEvents } = this.state;

    if (isAuthenticated) {
      return (
        <ToolbarGroup
          lastChild
          style={styles.TollbarGroup}
        >
          <NotificationBar curUser={curUser} />
          <div style={styles.block}>
            {toggleVisible ?
              <Toggle
                label={'Past Events'}
                toggled={showPastEvents}
                style={styles.toggle}
                labelStyle={styles.toggle.label}
                thumbSwitchedStyle={styles.toggle.thumbSwitched}
                onToggle={this.handleFilterToggle}
              />
              : null
            }
          </div>
          {!toggleVisible ?
            <FlatButton
              style={styles.button}
              onTouchTap={this.handleDashboardClick}
            >
              Dashboard
          </FlatButton>
            : null
          }
          <FlatButton style={styles.button} href={'/api/auth/logout'}>
            Logout
          </FlatButton>
          <Avatar
            src={userAvatar}
          />
        </ToolbarGroup>
      );
    }
    return (
      <ToolbarGroup
        lastChild
        style={styles.TollbarGroup}
      >
        <RaisedButton
          style={styles.loginButton}
          backgroundColor="transparent"
          onTouchTap={this.handleAuthClick}
        >Login</RaisedButton>
      </ToolbarGroup>
    );
  }

  render() {
    const styles = {
      toolBar: {
        height: '65px',
        backgroundColor: '#006400',
      },
      button: {
        fontSize: '35px',
        color: '#ffffff',
        fontFamily: 'saxMono',
      },
    };

    return (
      <Toolbar
        style={styles.toolBar}
      >
        <ToolbarGroup
          firstChild
          style={{ paddingLeft: '2%' }}
        >
          <FlatButton
            style={styles.button}
            href={this.state.conditionalHomeLink}
            hoverColor={'rgba(0, 0, 0, 0)'}
          >
            Lets Meet
          </FlatButton>
        </ToolbarGroup >
        {this.renderLastGroup()}
      </Toolbar>
    );
  }
}

NavBar.propTypes = {
  location: React.PropTypes.object,
  cbFilter: React.PropTypes.func,
  isAuthenticated: React.PropTypes.bool,
  curUser: React.PropTypes.object,
  cbOpenLoginModal: React.PropTypes.func,
  showPastEvents: React.PropTypes.bool,
};

export default NavBar;
