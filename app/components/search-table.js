import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { format } from 'date-fns';
import { storageFor } from 'ember-local-storage';

const dateFormatter = (date, pattern) => {
  if (date) return format(date, pattern);
  return '';
};

export default class SearchTableComponent extends Component {
  @service router;
  @storageFor('table-state') tableState;

  day = (date) => dateFormatter(date, 'EEEE');
  time = (date) => dateFormatter(date, 'HH:mm');
  lastMod = (date) => dateFormatter(date, 'MMM dd HH:mm');

  @action
  toggle(prop) {
    const state = this.tableState.get(prop);
    this.tableState.set(prop, !state);
  }
}
