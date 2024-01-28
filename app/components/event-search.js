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
  @tracked filter = this.qp.filter;
  @tracked eventType = this.find(EVENT_TYPES, 'eventType');
  @tracked group = this.qp.group;
  @tracked sDesc = this.qp.sDesc;
  @tracked lDesc = this.qp.lDesc;
  @tracked system = this.qp.system;
  @tracked edition = this.qp.edition;
  @tracked minPlayersMin = this.range('minPlayers', 0);
  @tracked minPlayersMax = this.range('minPlayers', 1);
  @tracked maxPlayersMin = this.range('maxPlayers', 0);
  @tracked maxPlayersMax = this.range('maxPlayers', 1);
  @tracked ageReq = this.find(AGE_GROUPS, 'ageReq');
  @tracked exp = this.find(EXP, 'exp');
  @tracked materials = this.qp.materials;
  @tracked startStart = this.range('start', 0);
  @tracked startEnd = this.range('start', 1);
  @tracked durationMin = this.range('duration', 0);
  @tracked durationMax = this.range('duration', 1);
  @tracked endStart = this.range('end', 0);
  @tracked endEnd = this.range('end', 1);
  @tracked gameMasters = this.qp.gameMasters;
  @tracked website = this.qp.website;
  @tracked email = this.qp.email;
  @tracked tournament = this.qp.tournament;
  @tracked roundMin = this.range('round', 0);
  @tracked roundMax = this.range('round', 1);
  @tracked totalRoundsMin = this.range('totalRounds', 0);
  @tracked totalRoundsMax = this.range('totalRounds', 1);
  @tracked minTimeMin = this.range('minTime', 0);
  @tracked minTimeMax = this.range('minTime', 1);
  @tracked registration = this.find(REGISTRATION, 'registration');
  @tracked cost = this.qp.cost;
  @tracked location = this.qp.location;
  @tracked room = this.qp.room;
  @tracked table = this.qp.table;
  @tracked category = this.find(CATEGORY, 'category'); // TODO
  @tracked availableMin = this.range('available', 0);
  @tracked availableMax = this.range('available', 1);
  @tracked lastModifiedStart = this.range('lastModified', 0);
  @tracked lastModifiedEnd = this.range('lastModified', 1);

  @action
  search() {
    const queryParams = {};
    const setQP = (prop) => {
      const val = this[prop];

      if (val?.length === 0) {
        queryParams[prop] = DEFAULT_VALUE;
        return;
      }

      // if (prop === 'category') {
      //   queryParams.category = val === 'none' ? '' : val;
      //   return;
      // }

      queryParams[prop] = val;
    };

    const setRangeQP = (prop) => {
      const min = this[`${prop}Min`];
      const max = this[`${prop}Max`];

      if (undefOrEmpty(min) && undefOrEmpty(max)) {
        queryParams[prop] = DEFAULT_VALUE;
      } else {
        queryParams[prop] = `${min || ''},${max || ''}`;
      }
    };

    const setDateRangeQP = (prop) => {
      const start = this[`${prop}Start`];
      const end = this[`${prop}End`];

      if (undefOrEmpty(start) && undefOrEmpty(end)) {
        queryParams[prop] = DEFAULT_VALUE;
      } else {
        queryParams[prop] = `${start || ''},${end || ''}`;
      }
    };

    setQP('filter');
    setQP('title');
    setQP('eventType');
    setQP('group');
    setQP('sDesc');
    setQP('lDesc');
    setQP('system');
    setQP('edition');
    setRangeQP('minPlayers');
    setRangeQP('maxPlayers');
    setQP('ageReq');
    setQP('exp');
    setQP('materials');
    setDateRangeQP('start');
    setRangeQP('duration');
    setDateRangeQP('end');
    setQP('gameMasters');
    setQP('website');
    setQP('email');
    setQP('tournament');
    setRangeQP('round');
    setRangeQP('totalRounds');
    setRangeQP('minTime');
    setQP('registration');
    setRangeQP('cost');
    setQP('location');
    setQP('room');
    setQP('table');
    setQP('category');
    setRangeQP('available');
    setDateRangeQP('lastModified');

    this.router.transitionTo('search', { queryParams });
  }

  onEnter(event) {
    console.log(event);
  }
}
