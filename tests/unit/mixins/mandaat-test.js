import EmberObject from '@ember/object';
import MandaatMixin from '@lblod/ember-rdfa-editor-mandaat-plugin/mixins/mandaat';
import { module, test } from 'qunit';

module('Unit | Mixin | mandaat', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let MandaatObject = EmberObject.extend(MandaatMixin);
    let subject = MandaatObject.create();
    assert.ok(subject);
  });
});
