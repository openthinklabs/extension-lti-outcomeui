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
    'css!ltiOutcomeUi/previewer/plugins/content/css/highlighterTray.css',
    'css!ltiOutcomeUi/previewer/plugins/content/css/mathEntryOverrides.css'
], function ($, __, hider, pluginFactory, highlighterTrayTpl, highlighterFactory) {
    'use strict';

    return pluginFactory({
        name: 'highlighter',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init() {
            const testRunner = this.getTestRunner();

            this.isEraserOn = false;
            this.hasHighlights = false;
            this.currentColor = '';

            const CONTAINER_SELECTOR = '.qti-itemBody';

            /**
             * @typedef Colors
             * @type {Object}
             */
            const colors = {
                ocher: 'txt-user-highlight-ocher',
                pink: 'txt-user-highlight-pink',
                blue: 'txt-user-highlight-blue'
            };

            const highlighter = highlighterFactory({
                className: colors.ocher,
                containerSelector: CONTAINER_SELECTOR,
                containersBlackList: [],
                colors: colors
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

            /**
             * Highlights the range of text selected by the user
             */
            this.selectEventListener = () => {
                this.highlight();
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
             * @param {Selection} selection
             */
            function getAllRanges(selection) {
                const allRanges = [];

                for (let i = 0; i < selection.rangeCount; i++) {
                    allRanges.push(selection.getRangeAt(i));
                }
                return allRanges;
            }

            /**
             *
             * @typedef {Object} inlineRanges
             * @property {string|number} [c] Highlighter wrapper class name
             * @property {string|number} [groupId] Highlighter wrapper groupId attribute
             * @property {number} startOffset
             * @property {number} endOffset
             */

            /**
             * Provide the range of content with a data to highlight DOM elements
             * @typedef {Object} highlightIndex
             * @property {boolean} [highlighted] Specifies if given range has highlights
             * @property {string|number} [c] Highlighter wrapper class name
             * @property {string|number} [groupId] Highlighter wrapper groupId attribute
             * @property {inlineRanges[]} [inlineRanges] The given range has more than one DOM element to highlight
             */

            /**
             * Update highlighting status
             *
             * @param {highlightIndex} highlightIndex - Highlight index
             */
            this.updateHasHighlights = highlightIndex => {
                this.hasHighlights = Object.values(highlightIndex).some(highlight => highlight.highlighted === true);
                this.updateHighlightsCounter(highlightIndex);
            };

            /**
             * Sends the highlighIndex to parent and updates hasHighlights
             */
            const saveHighlights = () => {
                const highlightIndex = highlighter.getHighlightIndex();
                window.parent.postMessage({ event: 'indexUpdated', payload: highlightIndex }, '*');
                this.updateHasHighlights(highlightIndex);
            };

            /**
             * Erases highlights and notifies the parent iframe
             *
             * @param {Event} e - Click event
             */
            const clearHighlightAndSave = e => {
                highlighter.clearSingleHighlight(e);
                saveHighlights();

                if (!this.hasHighlights) {
                    this.turnEraserOff();
                }
            };

            /**
             * Highlights the selection and notifies the parent iframe
             */
            this.highlight = () => {
                const selection = window.getSelection();

                if (selection === null) {
                    return;
                }

                highlighter.highlightRanges(getAllRanges(selection));

                selection.removeAllRanges();
                saveHighlights();
            };

            /**
             * Notify highlighter plugin which color is active
             * @param {@memberof Colors} color
             */
            this.setActiveColor = color => {
                highlighter.setActiveColor(color);
            };

            /**
             * Returns selector for all highlighter wrapper elements
             * @returns {string}
             */
            const getHighlightsClasses = () => {
                return Object.values(colors)
                    .map(color => `${CONTAINER_SELECTOR} .${color}`)
                    .join(',');
            };

            /**
             * Color counter updater
             * @param {highlightIndex[]} highlightIndex
             */
            this.updateHighlightsCounter = highlightIndex => {
                const colorCounter = Object.keys(colors).reduce((state, color) => {
                    state[color] = 0;
                    return state;
                }, {});

                highlightIndex.forEach(item => {
                    if (item.highlighted) {
                        const hasInlineRanges = Array.isArray(item.inlineRanges);

                        if (hasInlineRanges) {
                            item.inlineRanges.forEach(inlineItem => {
                                const colorId = inlineItem.c;

                                if (colorCounter.hasOwnProperty(colorId)) {
                                    colorCounter[colorId] += 1;
                                }
                            });
                        } else {
                            const colorId = item.c;

                            if (colorCounter.hasOwnProperty(colorId)) {
                                colorCounter[colorId] += 1;
                            }
                        }
                    }
                });

                Object.keys(colorCounter).forEach(colorName => {
                    if (this.$highlighterTray) {
                        const count = colorCounter[colorName];
                        const $colorCounter = $(`button.${colorName} .counter`, this.$highlighterTray);

                        $colorCounter.text(count > 99 ? 99 : count);
                    }
                });
            };

            /**
             * Turns on the eraser and adds the cursor
             */
            this.turnEraserOn = () => {
                this.$controls.$eraser.addClass('eraser-on');
                $(getHighlightsClasses()).off('click').on('click', clearHighlightAndSave);
                $(CONTAINER_SELECTOR).addClass('can-erase');
                this.isEraserOn = true;
                this.turnHighlighterOff();
            };

            /**
             * Turns off the eraser and removes the cursor
             */
            this.turnEraserOff = () => {
                this.$controls.$eraser.removeClass('eraser-on');
                $(getHighlightsClasses()).off('click');
                $(CONTAINER_SELECTOR).removeClass('can-erase');
                this.isEraserOn = false;
            };

            /**
             * Toggles the eraser mode
             */
            this.toggleEraser = () => {
                // Only turn on eraser if there are highlights
                if (this.hasHighlights) {
                    this.isEraserOn ? this.turnEraserOff() : this.turnEraserOn();
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
            };

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
            };

            /**
             * Toggles the direct highlighting mode
             *
             * @param {string} newColor
             */
            this.toggleHighlighter = newColor => {
                const $container = this.getAreaBroker().getArea('contentWrapper');

                if (this.currentColor) {
                    $container.find(`.${this.currentColor}`).removeClass('color-selected');
                }

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
            };

            this.$controls.$eraser.on('click', e => {
                e.preventDefault();
                this.toggleEraser();
            });

            this.$controls.$color.on('click', e => {
                e.preventDefault();

                const activeColor = $(e.currentTarget).attr('name');

                if (this.isEraserOn) {
                    this.toggleEraser();
                }

                this.setActiveColor(activeColor);
                this.toggleHighlighter(activeColor);
                this.highlight();
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
