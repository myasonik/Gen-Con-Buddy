import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { storageFor } from 'ember-local-storage';
import { SEARCH_TABLE_STATE_VERSION } from 'gen-con-buddy/utils/enums';

export default class SearchRoute extends Route {
  @service store;
  @storageFor('table-state') tableState;

  constructor() {
    super(...arguments);

    if (this.tableState.get('version') !== SEARCH_TABLE_STATE_VERSION) {
      this.tableState.reset();
    }
  }

  queryParams = {
    limit: { refreshModel: true },
    filter: { refreshModel: true },

    gameId: { refreshModel: true },
    title: { refreshModel: true },
    eventType: { refreshModel: true },
    group: { refreshModel: true },
    shortDescription: { refreshModel: true },
    longDescription: { refreshModel: true },
    gameSystem: { refreshModel: true },
    rulesEdition: { refreshModel: true },
    minPlayers: { refreshModel: true },
    maxPlayers: { refreshModel: true },
    ageRequired: { refreshModel: true },
    experienceRequired: { refreshModel: true },
    materialsProvided: { refreshModel: true },
    startDateTime: { refreshModel: true },
    duration: { refreshModel: true },
    endDateTime: { refreshModel: true },
    gmNames: { refreshModel: true },
    website: { refreshModel: true },
    email: { refreshModel: true },
    tournament: { refreshModel: true },
    roundNumber: { refreshModel: true },
    totalRounds: { refreshModel: true },
    minimumPlayTime: { refreshModel: true },
    attendeeRegistration: { refreshModel: true },
    cost: { refreshModel: true },
    location: { refreshModel: true },
    roomName: { refreshModel: true },
    tableNumber: { refreshModel: true },
    specialCategory: { refreshModel: true },
    ticketsAvailable: { refreshModel: true },
    lastModified: { refreshModel: true },
  };

  model(params) {
    return this.store.query('event', params);
  }
}
