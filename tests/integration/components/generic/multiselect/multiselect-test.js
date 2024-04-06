import { module, test } from 'qunit';
import { setupRenderingTest } from 'gen-con-buddy/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | generic/mutliselect/multiselect',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await render(hbs`<Generic::Mutliselect::Multiselect />`);

      assert.dom().hasText('');

      // Template block usage:
      await render(hbs`
      <Generic::Mutliselect::Multiselect>
        template block text
      </Generic::Mutliselect::Multiselect>
    `);

      assert.dom().hasText('template block text');
    });
  },
);
