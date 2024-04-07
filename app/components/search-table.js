import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { format } from 'date-fns';
import { storageFor } from 'ember-local-storage';

export default class SearchTableComponent extends Component {
  @service router;
  @storageFor('table-state') tableState;

  day = (date) => format(date, 'EEEE');
  time = (date) => {
    if (date) return format(date, 'HH:mm');

    return '';
  };
  lastMod = (date) => format(date, 'MMM dd HH:mm');

  @action
  toggle(prop) {
    const state = this.tableState.get(prop);
    this.tableState.set(prop, !state);
  }
}
