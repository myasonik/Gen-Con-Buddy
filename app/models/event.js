import Model, { attr } from '@ember-data/model';

export default class EventModel extends Model {
  @attr('number') year;
  @attr('number') order;
  @attr('string') gameId;
  @attr('string') group;
  @attr('string') title;
  @attr('string') shortDescription;
  @attr('string') longDescription;
  @attr('string') eventType;
  @attr('string') gameSystem;
  @attr('string') rulesEdition;
  @attr('number') minPlayers;
  @attr('number') maxPlayers;
  @attr('string') ageRequired;
  @attr('string') experienceRequired;
  @attr('string') materialsProvided;
  @attr('date') startDateTime;
  @attr('number') duration;
  @attr('date') endDateTime;
  @attr('string') gmNames;
  @attr('string') website;
  @attr('string') email;
  @attr('string') tournament;
  @attr('number') roundNumber;
  @attr('number') totalRounds;
  @attr('number') minimumPlayTime;
  @attr('string') attendeeRegistration;
  @attr('number') cost;
  @attr('string') location;
  @attr('string') roomName;
  @attr('string') tableNumber;
  @attr('string') specialCategory;
  @attr('number') ticketsAvailable;
  @attr('date') lastModified;
}
