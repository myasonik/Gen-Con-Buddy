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
  this.get('events/search', ({ events }, { queryParams }) => {
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

        // if (prop === 'specialCategory' && val === '' && event[eventProp] === '') {
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
          event.shortDescription.includes(queryParams.filter) ||
          event.longDescription.includes(queryParams.filter)
        )
      ) {
        filterEvent = false;
      }

      propIncluded('gameId');
      propIncluded('title');
      propType(EVENT_TYPES, 'eventType');
      propIncluded('group');
      propIncluded('shortDescription');
      propIncluded('longDescription');
      propIncluded('gameSystem');
      propIncluded('rulesEdition');
      propInRange('minPlayers');
      propInRange('maxPlayers');
      propType(AGE_GROUPS, 'ageRequired');
      propType(EXP, 'experienceRequired');
      propIs('materialsProvided');
      propInDateRange('start');
      propInRange('duration');
      propInDateRange('endDateTime');
      propIncluded('gmNames');
      propIncluded('website');
      propIncluded('email');
      propIs('tournament');
      propInRange('roundNumber');
      propInRange('totalRounds');
      propInRange('minimumPlayTime');
      propType(REGISTRATION, 'attendeeRegistration');
      propInRange('cost');
      propIncluded('location');
      propIncluded('roomName');
      propIncluded('tableNumber');
      propType(CATEGORY, 'specialCategory');
      propInRange('ticketsAvailable');
      propInDateRange('lastModified');

      if (filterEvent) return event;
    });
  });

  this.get('/events/:id');
}
