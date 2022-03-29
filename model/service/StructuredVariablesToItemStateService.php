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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */

declare(strict_types=1);

namespace oat\ltiOutcomeUi\model\service;

use oat\oatbox\service\ConfigurableService;
use oat\taoOutcomeUi\helper\ResponseVariableFormatter;
use taoResultServer_models_classes_ResponseVariable as ResponseVariable;

class StructuredVariablesToItemStateService extends ConfigurableService
{
    public const SERVICE_ID = 'ltiOutcomeUi/StructuredVariablesToItemStateService';

    private const RESULT_KEY_URI = 'uri';
    private const RESULT_KEY_ATTEMPT = 'attempt';
    private const RESULT_KEY_RESPONSE_VARIABLE = 'taoResultServer_models_classes_ResponseVariable';

    public function format(array $testResultVariables): array
    {
        $formatted = [];
        foreach ($testResultVariables as $resultVariables) {
            $itemResults = $this->formatResultVariables($resultVariables);
            if ($itemResults) {
                $itemUri = $resultVariables[self::RESULT_KEY_URI];
                $formatted[$itemUri][$resultVariables[self::RESULT_KEY_ATTEMPT]] = $itemResults;
            }
        }

        return $formatted;
    }

    private function formatResultVariables(array $resultVariables): ?array
    {
        if (false === isset($resultVariables[self::RESULT_KEY_URI], $resultVariables[self::RESULT_KEY_ATTEMPT])) {
            return null;
        }

        return $this->formatResponseVariables($resultVariables);
    }

    private function formatResponseVariables(array $resultVariables): ?array
    {
        if (false === isset($resultVariables[self::RESULT_KEY_RESPONSE_VARIABLE])) {
            return null;
        }

        $variables = [];

        $responseVariableClasses = $resultVariables[self::RESULT_KEY_RESPONSE_VARIABLE];
        foreach ($responseVariableClasses as $responseVariableClass) {
            $uri = $responseVariableClass['uri'] ?? null;
            $responseVariable = $responseVariableClass['var'] ?? null;
            if ($responseVariable instanceof ResponseVariable) {
                $variables[$responseVariable->getIdentifier()] = $this->formatResponseVariable($responseVariable, $uri);
            }
        }

        return $variables;
    }

    private function formatResponseVariable(ResponseVariable $responseVariable, $uri): array
    {
        if ($responseVariable->getBaseType() === 'file') {
            return $this->getFormatResponse([
                'base' => [
                    'file' => ['uri' => $uri]
                ]
            ]);
        }

        return $this->getFormatResponse(ResponseVariableFormatter::formatVariableToPci($responseVariable));
    }

    private function getFormatResponse(array $response): array
    {
        return ['response' => $response];
    }
}
