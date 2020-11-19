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

            this.isEraserOn = false;
            this.hasHighlights = false;

            this.currentColor = '';

            const CLASS_NAME =  'txt-user-highlight';
            const CONTAINER_SELECTOR = '.qti-itemBody';

            const colors = {
                ocher: 'ocher',
                blue: 'blue',
                pink: 'pink',
            }

            const highlighter = highlighterFactory({
                className: CLASS_NAME,
                containerSelector: CONTAINER_SELECTOR,
                containersBlackList: [],
                colors
            });

            this.eventListener = e => {
                if (e.data.event === 'setIndex') {
                    if (e.data.payload) {
                        this.updateHasHighlights(e.data.payload);
                    }

                    // Applying any highlighIndex received from parent
                    if (this.hasHighlights) {
                        highlighter.highlightFromIndex(e.data.payload);
                    }
                } else if (this.$highlighterTray) {
                    if (e.data.event === 'hide') {
                        this.hide();
                        this.turnEraserOff();
                        this.turnHighlighterOff();
                    } else if (e.data.event === 'show') {
                        this.show();
                    }
                }
            };

            this.selectEventListener = e => {
                this.highlight(this.selection)
            };

            window.addEventListener('message', this.eventListener);

            this.$highlighterTray = $(
                highlighterTrayTpl({
                    label: __('highlighter'),
                    colors
                })
            );

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
             * Update highlighting status
             *
             * @param {Object[]} highlightIndex - Highlight index
             */
            this.updateHasHighlights = (highlightIndex) => {
                this.hasHighlights = highlightIndex.some(highlight => highlight.highlighted === true);
            }

            /**
             * Sends the highlighIndex to parent and updates hasHighlights
             */
            const saveHighlights = () => {
                const highlightIndex = highlighter.getHighlightIndex();
                window.parent.postMessage({ event: 'indexUpdated', payload: highlightIndex }, '*');
                this.updateHasHighlights(highlightIndex);
            }

            /**
             * Erases highlights and notifies the parent iframe
             *
             * @param {Event} e - Click event
             */
            const clearHighlightAndSave = (e) => {
                highlighter.clearSingleHighlight(e);
                saveHighlights();

                if (!this.hasHighlights) {
                    this.turnEraserOff();
                }
            }

            /**
             * Highlights the selection and notifies the parent iframe
             *
             * @param {*} selection
             */
            this.highlight = (selection) => {
                highlighter.highlightRanges(getAllRanges(selection));

                selection.removeAllRanges();
                saveHighlights();
            };

            /**
             * Turns on the eraser and adds the cursor
             */
            this.turnEraserOn = () => {
                this.$controls.$eraser.addClass('eraser-on');
                $(CONTAINER_SELECTOR + ' .' + CLASS_NAME).off('click').on('click', clearHighlightAndSave);
                $(CONTAINER_SELECTOR).addClass('can-erase');
                this.isEraserOn = true;
                this.turnHighlighterOff();
            }

            /**
             * Turns off the eraser and removes the cursor
             */
            this.turnEraserOff = () => {
                this.$controls.$eraser.removeClass('eraser-on');
                $(CONTAINER_SELECTOR + ' .' + CLASS_NAME).off('click');
                $(CONTAINER_SELECTOR).removeClass('can-erase');
                this.isEraserOn = false;
            }

            /**
             * Toggles the eraser mode
             */
            this.toggleEraser = () => {
                // Only turn on eraser if there are highlights
                if (this.hasHighlights) {
                    this.isEraserOn ? this.turnEraserOff() : this.turnEraserOn()
                }
            };

            /**
             * Turns on the highlighter and adds the cursor
             */
            this.turnHighlighterOn = () => {
                const $container = $(CONTAINER_SELECTOR);

                $container.on('pointerup', this.selectEventListener);

                $container.addClass('can-highlight');
                this.turnEraserOff();
            }

            /**
             * Turns off the highlighter and removes the cursor
             */
            this.turnHighlighterOff = () => {
                const $container = $(CONTAINER_SELECTOR);

                $container.off('pointerup');
                $container.removeClass('can-highlight');

                if (this.currentColor) {
                    const $container = this.getAreaBroker().getArea('contentWrapper');
                    $container.find(`.${this.currentColor}`).removeClass('color-selected');
                }
                this.currentColor = '';
            }

            /**
             * Toggles the direct highlighting mode
             *
             * @param e
             */
            this.toggleHighlighter = e => {
                const $container = this.getAreaBroker().getArea('contentWrapper');

                if (this.currentColor) {
                    $container.find(`.${this.currentColor}`).removeClass('color-selected');
                }

                const newColor = e.target.name;

                if (this.currentColor === newColor) {
                    this.turnHighlighterOff();
                } else {
                    this.turnHighlighterOn();
                    this.turnEraserOff();

                    $container.find(`.${newColor}`).addClass('color-selected');
                    this.currentColor = newColor;
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

            this.$controls = {
                $eraser: $container.find('button.icon-eraser'),
                $color: $container.find('.color-button')
            }

            this.$controls.$eraser.on('click', e => {
                e.preventDefault();
                this.toggleEraser();
            });

            this.$controls.$color.on('click', e => {
                e.preventDefault();

                if (this.isEraserOn) {
                    this.toggleEraser();
                }

                this.toggleHighlighter(e);

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
