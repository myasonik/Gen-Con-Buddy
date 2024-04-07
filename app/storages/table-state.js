import StorageObject from 'ember-local-storage/local/object';

const Storage = StorageObject.extend();

Storage.reopenClass({
  initialState() {
    return {
      showGameId: true,
      showTitle: true,
      showType: false,
      showGroup: false,
      showShortDescription: true,
      showLongDescription: true,
      showSystem: false,
      showRulesEdition: false,
      showMinPlayers: true,
      showMaxPlayers: true,
      showAgeRequired: false,
      showExperienceRequired: false,
      showMaterialsProvided: false,
      showDay: true,
      showStartDateTime: true,
      showDuration: true,
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
      showTable: false,
      showCategory: false,
      showTicketsAvailable: false,
      showLastModified: false,
    };
  },
});

export default Storage;
