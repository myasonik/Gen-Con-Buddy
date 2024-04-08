import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { DEFAULT_VALUE } from 'ember';
import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from 'gen-con-buddy/utils/enums';

const undefOrEmpty = (val) => typeof val === 'undefined' || val.length === 0;

export default class EventSearchComponent extends Component {
  EVENT_TYPES = EVENT_TYPES;
  AGE_GROUPS = AGE_GROUPS;
  EXP = EXP;
  REGISTRATION = REGISTRATION;
  CATEGORY = CATEGORY;

  find = (options, qp) => {
    return Object.keys(options).find((val) => val === this.qp[qp]);
  };

  range = (prop, i) => {
    return this.qp[prop]?.split(',')[i];
  };

  @service router;

  @tracked qp = this.router.currentRoute.queryParams;
  @tracked limit = this.qp.limit;
  @tracked filter = this.qp.filter;
  @tracked eventType = this.find(EVENT_TYPES, 'eventType');
  @tracked gameId = this.qp.gameId;
  @tracked group = this.qp.group;
  @tracked shortDescription = this.qp.shortDescription;
  @tracked longDescription = this.qp.longDescription;
  @tracked gameSystem = this.qp.gameSystem;
  @tracked rulesEdition = this.qp.rulesEdition;
  @tracked minPlayersMin = this.range('minPlayers', 0);
  @tracked minPlayersMax = this.range('minPlayers', 1);
  @tracked maxPlayersMin = this.range('maxPlayers', 0);
  @tracked maxPlayersMax = this.range('maxPlayers', 1);
  @tracked ageRequired = this.find(AGE_GROUPS, 'ageRequired');
  @tracked experienceRequired = this.find(EXP, 'experienceRequired');
  @tracked materialsProvided = this.qp.materialsProvided;
  @tracked startDateTimeStart = this.range('startDateTime', 0);
  @tracked startDateTimeEnd = this.range('startDateTime', 1);
  @tracked durationMin = this.range('duration', 0);
  @tracked durationMax = this.range('duration', 1);
  @tracked endDateTimeStart = this.range('endDateTime', 0);
  @tracked endDateTimeEnd = this.range('endDateTime', 1);
  @tracked gmNames = this.qp.gmNames;
  @tracked website = this.qp.website;
  @tracked email = this.qp.email;
  @tracked tournament = this.qp.tournament;
  @tracked roundMin = this.range('roundNumber', 0);
  @tracked roundMax = this.range('roundNumber', 1);
  @tracked totalRoundsMin = this.range('totalRounds', 0);
  @tracked totalRoundsMax = this.range('totalRounds', 1);
  @tracked minimumPlayTimeMin = this.range('minimumPlayTime', 0);
  @tracked minimumPlayTimeMax = this.range('minimumPlayTime', 1);
  @tracked attendeeRegistration = this.find(
    REGISTRATION,
    'attendeeRegistration',
  );
  @tracked cost = this.qp.cost;
  @tracked location = this.qp.location;
  @tracked roomName = this.qp.roomName;
  @tracked tableNumber = this.qp.tableNumber;
  @tracked specialCategory = this.find(CATEGORY, 'specialCategory'); // TODO
  @tracked availableMin = this.range('ticketsAvailable', 0);
  @tracked availableMax = this.range('ticketsAvailable', 1);
  @tracked lastModifiedStart = this.range('lastModified', 0);
  @tracked lastModifiedEnd = this.range('lastModified', 1);

  @action
  search() {
    const queryParams = {
      limit: 1000,
    };

    const setQP = (prop) => {
      const val = this[prop];

      if (val?.length === 0) {
        queryParams[prop] = DEFAULT_VALUE;
        return;
      }

      queryParams[prop] = val;
    };

    const setRangeQP = (prop) => {
      const min = this[`${prop}Min`];
      const max = this[`${prop}Max`];

      if (undefOrEmpty(min) && undefOrEmpty(max)) {
        queryParams[prop] = DEFAULT_VALUE;
      } else {
        queryParams[prop] = `[${min || ''},${max || ''}]`;
      }
    };

    const setDateRangeQP = (prop) => {
      const start = this[`${prop}Start`];
      const end = this[`${prop}End`];

      if (undefOrEmpty(start) && undefOrEmpty(end)) {
        queryParams[prop] = DEFAULT_VALUE;
      } else {
        const formattedStart = start ? `${start}:00Z` : '';
        const formattedEnd = end ? `${end}:00Z` : '';

        queryParams[prop] = `[${formattedStart},${formattedEnd}]`;
      }
    };

    setQP('limit');
    setQP('filter');
    setQP('gameId');
    setQP('title');
    setQP('eventType');
    setQP('group');
    setQP('shortDescription');
    setQP('longDescription');
    setQP('gameSystem');
    setQP('rulesEdition');
    setRangeQP('minPlayers');
    setRangeQP('maxPlayers');
    setQP('ageRequired');
    setQP('experienceRequired');
    setQP('materialsProvided');
    setDateRangeQP('startDateTime');
    setRangeQP('duration');
    setDateRangeQP('endDateTime');
    setQP('gmNames');
    setQP('website');
    setQP('email');
    setQP('tournament');
    setRangeQP('roundNumber');
    setRangeQP('totalRounds');
    setRangeQP('minimumPlayTime');
    setQP('attendeeRegistration');
    setRangeQP('cost');
    setQP('location');
    setQP('roomName');
    setQP('tableNumber');
    setQP('specialCategory');
    setRangeQP('ticketsAvailable');
    setDateRangeQP('lastModified');

    queryParams.limit = 500;

    this.router.transitionTo('search', { queryParams });
  }

  onEnter(event) {
    console.log(event);
  }
}
