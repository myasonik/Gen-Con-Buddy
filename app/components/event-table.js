import Component from '@glimmer/component';
import { format } from 'date-fns';

const dateFormatter = (date, pattern) => {
  if (date) return format(date, pattern);
  return '';
};

export default class EventTableComponent extends Component {
  day = (date) => dateFormatter(date, 'EEEE');
  time = (date) => dateFormatter(date, 'HH:mm');
  lastMod = (date) => dateFormatter(date, 'MMM dd HH:mm');
}
