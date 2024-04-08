import ApplicationSerializer from './application';

export default class EventSerializer extends ApplicationSerializer {
  keyForAttribute(key) {
    return key;
  }
}
