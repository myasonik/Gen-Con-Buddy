import { module, test } from 'qunit';

import { setupTest } from 'gen-con-buddy/tests/helpers';

module('Unit | Serializer | event', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let store = this.owner.lookup('service:store');
    let serializer = store.serializerFor('event');

    assert.ok(serializer);
  });

  test('it serializes records', function (assert) {
    let store = this.owner.lookup('service:store');
    let record = store.createRecord('event', {});

    let serializedRecord = record.serialize();

    assert.ok(serializedRecord);
  });
});
