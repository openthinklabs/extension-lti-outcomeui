/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

/**
 * Highlighter Plugin
 */
define([
    'jquery',
    'i18n',
    'ui/hider',
    'taoTests/runner/plugin',
    'tpl!ltiOutcomeUi/previewer/plugins/content/tpl/highlighter-tray',
    'ui/highlighter',
    'css!ltiOutcomeUi/previewer/plugins/content/css/highlighterTray.css'
], function ($, __, hider, pluginFactory, highlighterTrayTpl, highlighterFactory) {
    'use strict';

    return pluginFactory({
        name: 'highlighter',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init() {
            const testRunner = this.getTestRunner();
            this.selection = window.getSelection();
            this.hasHighlights = false;

            const CLASS_NAME =  'txt-user-highlight';
            const CONTAINER_SELECTOR = '.qti-itemBody';

            const highlighter = highlighterFactory({
                className: CLASS_NAME,
                containerSelector: CONTAINER_SELECTOR,
                containersBlackList: []
            });

            this.eventListener = e => {
                if (e.data.event === 'setIndex') {
                    if(e.data.payload) {
                        this.updateHashighlights(e.data.payload);
                    }
                    
                    if (this.hasHighlights) {
                        // Applying any highlighIndex received from parent
                        highlighter.highlightFromIndex(e.data.payload);
                    }
                    
                } else if (this.$highlighterTray) {
                    if (e.data.event === 'hide') {
                        this.hide();
                    } else if (e.data.event === 'show') {
                        this.show();
                    }
                }
            };

            window.addEventListener('message', this.eventListener);

            this.$highlighterTray = $(
                highlighterTrayTpl({
                    label: __('highlighter')
                })
            );

            /**
             * Checks if the highlgiht index has any highlights
             * 
             * @param {*} index - highlight index
             */
            this.updateHashighlights = (index) => {
                this.hasHighlights  = index.some(highlight => highlight.highlighted === true);
            }

            /**
             * Gets the ranges of the selection
             * 
             * @param {*} selection 
             */
            function getAllRanges(selection) {
                const allRanges = [];

                for (let i = 0; i < selection.rangeCount; i++) {
                    allRanges.push(selection.getRangeAt(i));
                }
                return allRanges;
            }

            /**
             * Erases highlights and notifies the parent iframe
             * 
             * @param {Event} e - Click event
             */
            const clearHighlightAndSave = (e) => {
                highlighter.clearSingleHighlight(e);

                //Sending the highlighIndex to parent so that it can be saved on MS side
                const highlightIndex = highlighter.getHighlightIndex();
                window.parent.postMessage({ event: 'indexUpdated', payload: highlightIndex }, '*');
                this.updateHashighlights(highlightIndex);
            }

            /**
             * Highlights the selection and notifies the parent iframe
             * 
             * @param {*} selection 
             */
            this.highlight = (selection) => {
                highlighter.highlightRanges(getAllRanges(selection));

                //Sending the highlighIndex to parent so that it can be saved on MS side
                selection.removeAllRanges();
                const highlightIndex = highlighter.getHighlightIndex();
                window.parent.postMessage({ event: 'indexUpdated', payload: highlightIndex }, '*');
                this.updateHashighlights(highlightIndex);
            };

            /**
             * Toggles the eraser mode
             * 
             * @param {jQueryElement} $eraser 
             * @param {Boolean} isEraserOn 
             */
            this.toggleEraser = ($eraser, turnOnEraser) => {
                // Only turn on eraser if there are highlights
                if (this.hasHighlights) {
                    if (turnOnEraser) {
                        $eraser.addClass('eraser-on');
                        $(CONTAINER_SELECTOR + ' .' + CLASS_NAME).off('click').on('click', clearHighlightAndSave);
                        $(CONTAINER_SELECTOR + ' .' + CLASS_NAME).addClass('erase');
                    } else {
                        $eraser.removeClass('eraser-on');
                        $(CONTAINER_SELECTOR + ' .' + CLASS_NAME).off('click')
                    }
                }
                
            };            

            testRunner.after('renderitem', function () {
                window.parent.postMessage({ event: 'rendered' }, '*');
            });
        },

        /**
         * Called during the runner's render phase
         */
        render() {
            const $container = this.getAreaBroker().getArea('contentWrapper');
            $container.append(this.$highlighterTray);

            //hide highlighter menu by default
            this.hide();

            const $eraser = $container.find('button.icon-eraser');
            const $color = $container.find('.color-button');
            let turnOnEraser = false;

            $eraser.on('click', e => {
                e.preventDefault();
                
                turnOnEraser = !turnOnEraser;
                this.toggleEraser($eraser, turnOnEraser);
            });

            $color.on('click', e => {
                e.preventDefault();
                
                if (turnOnEraser) {
                    turnOnEraser = false;
                    this.toggleEraser($eraser, turnOnEraser);
                }
                
                this.highlight(this.selection);
            });
        },

        /**
         * Show the highlighter tray
         */
        show() {
            const $container = this.getAreaBroker().getArea('contentWrapper');
            hider.show($container.find('.highlighter-tray'));
        },

        /**
         * Hide the highlighter tray
         */
        hide() {
            const $container = this.getAreaBroker().getArea('contentWrapper');
            hider.hide($container.find('.highlighter-tray'));
        },

        /**
         * Called during the runner's destroy phase
         */
        destroy() {
            this.$highlighterTray.remove();
            window.removeEventListener('message', this.eventListener);
        }
    });
});
