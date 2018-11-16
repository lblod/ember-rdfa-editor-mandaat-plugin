# @lblod/ember-rdfa-editor-mandaat-plugin

RDFa editor plugin to insert mandaten in the editor.

## Use
In a context where a mandaat can be inserted, the plugin will try to hint based on the label of the bestuursfunctie code (e.g. 'voorzitter van de gemeenteraad').

## Installation

Install the plugin like an Ember addon in your host application.

```
ember install @lblod/ember-rdfa-editor-mandaat-plugin.git
```

### Dispatcher configuration
The plugin will automatically be added to the `default` and `all` profile in the editor's dispatcher configuration in `app/config/editor-profiles.js`.
