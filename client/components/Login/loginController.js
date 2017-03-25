import React, { Component } from 'react';

import { isAuthenticated } from '../../util/auth';

class LoginController extends Component {
  async componentWillMount() {
    if (await isAuthenticated()) {
      this.props.handleAuthentication(true);
    } else {
      this.props.handleAuthentication(false);
    }
  }

  render() {
    return null;
  }
}

LoginController.propTypes = {
  handleAuthentication: React.PropTypes.func.isRequired,

};
export default LoginController;
