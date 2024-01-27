import { module, test } from 'qunit';

import { setupTest } from 'gen-con-buddy/tests/helpers';

module('Unit | Adapter | event', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let adapter = this.owner.lookup('adapter:event');
    assert.ok(adapter);
  });
});
