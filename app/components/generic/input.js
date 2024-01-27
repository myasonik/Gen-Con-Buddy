import { action } from '@ember/object';
import Component from '@glimmer/component';

export default class GenericInputComponent extends Component {
  get isCheckbox() {
    return typeof this.args.checked === 'boolean';
  }

  get isRange() {
    return this.args.type === 'range';
  }

  get isDateRange() {
    return this.args.type === 'date-range';
  }

  get isDate() {
    return this.args.type === 'date';
  }

  get isEnum() {
    return typeof this.args.options === 'object';
  }

  get isBool() {
    return typeof this.args.boolChange === 'function';
  }

  @action
  enumHandler(event) {
    this.args.onChange(event.target.value);
  }

  @action
  boolHandler(event) {
    this.args.boolChange(event.target.value);
  }
}
