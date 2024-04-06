import {
  applyEmberDataSerializers,
  discoverEmberDataModels,
} from 'ember-cli-mirage';
import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from 'gen-con-buddy/utils/enums';
import { createServer } from 'miragejs';

export default function (config) {
  let finalConfig = {
    ...config,
    models: {
      ...discoverEmberDataModels(config.store),
      ...config.models,
    },
    serializers: applyEmberDataSerializers(config.serializers),
    routes,
  };

  return createServer(finalConfig);
}

function routes() {
  this.get('/search', ({ events }, { queryParams }) => {
    return events.all().filter((event) => {
      let filterEvent = true;
      const propIncluded = (prop, eventProp = prop) => {
        if (
          queryParams[prop] &&
          !event[eventProp].includes(queryParams[prop])
        ) {
          filterEvent = false;
        }
      };
      const propType = (options, prop, eventProp = prop) => {
        const val = queryParams[prop];

        // if (prop === 'category' && val === '' && event[eventProp] === '') {
        //   filterEvent = false;
        //   return;
        // }

        if (val && options[val] !== event[eventProp]) {
          filterEvent = false;
        }
      };
      const propInRange = (prop, eventProp = prop) => {
        const val = queryParams[prop];

        if (val) {
          let [min, max] = val.split(',');

          if (min.length) {
            min = parseInt(min, 10);

            if (event[eventProp] < min) filterEvent = false;
          }

          if (max.length) {
            max = parseInt(max, 10);

            if (event[eventProp] > max) filterEvent = false;
          }
        }
      };
      const propIs = (prop, eventProp = prop) => {
        const val = queryParams[prop];

        if (val && val.toLowerCase() !== event[eventProp].toLowerCase()) {
          filterEvent = false;
        }
      };
      const propInDateRange = (prop, eventProp = prop) => {
        const val = queryParams[prop];

        if (val) {
          let [start, end] = val.split(',');

          if (start.length) {
            start = new Date(start);
            const eventStart = new Date(event[eventProp]);

            if (eventStart < start) filterEvent = false;
          }

          if (end.length) {
            end = new Date(end);
            const eventEnd = new Date(event[eventProp]);

            if (eventEnd > end) filterEvent = false;
          }
        }
      };

      if (
        queryParams.filter &&
        !(
          event.title.includes(queryParams.filter) ||
          event.sDesc.includes(queryParams.filter) ||
          event.lDesc.includes(queryParams.filter)
        )
      ) {
        filterEvent = false;
      }

      propIncluded('title');
      propType(EVENT_TYPES, 'eventType');
      propIncluded('group');
      propIncluded('sDesc');
      propIncluded('lDesc');
      propIncluded('system');
      propIncluded('edition');
      propInRange('minPlayers');
      propInRange('maxPlayers');
      propType(AGE_GROUPS, 'ageReq');
      propType(EXP, 'exp');
      propIs('materials');
      propInDateRange('start');
      propInRange('duration');
      propInDateRange('end');
      propIncluded('gameMasters');
      propIncluded('website');
      propIncluded('email');
      propIs('tournament');
      propInRange('round');
      propInRange('totalRounds');
      propInRange('minTime');
      propType(REGISTRATION, 'registration');
      propInRange('cost');
      propIncluded('location');
      propIncluded('room');
      propIncluded('table');
      propType(CATEGORY, 'category');
      propInRange('available');
      propInDateRange('lastModified');

      if (filterEvent) return event;
    });
  });

  this.get('/:id');
}
