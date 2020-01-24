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
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */

namespace oat\ltiOutcomeUi\controller;

use oat\generis\model\GenerisRdf;
use oat\generis\model\OntologyAwareTrait;
use oat\oatbox\log\LoggerAwareTrait;
use oat\taoDelivery\model\execution\ServiceProxy;
use oat\taoLti\controller\ToolModule;
use oat\taoLti\models\classes\LtiException;
use oat\taoOutcomeUi\helper\ResponseVariableFormatter;
use oat\taoOutcomeUi\model\ResultsService;
use oat\taoOutcomeUi\model\ResultsViewerService;
use oat\taoQtiTestPreviewer\models\ItemPreviewer;
use oat\taoResultServer\models\classes\ResultServerService;
use \core_kernel_classes_Resource;
use oat\taoLti\models\classes\LtiMessages\LtiErrorMessage;

/**
 * Class ItemResultPreviewer
 *
 * @package oat\ltiOutcomeUi\controller
 * @author Moyon Camille camille@taotesting.com
 */
class ItemResultPreviewer extends ToolModule
{
    use OntologyAwareTrait;
    use LoggerAwareTrait;

    const PARAM_RESULT_ID = 'resultId';
    const PARAM_ITEM_REF = 'itemRef';

    /**
     * The result variables of an item
     *
     * @var array
     */
    protected $itemVariables;

    /**
     * Entry point to redirect to preview functionality
     *
     * @throws LtiException If unauthorized
     */
    public function run()
    {
        if ($this->hasAccess(self::class, 'preview')) {
            $this->redirect(_url('preview', null, null, [
                self::PARAM_RESULT_ID => $this->getRequiredParam(self::PARAM_RESULT_ID),
                self::PARAM_ITEM_REF => $this->getRequiredParam(self::PARAM_ITEM_REF),
            ]));
        }

        throw new LtiException(
            'You are not authorized to access this functionality.',
            LtiErrorMessage::ERROR_UNAUTHORIZED
        );
    }

    /**
     * Render a view to display result variables through QtiItemPreviewer component
     *
     * @throws LtiException
     * @throws \Exception
     */
    public function preview()
    {
        $resultIdentifier = $this->getRequiredParam(self::PARAM_RESULT_ID);
        $itemDefinition = $this->getRequiredParam(self::PARAM_ITEM_REF);

        try {
            /** @var ServiceProxy $serviceProxy */
            $serviceProxy = $this->getServiceLocator()->get(ServiceProxy::SERVICE_ID);
            $deliveryExecution = $serviceProxy->getDeliveryExecution($resultIdentifier);
            $delivery = $deliveryExecution->getDelivery();
        } catch (\Exception $e) {
            $this->logError('An error has occurred during LTI outcome preview: ' . $e->getMessage());
            $this->returnError(__('The given result is not associated to any delivery or does not exist.'), false);
            return;
        }

        try {
            $this->defaultData();
            $data['type'] = $this->getItemResultPreviewerType($resultIdentifier);
            $data['content'] = $this->getItemContent($itemDefinition, $resultIdentifier, $delivery->getUri());
            $data['state'] = current($this->getItemResultVariables($delivery, $resultIdentifier, $itemDefinition));
            $data['itemDefinition'] = $itemDefinition;
            $data['resultIdentifier'] = $resultIdentifier;
            $data['deliveryIdentifier'] = $delivery->getUri();
            $data['uri'] = $this->getItemUri($delivery, $resultIdentifier, $itemDefinition);
            $this->setData('data', $data);
            $this->setView('previewer/index.tpl');
        } catch (\Exception $e) {
            $this->logError('An error has occurred during LTI outcome preview: ' . $e->getMessage());
            $this->returnError(__('An error has occurred, please contact your administrator.'), false);
        }
    }

    /**
     * Get the type of item result previewer
     *
     * @param $resultIdentifier
     * @return string
     */
    protected function getItemResultPreviewerType($resultIdentifier)
    {
        return $this->getServiceLocator()->get(ResultsViewerService::SERVICE_ID)
            ->getDeliveryItemType($resultIdentifier);
    }

    /**
     * Get item variable e.g. state of item at last view by test taker
     *
     * @param core_kernel_classes_Resource $delivery
     * @param $resultIdentifier
     * @param $itemDefinition
     * @return null
     * @throws \common_Exception
     */
    protected function getItemResultVariables(core_kernel_classes_Resource $delivery, $resultIdentifier, $itemDefinition)
    {
        $variable = $this->getItemVariable($delivery, $resultIdentifier, $itemDefinition);
        if (isset($variable['uri'])) {
            $responses = ResponseVariableFormatter::formatStructuredVariablesToItemState([$variable]);
            if (isset($responses[$variable['uri']])) {
                return $responses[$variable['uri']];
            }
        }

        return null;
    }

    /**
     * Get the item variable of a $itemDefinition on $resultIdentifier
     *
     * @param $delivery
     * @param $resultIdentifier
     * @param $itemDefinition
     * @return array
     * @throws \common_exception_Error
     */
    protected function getItemVariable($delivery, $resultIdentifier, $itemDefinition)
    {
        if (!isset($this->itemVariables[$itemDefinition])) {
            $variables = $this->getDeliveryResultsService($delivery)->getStructuredVariables(
                $resultIdentifier, ResultsService::VARIABLES_FILTER_ALL, [\taoResultServer_models_classes_ResponseVariable::class]
            );

            $itemVariables = [];
            /** @var \taoResultServer_models_classes_ResponseVariable $variable */
            foreach ($variables as $variable) {
                if ($variable['internalIdentifier'] == $itemDefinition) {
                    $itemVariables[] = $variable;
                }
            }

            return $this->itemVariables[$itemDefinition] = empty($itemVariables) ? [] : array_pop($itemVariables);
        }

        return $this->itemVariables[$itemDefinition];
    }

    /**
     * Get the QTI item uri related to itemReference in a result
     * @param $delivery
     * @param $resultIdentifier
     * @param $itemDefinition
     * @return mixed
     * @throws \common_exception_Error
     */
    protected function getItemUri($delivery, $resultIdentifier, $itemDefinition)
    {
        $variable = $this->getItemVariable($delivery, $resultIdentifier, $itemDefinition);
        return $variable['uri'];
    }

    /**
     * Get the item content to preview it
     *
     * @param $itemDefinition
     * @param $resultIdentifier
     * @param $deliveryIdentifier
     * @return array
     * @throws \common_Exception
     * @throws \common_exception_Error
     * @throws \common_exception_InconsistentData
     * @throws \common_exception_NotFound
     */
    protected function getItemContent($itemDefinition, $resultIdentifier, $deliveryIdentifier)
    {
        return $this->getItemPreviewer()->setItemDefinition($itemDefinition)
            ->setUserLanguage($this->getUserLanguage($resultIdentifier, $deliveryIdentifier))
            ->setDelivery($this->getResource($deliveryIdentifier))
            ->loadCompiledItemData();
    }

    /**
     * Get the user language based on delivery execution
     *
     * @param string $resultId
     * @param string $deliveryUri
     * @return string
     * @throws \common_exception_Error
     */
    protected function getUserLanguage($resultId, $deliveryUri)
    {
        /** @var ResultServerService $resultServerService */
        $resultServerService = $this->getServiceLocator()->get(ResultServerService::SERVICE_ID);
        /** @var \taoResultServer_models_classes_ReadableResultStorage $implementation */
        $implementation = $resultServerService->getResultStorage($deliveryUri);

        $testTaker = new \core_kernel_users_GenerisUser($this->getResource($implementation->getTestTaker($resultId)));
        $lang = $testTaker->getPropertyValues(GenerisRdf::PROPERTY_USER_DEFLG);

        return empty($lang) ? DEFAULT_LANG : (string) current($lang);
    }

    /**
     * Get the item previewer service
     *
     * @return ItemPreviewer
     */
    protected function getItemPreviewer()
    {
        $itemPreviewer = new ItemPreviewer();
        return $this->propagate($itemPreviewer);
    }

    /**
     * Get results service associated to given delivery
     *
     * @param core_kernel_classes_Resource $delivery
     * @return ResultsService
     * @throws \common_exception_Error
     */
    protected function getDeliveryResultsService(core_kernel_classes_Resource $delivery)
    {
        $resultsService = ResultsService::singleton();
        $implementation = $resultsService->getReadableImplementation($delivery);
        $resultsService->setImplementation($implementation);
        return $resultsService;
    }

    /**
     * Get a required parameter from request, if does not exit throw LtiException
     *
     * @param $parameter
     * @return array|bool|mixed|null|string
     * @throws LtiException
     */
    protected function getRequiredParam($parameter)
    {
        if ($this->hasRequestParameter($parameter)) {
            return $this->getRequestParameter($parameter);
        }
        throw new LtiException(
            __('Item result previewer tool requires a "%s" parameter.', $parameter),
            LtiErrorMessage::ERROR_INVALID_PARAMETER
        );
    }
}
