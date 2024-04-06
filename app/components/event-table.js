import Component from '@glimmer/component';
import { format } from 'date-fns';

export default class EventTableComponent extends Component {
  day = (date) => format(date, 'EEEE');
  time = (date) => format(date, 'HH:mm');
  lastMod = (date) => format(date, 'MMM dd HH:mm');
}
