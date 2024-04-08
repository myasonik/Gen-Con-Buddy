import StorageObject from 'ember-local-storage/local/object';
import { SEARCH_TABLE_STATE_VERSION } from 'gen-con-buddy/utils/enums';

const Storage = StorageObject.extend();

Storage.reopenClass({
  initialState() {
    return {
      version: SEARCH_TABLE_STATE_VERSION,
      showGameId: false,
      showTitle: true,
      showType: false,
      showGroup: false,
      showShortDescription: true,
      showLongDescription: false,
      showGameSystem: false,
      showRulesEdition: false,
      showMinPlayers: true,
      showMaxPlayers: true,
      showAgeRequired: false,
      showExperienceRequired: false,
      showMaterialsProvided: false,
      showDay: true,
      showStartDateTime: true,
      showDuration: false,
      showEndDateTime: true,
      showGMNames: false,
      showWebsite: false,
      showEmail: false,
      showTournament: false,
      showRoundNumber: false,
      showTotalRounds: false,
      showMinimumPlayTime: false,
      showAttendeeRegistration: false,
      showCost: false,
      showLocation: false,
      showRoomName: false,
      showTableNumber: false,
      showCategory: false,
      showTicketsAvailable: true,
      showLastModified: false,
    };
  },
});

export default Storage;
