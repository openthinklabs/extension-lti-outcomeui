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

use oat\taoOutcomeUi\helper\ResponseVariableFormatter;
use Psr\Log\LoggerInterface;
use taoResultServer_models_classes_ResponseVariable as ResponseVariable;

class StructuredVariablesToItemStateService
{
    private const RESULT_KEY_URI = 'uri';
    private const RESULT_KEY_ATTEMPT = 'attempt';
    private const RESULT_KEY_RESPONSE_VARIABLE = 'taoResultServer_models_classes_ResponseVariable';

    /** @var LoggerInterface */
    private $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

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
            $this->logNotHaveUriOrAttempt($resultVariables);
            return null;
        }

        return $this->formatResponseVariables($resultVariables);
    }

    private function formatResponseVariables(array $resultVariables): ?array
    {
        $responseVariableClasses = $resultVariables[self::RESULT_KEY_RESPONSE_VARIABLE] ?? null;
        if (false === is_array($responseVariableClasses)) {
            $this->logNotHaveResponseVariable($resultVariables);
            return null;
        }

        $variables = [];

        foreach ($resultVariables[self::RESULT_KEY_RESPONSE_VARIABLE] as $resultVariable) {
            $responseVariableClass = is_array($resultVariable) ? $resultVariable : [];
            $responseVariable = $responseVariableClass['var'] ?? null;
            if ($responseVariable instanceof ResponseVariable) {
                $variables[$responseVariable->getIdentifier()] = $this->formatResponseVariable(
                    $responseVariable,
                    $responseVariableClass
                );
            }
        }

        return $variables;
    }

    private function formatResponseVariable(ResponseVariable $responseVariable, array $responseVariableClass): array
    {
        if ($responseVariable->getBaseType() === 'file') {
            return $this->getFormatResponse([
                'base' => [
                    'file' => [
                        'uri' => $responseVariableClass['uri'] ?? null
                    ]
                ]
            ]);
        }

        return $this->getFormatResponse(ResponseVariableFormatter::formatVariableToPci($responseVariable));
    }

    private function getFormatResponse(array $response): array
    {
        return ['response' => $response];
    }

    private function logNotHaveUriOrAttempt(array $resultVariables): void
    {
        $this->logger->warning(
            sprintf(
                'Assessment result does not have the variables `%s` or `%s`',
                self::RESULT_KEY_URI,
                self::RESULT_KEY_ATTEMPT
            ),
            $resultVariables
        );
    }

    private function logNotHaveResponseVariable(array $resultVariables): void
    {
        $this->logger->warning(
            sprintf(
                'Assessment result does not have the variable `%s`',
                self::RESULT_KEY_RESPONSE_VARIABLE
            ),
            $resultVariables
        );
    }
}
