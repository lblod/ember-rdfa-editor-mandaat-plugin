import Mixin from '@ember/object/mixin';
import attr from 'ember-data/attr';

export default Mixin.create({
  label: attr(),
  scopeNote: attr()
});
