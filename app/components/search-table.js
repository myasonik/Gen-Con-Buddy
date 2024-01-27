import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { format } from 'date-fns';

export default class SearchTableComponent extends Component {
  @service router;

  day = (date) => format(date, 'EEEE');
  time = (date) => format(date, 'HH:mm');
  lastMod = (date) => format(date, 'MMM dd HH:mm');

  // tracking queryParams doesn't work
  // @tracked showType = !this.router.currentRoute.queryParams.eventType;

  @tracked showTitle = true;
  @tracked showType = false;
  @tracked showGroup = false;
  @tracked showSDesc = true;
  @tracked showLDesc = true;
  @tracked showSystem = false;
  @tracked showEdition = false;
  @tracked showMinPlayers = true;
  @tracked showMaxPlayers = true;
  @tracked showAgeReq = false;
  @tracked showExp = false;
  @tracked showMaterials = false;
  @tracked showDay = true;
  @tracked showStart = true;
  @tracked showDuration = true;
  @tracked showEnd = true;
  @tracked showGameMasters = false;
  @tracked showWebsite = false;
  @tracked showEmail = false;
  @tracked showTournament = false;
  @tracked showRound = false;
  @tracked showTotalRounds = false;
  @tracked showMinTime = false;
  @tracked showRegistration = false;
  @tracked showCost = false;
  @tracked showLocation = false;
  @tracked showRoom = false;
  @tracked showTable = false;
  @tracked showCategory = false;
  @tracked showAvailable = false;
  @tracked showLastModified = false;
}
