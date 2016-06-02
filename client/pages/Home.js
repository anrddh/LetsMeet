/* vendor dependencies */
import React from 'react';
import cssModules from 'react-css-modules';

/* styles */
import styles from '../styles/home.css';

import mainBannerImg from '../images/main-banner.jpg';
import dashboardBannerImg from '../images/dashboard-banner.jpg';

class Home extends React.Component {
  render() {
    return (
      <section styleName="wrapper">
        <article styleName="main">
          <h1>Say Hello to LetsMeet!</h1>
          <h4>Scheduling meetings made easy.</h4>
          <img src={mainBannerImg} role="presentation" styleName="main-banner" />
        </article>
        <article styleName="dashboard">
          <img src={dashboardBannerImg} role="presentation" styleName="dashboard-banner" />
          <aside styleName="dashboard-aside">
            <h2>One dashboard to rule 'em all</h2>
            <h4>View all your events in one centralized location</h4>
          </aside>
        </article>
      </section>
    );
  }
}

export default cssModules(Home, styles);
