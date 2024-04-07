import { faker } from '@faker-js/faker';
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  format,
  setHours,
  setMinutes,
  toDate,
} from 'date-fns';
import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from 'gen-con-buddy/utils/enums';
import { Factory } from 'miragejs';
import getThu from '../utils/getThu';

const { lorem, string, number, datatype, date, person, internet } = faker;

const returnRandVal = (obj) => {
  const vals = Object.values(obj);
  return vals[number.int({ max: vals.length - 1 })];
};

const thu = getThu();

export default Factory.extend({
  year: 2024,

  // Original Order
  order(i) {
    return i;
  },

  // Event Type
  eventType() {
    return returnRandVal(EVENT_TYPES);
  },

  // Game ID
  gameId() {
    const type = this.eventType.split(' - ')[0];
    const uuid = string.alphanumeric({
      length: { min: 5, max: 15 },
    });
    return `${type}${uuid}`;
  },

  // Group
  group() {
    return lorem.word({ length: { min: 1, max: 3 } });
  },

  // Title
  title() {
    return lorem.word({ length: { min: 1, max: 3 } });
  },

  // Short Description
  shortDescription() {
    return lorem.sentences({ min: 1, max: 3 });
  },

  // Long Description
  longDescription() {
    return lorem.sentences({ min: 3, max: 5 });
  },

  // Game System
  gameSystem() {
    return lorem.sentences({ max: 3 });
  },

  // Rules Edition
  rulesEdition() {
    return lorem.sentences({ max: 3 });
  },

  // Minimum Players
  minPlayers() {
    return number.int({ min: 1, max: 10 });
  },

  // Maximum Players
  maxPlayers() {
    return number.int({ min: this.minPlayers, max: 100000 });
  },

  // Age Required
  ageRequired() {
    return returnRandVal(AGE_GROUPS);
  },

  // Experience Required
  experienceRequired() {
    return returnRandVal(EXP);
  },

  // Materials Provided: Yes / No
  materialsProvided() {
    return datatype.boolean() ? 'Yes' : 'No';
  },

  // Start Date & Time
  startDateTime() {
    const from = toDate(setHours(thu, 8));
    const to = toDate(setMinutes(setHours(addDays(thu, 3), 17), 30));

    return format(date.between({ from, to }), 'M/d/yyyy HH:mm:ss');
  },

  // Fractional hours to the half hour
  duration() {
    const end = setHours(addDays(thu, 4), 18);
    const diffInHalfHours =
      (differenceInMinutes(end, this.startDateTime) / 60) * 2;

    return number.int({ max: diffInHalfHours }) / 2;
  },

  // End Date & Time
  endDateTime() {
    const durationInMinutes = this.duration * 60;
    return addMinutes(this.startDateTime, durationInMinutes);
  },

  // GM Names
  gmNames() {
    const length = number.int({ max: 10 });
    return Array.from({ length }, () => person.fullName()).join(', ');
  },

  // Website
  website() {
    return internet.url();
  },

  // Email
  email() {
    return internet.email();
  },

  // Tournament
  tournament() {
    return datatype.boolean() ? 'Yes' : 'No';
  },

  // Round Number
  roundNumber() {
    // only tournaments get a round greater than 1
    if (!this.tournament) return 0;

    return number.int({ max: 5 });
  },

  // Total Rounds
  totalRounds() {
    // only tournaments get a round greater than 1
    if (!this.tournament) return 0;

    return number.int({ min: this.roundNumber, max: 5 });
  },

  // Minimum Play Time
  minimumPlayTime() {
    // real data might not always match; just being lazy for mock data
    return this.duration;
  },

  // Attendee Registration?
  attendeeRegistration() {
    return returnRandVal(REGISTRATION);
  },

  // Cost $
  cost() {
    return number.int({ max: 100 });
  },

  // Location
  location() {
    return lorem.words({ mix: 1, max: 10 });
  },

  // Room Name
  roomName() {
    return lorem.words({ min: 1, max: 10 });
  },

  // Table Number
  tableNumber() {
    return lorem.words({ min: 1, max: 10 });
  },

  // Special Category
  specialCategory() {
    return returnRandVal(CATEGORY);
  },

  // Tickets Available
  ticketsAvailable() {
    return number.int({ min: -1000, max: 1000 });
  },

  // Last Modified
  lastModified() {
    return date.recent({ days: 180 });
  },

  //
  // The rest are always blank? :shrug:
  //

  // Also Runs
  runs() {
    return '';
  },

  // Prize
  prize() {
    return '';
  },

  // Rules Complexity
  complexity() {
    return '';
  },
});
