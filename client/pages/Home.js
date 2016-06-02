/* vendor dependencies */
import React from 'react';
import cssModules from 'react-css-modules';

/* styles */
import styles from '../styles/home.css';

import mainBannerImg from '../images/main-banner.jpg';
import dashboardBannerImg from '../images/dashboard-banner.jpg';
import bestTimeBannerImg from '../images/best-time-banner.jpg';

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
          <aside styleName="dashboard-aside">
            <h2>One dashboard to rule 'em all</h2>
            <h4>View all your events in one centralized location</h4>
          </aside>
          <div styleName="dashboard-img-wrapper">
            <img src={dashboardBannerImg} role="presentation" styleName="dashboard-img" />
          </div>
        </article>
        <article styleName="best-time">
          <aside styleName="best-time-aside">
            <h2>Best Date and Time</h2>
            <h4>Auto-determined for you</h4>
          </aside>
          <div styleName="best-time-img-wrapper">
            <img src={bestTimeBannerImg} role="presentation" styleName="best-time-img" />
          </div>
        </article>
        <article styleName="timezones">
          <aside styleName="timezones-aside">
            <h2>Inbuilt Timezone Conversion</h2>
            <h4>For frustration-free global meetings</h4>
          </aside>
          <div styleName="timezones-img-wrapper">
            <img src={dashboardBannerImg} role="presentation" styleName="timezones-img" />
          </div>
        </article>
      </section>
    );
  }
}

export default cssModules(Home, styles);
