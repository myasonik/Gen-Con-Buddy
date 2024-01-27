import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class SearchRoute extends Route {
  @service store;

  queryParams = {
    filter: { refreshModel: true },

    title: { refreshModel: true },
    eventType: { refreshModel: true }, // NOTE: using eventType because type is a reserved word
    group: { refreshModel: true },
    sDesc: { refreshModel: true },
    lDesc: { refreshModel: true },
    system: { refreshModel: true },
    edition: { refreshModel: true },
    minPlayers: { refreshModel: true },
    maxPlayers: { refreshModel: true },
    ageReq: { refreshModel: true },
    exp: { refreshModel: true },
    materials: { refreshModel: true },
    // day: { refreshModel: true }, // haven't thought this through; not on the model
    start: { refreshModel: true },
    duration: { refreshModel: true },
    end: { refreshModel: true },
    gameMasters: { refreshModel: true },
    website: { refreshModel: true },
    email: { refreshModel: true },
    tournament: { refreshModel: true },
    round: { refreshModel: true },
    totalRounds: { refreshModel: true },
    minTime: { refreshModel: true },
    registration: { refreshModel: true },
    cost: { refreshModel: true },
    location: { refreshModel: true },
    room: { refreshModel: true },
    table: { refreshModel: true },
    category: { refreshModel: true },
    available: { refreshModel: true },
    lastModified: { refreshModel: true },
  };

  model(params) {
    return this.store.query('event', params);
  }
}
