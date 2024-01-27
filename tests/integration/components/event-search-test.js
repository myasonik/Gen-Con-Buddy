import { module, test } from 'qunit';
import { setupRenderingTest } from 'gen-con-buddy/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | event-search', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<EventSearch />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <EventSearch>
        template block text
      </EventSearch>
    `);

    assert.dom().hasText('template block text');
  });
});
