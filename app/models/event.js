import Model, { attr } from '@ember-data/model';

export default class EventModel extends Model {
  @attr('number') year;
  @attr('number') order;
  @attr('string') gameId;
  @attr('string') group;
  @attr('string') title;
  @attr('string') sDesc;
  @attr('string') lDesc;
  @attr('string') eventType;
  @attr('string') system;
  @attr('string') edition;
  @attr('number') minPlayers;
  @attr('number') maxPlayers;
  @attr('string') ageReq;
  @attr('string') exp;
  @attr('string') materials;
  @attr('date') start;
  @attr('number') duration;
  @attr('date') end;
  @attr('string') gameMasters;
  @attr('string') website;
  @attr('string') email;
  @attr('string') tournament;
  @attr('number') round;
  @attr('number') totalRounds;
  @attr('number') minTime;
  @attr('string') registration;
  @attr('number') cost;
  @attr('string') location;
  @attr('string') room;
  @attr('string') table;
  @attr('string') category;
  @attr('number') available;
  @attr('date') lastModified;
}
