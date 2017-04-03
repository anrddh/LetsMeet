import React from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import moment from 'moment';
import autobind from 'autobind-decorator';
import colorsys from 'colorsys';
import jsonpatch from 'fast-json-patch';
import jz from 'jstimezonedetect';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';

import styles from './availability-grid.css';
import { getHours, getMinutes, removeZero } from '../../util/time-format';
import { getDaysBetween } from '../../util/dates.utils';
import { getTimesBetween } from '../../util/times.utils';
import enteravail from '../../assets/enteravail.gif';

class AvailabilityGrid extends React.Component {
  // Given two numbers num1 and num2, generates an array of all the numbers
  // between the two. num1 doesn't necessarily have to be smaller than num2.
  static generateRange(num1, num2) {
    let rangeStart;
    let rangeEnd;
    const range = [];

    if (num1 > num2) {
      rangeStart = num2;
      rangeEnd = num1;
    } else {
      rangeStart = num1;
      rangeEnd = num2;
    }

    for (let i = rangeStart; i <= rangeEnd; i += 1) range.push(i);

    return range;
  }

  static updateAvailabilityForRange(rowRange, colRange, updateAvail) {
    rowRange.forEach((i) => {
      colRange.forEach((j) => {
        const query = `div[data-row="${i}"][data-col="${j}"]`;
        const el = document.querySelector(query);
        updateAvail(el);
      });
    });
  }

  @autobind
  static addCellToAvailability(t) {
    t.style.background = 'purple';
  }

  @autobind
  static removeCellFromAvailability(t) {
    t.style.background = 'white';
  }

  constructor(props) {
    super(props);

    this.state = {
      allTimes: [],
      allTimesRender: [],
      allDates: [],
      allDatesRender: [],
      dateFormatStr: 'Do MMM ddd',
      availableOnDate: [],
      notAvailableOnDate: [],
      hourTime: [],
      openModal: false,
      rangeSelected: false,
      startSelection: false,
      mouseDownRow: null,
      mouseDownCol: null,
    };
  }

  componentWillMount() {
    const allDates = _.flatten(this.props.dates.map(({ fromDate, toDate }) =>
      getDaysBetween(fromDate, toDate),
    ));

    const allTimes = _.flatten(
      [this.props.dates[0]].map(({ fromDate, toDate }) =>
        getTimesBetween(fromDate, toDate),
      ),
    );

    const allDatesRender = allDates
      .map(date => moment(date).format(this.state.dateFormatStr));

    const allTimesRender = allTimes
      .map(time => moment(time).format('hh:mm a'));

    allTimesRender.pop();

    const hourTime = allTimesRender
      .filter(time => String(time).split(':')[1].split(' ')[0] === '00');

    const lastHourTimeEl = hourTime.slice(-1)[0];
    const lastAllTimesRenderEl = allTimesRender.slice(-1)[0];

    if (getHours(lastHourTimeEl) !== getHours(lastAllTimesRenderEl) || getMinutes(lastAllTimesRenderEl) === 45) {
      hourTime.push(
        moment(new Date())
        .set('h', getHours(lastHourTimeEl))
        .set('m', getMinutes(lastHourTimeEl))
        .add(1, 'h')
        .format('hh:mm a'),
      );
    }

    this.setState({
      allDates,
      allTimes,
      allDatesRender,
      allTimesRender,
      hourTime,
    });
  }

  componentDidMount() {
    if (this.props.heatmap) this.renderHeatmap();

    if (this.props.myAvailability && this.props.myAvailability.length > 0) {
      this.renderAvail();
    }

    // Offset the grid-hour row if the event starts with a date that's offset by
    // 15/30/45 minutes.
    const gridHour = document.querySelector('.grid-hour');
    const { allTimesRender } = this.state;

    if (getMinutes(allTimesRender[0]) === 15) {
      gridHour.setAttribute('style', 'margin-left: 50.6px !important');
    } else if (getMinutes(allTimesRender[0]) === 30) {
      gridHour.setAttribute('style', 'margin-left: 38px !important');
    } else if (getMinutes(allTimesRender[0]) === 45) {
      gridHour.setAttribute('style', 'margin-left: 25.2px !important');
    }

    // Change the border of the cell if it's minutes = 0 or 30 to help visually
    // separate 15 minute blocks from 30 minute and 1 hour blocks.
    const cells = Array.from(document.querySelectorAll('.cell'));

    cells.forEach((cell) => {
      if (getMinutes(cell.getAttribute('data-time')) === 0) {
        cell.style.borderLeft = '1px solid rgb(120, 120, 120)';
      } else if (getMinutes(cell.getAttribute('data-time')) === 30) {
        cell.style.borderLeft = '1px solid #c3bebe';
      }
    });

    // Check if two adjacent grid hours labels are consecutive or not. If not,
    // then split the grid at this point.
    const hourTime = this.state.hourTime.slice(0);

    for (let i = 0; i < hourTime.length; i += 1) {
      if (hourTime[i + 1]) {
        const date = moment(new Date());
        const nextDate = moment(new Date());

        date.set('h', getHours(hourTime[i]));
        date.set('m', getMinutes(hourTime[i]));

        nextDate.set('h', getHours(hourTime[i + 1]));
        nextDate.set('m', getMinutes(hourTime[i + 1]));

        // date.add (unfortunately) mutates the original moment object. Hence we
        // don't add an hour to the object again when it's inserted into
        // this.state.hourTime.
        if (date.add(1, 'h').format('hh:mm') !== nextDate.format('hh:mm')) {
          const query = `.cell[data-time='${nextDate.format('hh:mm a')}']`;
          const cells = Array.from(document.querySelectorAll(query));
          cells.forEach((cell) => { cell.style.marginLeft = '50px'; });

          // 'hack' (the modifyHourTime function) to use setState in
          // componentDidMount and bypass eslint. Using setState in
          // componentDidMount couldn't be avoided in this case.
          this.modifyHourTime(hourTime, date, i);
        }
      }
    }
  }

  @autobind
  getFromToForEl(el) {
    const {
      allTimesRender,
      allDatesRender,
      allDates,
      allTimes,
    } = this.state;

    const timeIndex = allTimesRender.indexOf(el.getAttribute('data-time'));
    const dateIndex = allDatesRender.indexOf(el.getAttribute('data-date'));

    const date = moment(allDates[dateIndex]).get('date');

    const from = moment(allTimes[timeIndex]).set('date', date)._d;
    const to = moment(allTimes[timeIndex + 1]).set('date', date)._d;

    return [from.toISOString(), to.toISOString()];
  }

  modifyHourTime(hourTime, date, i) {
    // inserts the formatted date object at the 'i+1'th index in
    // this.state.hourTime.
    this.setState({
      hourTime: [
        ...hourTime.slice(0, i + 1),
        date.format('hh:mm a'),
        ...hourTime.slice(i + 1),
      ],
    });
  }

  @autobind
  handleCancelBtnClick() {
    this.props.closeGrid();
  }

  @autobind
  handleCellMouseDown(ev) {
    if (this.props.heatmap) return;

    let { startSelection } = this.state;
    const {
      rangeSelected,
    } = this.state;
    const cellBackground = getComputedStyle(ev.target)['background-color'];
    const cellIsSelected = cellBackground !== 'rgba(0, 0, 0, 0)';

    if (!startSelection) {
      this.updateCellAvailability(ev);
    } else {
      const {
        generateRange,
        updateAvailabilityForRange,
      } = this.constructor;

      let updateAvail;
      if (rangeSelected) {
        updateAvail = this.constructor.removeCellFromAvailability;
      } else {
        updateAvail = this.constructor.addCellToAvailability;
      }

      const thisRow = Number(ev.target.getAttribute('data-row'));
      const thisCol = Number(ev.target.getAttribute('data-col'));
      const initialRow = this.state.mouseDownRow;
      const initialCol = this.state.mouseDownCol;

      const rowRange = generateRange(thisRow, initialRow);
      const colRange = generateRange(thisCol, initialCol);

      updateAvailabilityForRange(rowRange, colRange, updateAvail);

      this.setState({
        lastMouseDownRow: thisRow,
        lastMouseDownCol: thisCol,
      });
    }

    startSelection = !startSelection;

    this.setState({
      startSelection,
      mouseDownRow: Number(ev.target.getAttribute('data-row')),
      mouseDownCol: Number(ev.target.getAttribute('data-col')),
      rangeSelected: cellIsSelected,
    });
  }

  @autobind
  handleCellMouseOver(ev) {
    const cellBackgroundColor = getComputedStyle(ev.target)['background-color'];
    const cellIsSelected = cellBackgroundColor !== 'rgba(0, 0, 0, 0)';

    if (!this.props.heatmap || !cellIsSelected) return;

    const { allTimesRender, allDatesRender, allDates, allTimes } = this.state;
    const formatStr = 'Do MMMM YYYY hh:mm a';
    const availableOnDate = [];
    const notAvailableOnDate = [];

    const participants = JSON.parse(JSON.stringify(this.props.participants))
      .filter(participant => participant.availability)
      .map((participant) => {
        participant.availability = participant.availability
          .map(avail => new Date(avail[0]))
          .map(avail => moment(avail).format(formatStr));
        return participant;
      });

    const timeIndex = allTimesRender.indexOf(
      ev.target.getAttribute('data-time'),
    );

    const dateIndex = allDatesRender.indexOf(
      ev.target.getAttribute('data-date'),
    );

    const date = moment(allDates[dateIndex]).get('date');
    const cellFormatted = moment(allTimes[timeIndex])
      .set('date', date)
      .format(formatStr);

    participants.forEach((participant) => {
      console.log(participant);
      if (participant.availability.indexOf(cellFormatted) > -1) {
        availableOnDate.push({
          name: participant.name,
          _id: participant._id,
        });
      } else {
        notAvailableOnDate.push({
          name: participant.name,
          _id: participant._id,
        });
      }
    });

    this.setState({ availableOnDate, notAvailableOnDate });
  }

  @autobind
  handleCellMouseLeave() {
    this.setState({ availableOnDate: [], notAvailableOnDate: [] });
  }

  @autobind
  updateCellAvailability(e) {
    const cellBackgroundColor = getComputedStyle(e.target)['background-color'];
    const cellIsSelected = cellBackgroundColor !== 'rgb(128, 0, 128)';

    if (cellIsSelected) this.constructor.addCellToAvailability(e.target);
    else this.constructor.removeCellFromAvailability(e.target);
  }

  @autobind
  async submitAvailability() {
    const { allDates, allTimes, allDatesRender, allTimesRender } = this.state;
    const availability = [];

    $('.cell').each((i, el) => {
      if ($(el).css('background-color') === 'rgb(128, 0, 128)') {
        const timeIndex = allTimesRender.indexOf($(el).attr('data-time'));
        const dateIndex = allDatesRender.indexOf($(el).attr('data-date'));

        const date = moment(allDates[dateIndex]).get('date');

        const from = moment(allTimes[timeIndex]).set('date', date)._d;
        const to = moment(allTimes[timeIndex + 1]).set('date', date)._d;

        availability.push([from, to]);
      }
    });

    const { _id } = this.props.user;
    const event = JSON.parse(JSON.stringify(this.props.event));
    const observerEvent = jsonpatch.observe(event);
    /**
     * first check if cur exists as a particpant
     * if is not add the curUser as participant
    **/
    const isParticipant = event.participants.filter(participant => participant.userId === _id);
    if (isParticipant.length === 0) {
      const { user } = this.props;
      const { name, avatar, _id: userId } = user;
      const participant = { name, avatar, userId };
      event.participants.push(participant);
    }
    event.participants = event.participants.map((user) => {
      if (user.userId === _id) {
        user.availability = availability;
      }
      return user;
    });

    const patches = jsonpatch.generate(observerEvent);
    await this.props.submitAvail(patches);
  }

  @autobind
  editAvailability() {
    this.props.editAvail();
  }

  renderHeatmap() {
    const availabilityLength = this.props.availability.filter(av => av).length;
    const saturationDivisions = 100 / availabilityLength;
    const saturations = [];

    for (let i = 0; i <= 100; i += saturationDivisions) {
      saturations.push(i);
    }

    const colors = saturations.map(saturation => colorsys.hsvToHex({
      h: 271,
      s: saturation,
      v: 100,
    }));

    const formatStr = 'Do MMMM YYYY hh:mm a';
    const { allTimesRender, allDatesRender, allDates, allTimes } = this.state;
    const availabilityNum = {};
    const cells = document.querySelectorAll('.cell');

    let flattenedAvailability = _.flatten(this.props.availability);

    flattenedAvailability = flattenedAvailability
      .filter(avail => avail)
      .map(avail => new Date(avail[0]))
      .map(avail => moment(avail).format(formatStr));

    flattenedAvailability.forEach((avail) => {
      if (availabilityNum[avail]) availabilityNum[avail] += 1;
      else availabilityNum[avail] = 1;
    });

    cells.forEach((cell) => {
      const timeIndex = allTimesRender.indexOf(cell.getAttribute('data-time'));
      const dateIndex = allDatesRender.indexOf(cell.getAttribute('data-date'));

      const date = moment(allDates[dateIndex]).get('date');
      const cellFormatted = moment(allTimes[timeIndex])
        .set('date', date)
        .format(formatStr);

      cell.style.background = colors[availabilityNum[cellFormatted]];
    });
  }

  renderAvail() {
    const cells = document.querySelectorAll('.cell');
    const { allTimesRender, allDatesRender, allDates, allTimes } = this.state;
    const formatStr = 'Do MMMM YYYY hh:mm a';
    const myAvailabilityFrom = this.props.myAvailability
      .map(avail => new Date(avail[0]))
      .map(avail => moment(avail).format(formatStr));

    cells.forEach((cell) => {
      const timeIndex = allTimesRender.indexOf(cell.getAttribute('data-time'));
      const dateIndex = allDatesRender.indexOf(cell.getAttribute('data-date'));

      const date = moment(allDates[dateIndex]).get('date');
      const cellFormatted = moment(allTimes[timeIndex])
        .set('date', date)
        .format(formatStr);

      if (myAvailabilityFrom.indexOf(cellFormatted) > -1) {
        this.constructor.addCellToAvailability(cell);
      }
    });
  }

  renderDialog() {
    const { openModal } = this.state;
    const actions = [
      <FlatButton
        label="close"
        primary
        onTouchTap={() => this.setState({ openModal: false })}
      />,
    ];
    const inlineStyles = {
      modal: {
        content: {
          width: '550px',
          maxWidth: '550px',
        },
        bodyStyle: {
          paddingTop: 10,
          fontSize: '25px',
        },
      },
    };

    return (
      <Dialog
        contentStyle={inlineStyles.modal.content}
        bodyStyle={inlineStyles.modal.bodyStyle}
        actions={actions}
        modal
        open={openModal}
      >
        <h4>This is how you can enter and remove your availablity:</h4>
        <img src={enteravail} alt="entering availablity gif" />
      </Dialog>
    );
  }

  render() {
    const { allDatesRender, allTimesRender, hourTime } = this.state;
    const { dates } = this.props;
    return (
      <div styleName="Column">
        <div styleName="row">
          <FlatButton
            primary
            onClick={() => this.setState({ openModal: true })}
          >
            How do I use the grid?
          </FlatButton>
        </div>
        <div styleName="selectbox" id="selectbox" />
        {hourTime.map(time => (
          <p
            key={time}
            className="grid-hour"
            styleName="grid-hour"
          >{`${removeZero(time.split(':')[0])} ${time.split(' ')[1]}`}</p>
        ))}
        {allDatesRender.map((date, i) => (
          <div key={date} className="grid-row" styleName="row">
            <div styleName="cell-aside">
              {date}
            </div>
            {allTimesRender.map((time, j) => {
              let disabled = '';
              let styleName = 'cell';

              dates.forEach(({ fromDate, toDate }) => {
                const { dateFormatStr } = this.state;
                fromDate = moment(fromDate);
                toDate = moment(toDate);
                const fromDateFormatted = fromDate.format('hh:mm a');
                const toDateFormatted = toDate.format('hh:mm a');

                const fromDateDateFormat = fromDate.format(dateFormatStr);
                // Boolean: If date in fromDate === date => True; Else => False
                const fromDateIsDate = fromDateDateFormat === date;

                // Boolean: If time in fromDate > time => True; Else => False
                const fromDateAfterTime = moment(fromDateFormatted, 'hh:mm a')
                  .isAfter(moment(time, 'hh:mm a'));

                const toDateDateFormat = toDate.format(dateFormatStr);
                const toDateIsDate = toDateDateFormat === date;
                const toDateBeforeTime = moment(toDateFormatted, 'hh:mm a')
                  .isBefore(moment(time, 'hh:mm a'));

                const fromDateInvalid = fromDateIsDate && fromDateAfterTime;
                const toDateInvalid = toDateIsDate && toDateBeforeTime;

                if (fromDateInvalid || toDateInvalid) {
                  disabled = 'disabled';
                  styleName = 'disabled';
                }
              });

              return (
                <div
                  key={`${date} ${time}`}
                  styleName={`${styleName}`}
                  data-time={time}
                  data-date={date}
                  data-row={i}
                  data-col={j}
                  className={`cell ${disabled}`}
                  onMouseDown={this.handleCellMouseDown}
                  onMouseOver={this.handleCellMouseOver}
                  onMouseLeave={this.handleCellMouseLeave}
                />
              );
            })}
          </div>
        ))}
        <p styleName="info">
          <em>Each time slot represents 15 minutes.</em>
        </p>
        <p styleName="info">
          <em>
            Displaying all times in your local timezone: {jz.determine().name()}
          </em>
        </p>
        <br />
        <div className="center">
          {this.props.heatmap ?
            <RaisedButton
              primary
              label="Edit Availability"
              onClick={this.editAvailability}
            />
            :
            <div>
              <RaisedButton
                primary
                label="Submit"
                onClick={this.submitAvailability}
              />
              <RaisedButton
                primary
                label="Cancel"
                styleName="cancelButton"
                onClick={this.handleCancelBtnClick}
              />
            </div>
          }
        </div>
        <div styleName="hover-container">
          {this.state.availableOnDate.length > 0 ?
            <div styleName="hover-available">
              <h5>Available</h5>
              {this.state.availableOnDate.map(participant =>
                <h6 key={participant._id}>{participant.name}</h6>,
              )}
            </div> :
            null
          }
          {this.state.notAvailableOnDate.length > 0 ?
            <div styleName="hover-available">
              <h5>Unavailable</h5>
              {this.state.notAvailableOnDate.map(participant =>
                <h6 key={participant._id}>{participant.name}</h6>,
              )}
            </div> :
            null
          }
        </div>
        {this.renderDialog()}
      </div>
    );
  }
}

AvailabilityGrid.defaultProps = {
  heatmap: false,
  user: {},
  event: {},
  myAvailability: [],
  participants: [],
  submitAvail: () => { console.log('submitAvail func not passed in!'); },
  editAvail: () => { console.log('ediAvail func not passed in!'); },
  closeGrid: () => { console.log('closeGrid func not passed in!'); },
};

AvailabilityGrid.propTypes = {
  dates: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
  heatmap: React.PropTypes.bool,
  user: React.PropTypes.shape({
    _id: React.PropTypes.string,
    name: React.PropTypes.string,
    avatar: React.PropTypes.string,
  }),
  availability: React.PropTypes.arrayOf(React.PropTypes.array).isRequired,
  submitAvail: React.PropTypes.func,
  closeGrid: React.PropTypes.func,
  editAvail: React.PropTypes.func,
  myAvailability: React.PropTypes.arrayOf(React.PropTypes.string),
  participants: React.PropTypes.arrayOf(React.PropTypes.object),
  event: React.PropTypes.shape({
    participants: React.PropTypes.array,
  }),
};

export default cssModules(AvailabilityGrid, styles);
