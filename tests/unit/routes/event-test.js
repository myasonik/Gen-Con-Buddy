import { setupTest } from 'gen-con-buddy/tests/helpers';
import { module, test } from 'qunit';

module('Unit | Route | event', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:event');
    assert.ok(route);
  });
});
