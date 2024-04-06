import StorageObject from 'ember-local-storage/local/object';

const Storage = StorageObject.extend();

Storage.reopenClass({
  initialState() {
    return {
      showTitle: true,
      showType: false,
      showGroup: false,
      showSDesc: true,
      showLDesc: true,
      showSystem: false,
      showEdition: false,
      showMinPlayers: true,
      showMaxPlayers: true,
      showAgeReq: false,
      showExp: false,
      showMaterials: false,
      showDay: true,
      showStart: true,
      showDuration: true,
      showEnd: true,
      showGameMasters: false,
      showWebsite: false,
      showEmail: false,
      showTournament: false,
      showRound: false,
      showTotalRounds: false,
      showMinTime: false,
      showRegistration: false,
      showCost: false,
      showLocation: false,
      showRoom: false,
      showTable: false,
      showCategory: false,
      showAvailable: false,
      showLastModified: false,
    };
  },
});

export default Storage;
