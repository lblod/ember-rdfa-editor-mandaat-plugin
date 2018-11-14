import EmberObject from '@ember/object';
import BestuursfunctieCodeMixin from '@lblod/ember-rdfa-editor-mandaat-plugin/mixins/bestuursfunctie-code';
import { module, test } from 'qunit';

module('Unit | Mixin | bestuursfunctie-code', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let BestuursfunctieCodeObject = EmberObject.extend(BestuursfunctieCodeMixin);
    let subject = BestuursfunctieCodeObject.create();
    assert.ok(subject);
  });
});
