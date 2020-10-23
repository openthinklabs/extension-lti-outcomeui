<?php
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
 * Copyright (c) 2013 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */

use oat\tao\model\user\TaoRoles;
use oat\taoLti\models\classes\LtiRoles;

return array(
    'name' => 'ltiOutcomeUi',
    'label' => 'LTI Result Tool Provider',
    'description' => 'The LTI Result Tool Provider allows third party applications to view results created in Tao',
    'license' => 'GPL-2.0',
    'version' => '0.7.0',
    'author' => 'Open Assessment Technologies',
    'requires' => array(
        'taoLti' => '>=6.3.3',
        'taoOutcomeUi' => '>=5.12.0',
        'taoQtiTestPreviewer' => '>=2.11.0'
    ),
    'models' => [],
    'install' => [
        'php' => [],
        'rdf' => [
            __DIR__ . '/install/ontology/instructorReviewerRole.rdf'
        ],
    ],
    'routes' => array(
        '/ltiOutcomeUi' => 'oat\\ltiOutcomeUi\\controller'
    ),
    'update' => 'oat\\ltiOutcomeUi\\scripts\\update\\Updater',
    'managementRole' => 'http://www.tao.lu/Ontologies/taoLti.rdf#LtiOutcomeUiManagerRole',
    'acl' => array(
        array('grant', 'http://www.tao.lu/Ontologies/taoLti.rdf#LtiOutcomeUiManagerRole', array('ext'=>'ltiOutcomeUi')),
        array('grant', TaoRoles::ANONYMOUS, array('ext'=>'ltiOutcomeUi', 'mod' => 'ItemResultPreviewer', 'act' => 'launch')),
        array('grant', LtiRoles::CONTEXT_INSTRUCTOR, array('ext'=>'ltiOutcomeUi', 'mod' => 'ItemResultPreviewer')),
    ),
    'constants' => array(

        # views directory
        "DIR_VIEWS"                => __DIR__.DIRECTORY_SEPARATOR."views".DIRECTORY_SEPARATOR,

        # default module name
        'DEFAULT_MODULE_NAME'    => 'Browser',

        #default action name
        'DEFAULT_ACTION_NAME'    => 'index',

        #BASE PATH: the root path in the file system (usually the document root)
        'BASE_PATH'                => __DIR__.DIRECTORY_SEPARATOR ,

        #BASE URL (usually the domain root)
        'BASE_URL'                => ROOT_URL . 'ltiOutcomeUi/',
    ),
    'extra' => array(
    )
);
