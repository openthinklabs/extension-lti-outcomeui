/**
 * @author Moyon Camille <camille@taotesting.com>
 */
define(["taoItems/previewer/factory"], function(previewerFactory) {
  "use strict";

  return {
    start: function(config) {
      var uri = config.uri;
      var resultIdentifier = config.resultIdentifier;
      var itemDefinition = config.itemDefinition;
      var deliveryUri = config.deliveryIdentifier;

      var uri = {
        uri: uri,
        resultId: resultIdentifier,
        itemDefinition: itemDefinition,
        deliveryUri: deliveryUri
      };

      var type = config.type;
      var state = config.state;

      previewerFactory(type, uri, state, {
        readOnly: true,
        fullPage: true,
        hideActionBars: true
      });
    }
  };
});
