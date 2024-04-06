import JSONAPIAdapter from '@ember-data/adapter/json-api';
import config from 'gen-con-buddy/config/environment';

export default class ApplicationAdapter extends JSONAPIAdapter {
  host = config.APP.API_URL;
}
