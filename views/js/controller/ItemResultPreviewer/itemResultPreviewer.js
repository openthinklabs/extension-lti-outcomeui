// Licensed under Gnu Public Licence version 2
// Copyright (c) 2020 (original work) Open Assessment Technologies SA ;

define(['module', 'util/url', 'core/logger', 'core/request', 'taoItems/previewer/factory'], function (
    module,
    urlHelper,
    loggerFactory,
    request,
    previewerFactory
) {
    'use strict';

    const logger = loggerFactory('ltiOutcomeUi/ItemResultPreviewer');
    const dataUrl = urlHelper.route('getVariableFile', 'ItemResultPreviewer', 'ltiOutcomeUi');

    const plugins = [
        {
            module: 'ltiOutcomeUi/previewer/plugins/content/scoringHighlighter',
            bundle: 'ltiOutcomeUi/loader/ltiOutcomeUi.min',
            category: 'content'
        }
    ];

    /**
     * Requests a file content given the URIs
     * @param {String} variableUri - The URI of a variable
     * @param {String} deliveryUri - The URI of a delivery
     * @returns {Promise}
     */
    function requestFileContent(variableUri, deliveryUri) {
        return request({
            url: dataUrl,
            method: 'POST',
            data: { variableUri, deliveryUri }
        }).then(response => {
            // The response may contain more than the expected data,
            // like the success status, which is not relevant here.
            // Hence this rewriting.
            const { data, name, mime } = response;
            return { data, name, mime };
        });
    }

    /**
     * Makes sure the response contains the file data if it is a file record
     * @param {Object} response
     * @param {String} deliveryUri
     * @returns {Promise}
     */
    function refineFileResponse(response, deliveryUri) {
        const file = response && response.base && response.base.file;
        if (file && file.uri && !file.data) {
            return requestFileContent(file.uri, deliveryUri)
                .then(fileData => {
                    if (fileData && fileData.data) {
                        response.base.file = fileData;
                    } else {
                        response.base = null;
                    }
                })
                .catch(e => logger.error(e));
        }
        return Promise.resolve();
    }

    /**
     * Makes sure the item state contains the file data in the response if it is a file record
     * @param {Object} state
     * @param {String} deliveryUri
     * @returns {Promise}
     */
    function refineItemState(state, deliveryUri) {
        if (!state) {
            return Promise.resolve(state);
        }

        const filePromises = Object.keys(state).map(identifier => {
            const { response } = state[identifier];
            return refineFileResponse(response, deliveryUri);
        });
        return Promise.all(filePromises).then(() => state);
    }

    return {
        start: function (config) {
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

            let type = config.type;

            refineItemState(config.state, deliveryUri).then(state => {
                previewerFactory(type, uri, state, {
                    view: 'scorer',
                    fullPage: true,
                    hideActionBars: true,
                    plugins
                });
            });
        }
    };
});
