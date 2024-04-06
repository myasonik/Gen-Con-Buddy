import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class EventRoute extends Route {
  @service store;

  model({ event_id }) {
    return this.store.findRecord('event', event_id);
  }
}
