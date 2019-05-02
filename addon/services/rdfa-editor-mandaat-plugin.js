import Service, { inject as service } from '@ember/service';
import EmberObject from '@ember/object';
import { task, timeout } from 'ember-concurrency';
import memoize from '../utils/memoize';
import { tokenize } from '../utils/text-tokenizing-utils';

const mandaatRdfaClass = 'http://data.vlaanderen.be/ns/mandaat#Mandaat';

/**
 * RDFa Editor plugin that hints mandates when typing their label
 *
 * @module editor-mandaat-plugin
 * @class RdfaEditorMandaatPlugin
 * @constructor
 * @extends EmberService
 */
const RdfaEditorMandaatPlugin = Service.extend({
  metaModelQuery: service(),
  store: service(),

  init(){
    this._super(...arguments);
    this.set('memoizedTokenize', memoize(tokenize.bind(this)));
    this.set('memoizedFindPropertiesWithRange',
             memoize((classType, range) => this.metaModelQuery.findPropertiesWithRange(classType, range)));
  },

  /**
   * Restartable task to handle the incoming events from the editor dispatcher
   *
   * @method execute
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Array} contexts RDFa contexts of the text snippets the event applies on
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   *
   * @public
   */
  execute: task(function * (hrId, contexts, hintsRegistry, editor, extraInfo = []) {
    if (contexts.length === 0) return;

    // if we see event was triggered by this plugin, ignore it
    if(extraInfo.find(i => i && i.who == this.who))
      return;

    yield this.loadMandatesForZitting();

    yield timeout(300);

    const cards = [];

    for (let context of contexts) {
      const rdfaProperties = yield this.detectRdfaPropertiesToUse(context);
      if(rdfaProperties.length == 0) continue;

      const hints = yield this.generateHintsForContext(context);
      if(hints.length == 0) continue;

      hintsRegistry.removeHintsInRegion(context.region, hrId, this.who);
      cards.push(...this.generateCardsForHints(rdfaProperties, hrId, hintsRegistry, editor, hints));
    }

    if(cards.length > 0){
      hintsRegistry.addHints(hrId, this.who, cards);
    }
  }),

  async detectRdfaPropertiesToUse(context){
    const lastTriple = context.context.slice(-1)[0] || {};
    if(!lastTriple.predicate == 'a')
      return [];

    const classType = lastTriple.object;
    if(classType.trim().length == 0)
      return [];

    return this.memoizedFindPropertiesWithRange(classType.trim(), mandaatRdfaClass);
  },

  async loadMandatesForZitting(){
    const node = document.querySelectorAll("[property='http://data.vlaanderen.be/ns/besluit#isGehoudenDoor']")[0];
    if(!node || !node.attributes || !node.attributes.resource || !node.attributes.resource.value)
      return;

    const bestuursorgaanUri = node.attributes.resource.value;
    if(this.bestuursorgaanInTijd == bestuursorgaanUri)
      return;

    this.set('bestuursorgaanInTijd', bestuursorgaanUri);
    await this.store.unloadAll('mandaat');

    const queryParams = {
      'filter[bevat-in][:uri:]': bestuursorgaanUri,
      page: { size: 10000 },
      include: 'bestuursfunctie'
    };

    await this.store.query('mandaat', queryParams);
  },

  /**
   given token with partial (potential) label, find mandates

   @method findPartialMatchingMandates

   @param {object} token

   @return {object} Ember array

   @private
   */
  async findPartialMatchingMandates(token){
    const bestuursfunctieIds = this.store.peekAll('bestuursfunctie-code').filter(function(bestuursfunctie) {
      return (bestuursfunctie.label || '').toLowerCase().startsWith(token.sanitizedString.toLowerCase());
    }).map(b => b.get('id'));

    return this.store.peekAll('mandaat').filter(function(mandaat) {
      return bestuursfunctieIds.includes(mandaat.bestuursfunctie.get('id'));
    });
  },

  /**
   generates cards for array of hints

   @method generateCardsForHints

   @param {object} rdfaProperties object
   @param {object} hrId
   @param {object} hintsRegistry
   @param {object} editor
   @param {array} hints

   @return {object} card object

   @private
   */
  generateCardsForHints(rdfaProperties, hrId, hintsRegistry, editor, hints){
    return hints.map(hint => this.generateCard(rdfaProperties,
                                   hint.mandate,
                                   hint.normalizedLocation,
                                   hrId, hintsRegistry,
                                   editor));
  },

  /**
   generates card

   @method generateCard

   @param {Object} rdfaProperties
   @param {EmberObject} mandaat
   @param {object} location in the editor (normalized)
   @param {object} hrId
   @param {object} hintsRegistry
   @param {object} editor

   @return {object} card object

   @private
   */
  generateCard(rdfaProperties, mandaat, location, hrId, hintsRegistry, editor) {
    return EmberObject.create({
      location: location,
      info: { mandaat, location, hrId, hintsRegistry, editor, rdfaProperties },
      card: this.who
    });
  },

  /**
   * Generates a hint, given a context
   *
   * @method generateHintsForContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {Object} [{dateString, location}]
   *
   * @private
   */
  async generateHintsForContext(context){
    const tokens = await this.memoizedTokenize(context.text);

    let allHints = [];

    for(let token of tokens){
      const mandates = await this.findPartialMatchingMandates(token);

      if(mandates.length === 0) continue;

      token.normalizedLocation = this.normalizeLocation(token.location, context.region);
      token.mandates = mandates;

      allHints = allHints.concat(token);
    }

    //remove double hints by taking biggest overlapping region (and thus most specific hint)
    //e.g 'Felix Ruiz' should give one hint for 'Felix Ruiz' and not 'Felix', 'Ruiz'
    const cleanedHints = allHints.filter(this.isLargestOverlappingHint);
    const flattenedHints = [];
    cleanedHints.forEach(hint => {
      hint.mandates.forEach(mandate => {
        flattenedHints.push({
          location: hint.location,
          normalizedLocation: hint.normalizedLocation,
          mandate: mandate
        });
      });
    });

    return flattenedHints;
  },

  /**
   * Maps location of substring back within reference location
   *
   * @method normalizeLocation
   *
   * @param {[int,int]} [start, end] Location withing string
   * @param {[int,int]} [start, end] reference location
   *
   * @return {[int,int]} [start, end] absolute location
   *
   * @private
   */
  normalizeLocation(location, reference){
    return [location[0] + reference[0], location[1] + reference[0]];
  },

  /**
   Checks if hint.location is largest overlapping hint within array.

   @method isLargestOverlappingHint

   @return {boolean}

   @private
   */
  isLargestOverlappingHint(currentHint, currentIndex, hints){
    const containsLocation = (testLocation, refLocation) => {
      return refLocation[0] <= testLocation[0] && testLocation[1] <= refLocation[1];
    };

    const isRealOverlap = (element, index) => {
      return containsLocation(hints[currentIndex].location, hints[index].location) && currentIndex !== index;
    };

    return hints.find(isRealOverlap) === undefined;

  }

});

RdfaEditorMandaatPlugin.reopen({
  who: 'editor-plugins/mandaat-card'
});
export default RdfaEditorMandaatPlugin;
