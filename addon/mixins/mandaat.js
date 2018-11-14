import Mixin from '@ember/object/mixin';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';

export default Mixin.create({
  uri: attr(),
  aantalHouders: attr(),
  bestuursfunctie: belongsTo('bestuursfunctie-code', { inverse: null })
});
