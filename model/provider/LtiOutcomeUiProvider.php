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

namespace oat\ltiOutcomeUi\model\provider;

use oat\generis\model\DependencyInjection\ContainerServiceProviderInterface;
use oat\ltiOutcomeUi\model\service\ResultVariableStructureHandler;
use oat\oatbox\log\LoggerService;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\DependencyInjection\Loader\Configurator\ServicesConfigurator;
use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

final class LtiOutcomeUiProvider implements ContainerServiceProviderInterface
{
    public function __invoke(ContainerConfigurator $configurator): void
    {
        $services = $configurator->services();
        $this->defineResultVariableStructureHandler($services);
    }

    private function defineResultVariableStructureHandler(ServicesConfigurator $services): void
    {
        $services
            ->set(ResultVariableStructureHandler::class, ResultVariableStructureHandler::class)
            ->public()
            ->args([
                service(LoggerService::SERVICE_ID)
            ]);
    }
}
