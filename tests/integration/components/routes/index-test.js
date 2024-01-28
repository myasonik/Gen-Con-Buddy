import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'gen-con-buddy/tests/helpers';
import { module, test } from 'qunit';

module('Integration | Component | routes/index', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Routes />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <Routes>
        template block text
      </Routes>
    `);

    assert.dom().hasText('template block text');
  });
});
