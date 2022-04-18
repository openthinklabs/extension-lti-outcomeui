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

namespace oat\ltiOutcomeUi\test\unit\model;

use oat\ltiOutcomeUi\model\service\ResultVariableStructureHandler;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use taoResultServer_models_classes_ResponseVariable as ResponseVariable;

final class ResultVariableStructureHandlerTest extends TestCase
{
    /** @var ResultVariableStructureHandler */
    private $resultVariableStructureHandler;

    /** @var LoggerInterface|MockObject */
    private $loggerMock;

    public function testFormatWithoutUriAndAttempt(): void
    {
        $testResultVariable = [
            'uri1' => 'uri',
            'attempt1' => 'attempt',
        ];

        $this->loggerMock
            ->expects(self::once())
            ->method('warning')
            ->with(
                'Assessment result does not have the variables `uri` or `attempt`',
                $testResultVariable
            );

        self::assertSame(
            [],
            $this->resultVariableStructureHandler->format([$testResultVariable])
        );
    }

    public function testFormatWithoutResponseClass(): void
    {
        $testResultVariable = [
            'uri' => 'URI',
            'attempt' => 'attempt',
            'taoResultServer_models_classes_ResponseVariable' => null,
        ];

        $this->loggerMock
            ->expects(self::once())
            ->method('warning')
            ->with(
                'Assessment result does not have the variable `taoResultServer_models_classes_ResponseVariable`',
                $testResultVariable
            );

        self::assertSame(
            [],
            $this->resultVariableStructureHandler->format([$testResultVariable])
        );
    }

    /**
     * @dataProvider providerFormat
     */
    public function testFormat(array $resultVariables, array $expected): void
    {
        self::assertSame(
            $expected,
            $this->resultVariableStructureHandler->format($resultVariables)
        );
    }

    public function providerFormat(): array
    {
        return [
            'without-response-class' => [
                [$this->getItemResultWithoutResponseClass()],
                [],
            ],
            'normal' => [
                [$this->getItemResult()],
                [
                    'URI' => [
                        'attempt' => [
                            'IDENTIFIER' => [
                                'response' => [
                                    'base' => ['string' => 'value'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'file' => [
                [$this->getItemResultFile()],
                [
                    'URI' => [
                        'attempt' => [
                            'IDENTIFIER' => [
                                'response' => [
                                    'base' => [
                                        'file' => ['uri' => 'FILE'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    private function getItemResultWithoutResponseClass(): array
    {
        return [
            'uri' => 'URI',
            'attempt' => 'attempt',
            'taoResultServer_models_classes_ResponseVariable' => [
                [
                    'uri' => 'FILE',
                    'var' => null,
                ],
            ],
        ];
    }

    private function getItemResult(): array
    {
        $responseVariable = $this->createMock(ResponseVariable::class);
        $responseVariable->method('getIdentifier')->willReturn('IDENTIFIER');
        $responseVariable->method('getValue')->willReturn('value');
        $responseVariable->method('getBaseType')->willReturn('string');
        $responseVariable->method('getCardinality')->willReturn('single');

        return [
            'uri' => 'URI',
            'attempt' => 'attempt',
            'taoResultServer_models_classes_ResponseVariable' => [
                [
                    'uri' => 'STRING',
                    'var' => $responseVariable,
                ],
            ],
        ];
    }

    private function getItemResultFile(): array
    {
        $responseVariable = $this->createMock(ResponseVariable::class);
        $responseVariable->method('getIdentifier')->willReturn('IDENTIFIER');
        $responseVariable->method('getBaseType')->willReturn('file');

        return [
            'uri' => 'URI',
            'attempt' => 'attempt',
            'taoResultServer_models_classes_ResponseVariable' => [
                [
                    'uri' => 'FILE',
                    'var' => $responseVariable,
                ],
            ],
        ];
    }

    protected function setUp(): void
    {
        $this->loggerMock = $this->createMock(LoggerInterface::class);
        $this->resultVariableStructureHandler = new ResultVariableStructureHandler($this->loggerMock);
    }
}
