import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/mandaat-card';
import { computed } from '@ember/object';
import InsertResourceRelationCardMixin from '@lblod/ember-rdfa-editor-generic-model-plugin-utils/mixins/insert-resource-relation-card-mixin';

/**
* Card displaying a hint of the Date plugin
*
* @module editor-mandaat-plugin
* @class MandaatCard
* @extends Ember.Component
*/
export default Component.extend(InsertResourceRelationCardMixin, {
  layout,
  hintOwner: 'editor-plugins/mandaat-card',

  serializeToJsonApi(resource){
    //This is because we're not sure uri is kept (due to bug in mu-cl-resources/or ember-ds?)
    const serializedResource = resource.serialize({includeId: true});
    serializedResource.data.attributes.uri = resource.uri;
    return serializedResource;
  },

  mandaatCombinedWithProperties: computed('info', function(){
    return this.info.rdfaProperties.map(prop => {
      return { mandaat: this.info.mandaat, prop: prop };
    });
  }),

  actions: {
    async refer(data){
      const mandaatJsonApi = this.serializeToJsonApi(data.mandaat);
      const bestuursfunctie = await data.mandaat.bestuursfunctie;
      const rdfaRefer = await this.getReferRdfa(await data.prop, mandaatJsonApi, bestuursfunctie.label);
      const mappedLocation = this.hintsRegistry.updateLocationToCurrentIndex(this.hrId, this.location);
      this.hintsRegistry.removeHintsAtLocation(this.location, this.get.hrId, this.hintOwner);
      this.editor.replaceTextWithHTML(...mappedLocation, rdfaRefer, [{ who: this.hintOwner }]);
    },
    async extend(data){
      const mandaatJsonApi = this.serializeToJsonApi(data.mandaat);
      const rdfaRefer = await this.getReferRdfa(await data.prop, mandaatJsonApi);
      const mappedLocation = this.hintsRegistry.updateLocationToCurrentIndex(this.hrId, this.location);
      this.hintsRegistry.removeHintsAtLocation(this.location, this.get.hrId, this.hintOwner);
      this.editor.replaceTextWithHTML(...mappedLocation, rdfaRefer, [{ who: this.hintOwner }]);
    }
  }
});
