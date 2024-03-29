import { service } from '@ember/service';
import ApplicationAdapter from './application';

export default class EventAdapter extends ApplicationAdapter {
  @service router;

  urlForQuery(query, modelName) {
    if (modelName === 'event') {
      return `/${this.namespace}/search`;
    }
    return super.urlForQuery(...arguments);
  }
}
