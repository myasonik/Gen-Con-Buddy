import { module, test } from 'qunit';
import { setupRenderingTest } from 'gen-con-buddy/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | event-table', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<EventTable />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <EventTable>
        template block text
      </EventTable>
    `);

    assert.dom().hasText('template block text');
  });
});
