/* vendor dependencies */
import React from 'react';
import cssModules from 'react-css-modules';

/* styles */
import styles from '../styles/home.css';

class Home extends React.Component {
  render() {
    return (
      <div>
        <div styleName="center">
          <h1>Say Hello to LetsMeet!</h1>
          <h4>Scheduling meetings made easy.</h4>
        </div>
        <div>
        </div>
      </div>
    );
  }
}

export default cssModules(Home, styles);
