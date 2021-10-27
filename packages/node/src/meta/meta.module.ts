// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import {
  makeGaugeProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { ApiService } from '../indexer/api.service';
import { IndexerManager } from '../indexer/indexer.manager';
import { IndexerModule } from '../indexer/indexer.module';
import { PoiService } from '../indexer/poi.service';
import { StoreService } from '../indexer/store.service';
import { delay } from '../utils/promise';
import { MetricEventListener } from './event.listener';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';

@Module({
  imports: [PrometheusModule.register(), IndexerModule],
  controllers: [MetaController, HealthController],
  providers: [
    MetricEventListener,
    makeGaugeProvider({
      name: 'subql_indexer_api_connected',
      help: 'The indexer api connection status',
    }),
    makeGaugeProvider({
      name: 'subql_indexer_injected_api_connected',
      help: 'The indexer injected api connection status',
    }),
    makeGaugeProvider({
      name: 'subql_indexer_processing_block_height',
      help: 'The current processing block height',
    }),
    makeGaugeProvider({
      name: 'subql_indexer_processed_block_height',
      help: 'The last processed block height',
    }),
    makeGaugeProvider({
      name: 'subql_indexer_target_block_height',
      help: 'The latest finalized block height',
    }),
    makeGaugeProvider({
      name: 'subql_indexer_best_block_height',
      help: 'The latest best block height',
    }),
    makeGaugeProvider({
      name: 'subql_indexer_block_queue_size',
      help: 'The size of fetched block queue',
    }),
    makeGaugeProvider({
      name: 'subql_indexer_blocknumber_queue_size',
      help: 'The size of fetched block number queue',
    }),
    makeGaugeProvider({
      name: 'subql_indexer_using_dictionary',
      help: 'The status of indexer is using the dictionary',
    }),
    makeGaugeProvider({
      name: 'subql_indexer_skip_dictionary_count',
      help: 'The number of times indexer been skip use dictionary',
    }),
    {
      provide: MetaService,
      useFactory: async (apiService: ApiService) => {
        //The reason this is not working is indexermanager.start
        //wont run until dependencys are resolve which the method
        //is preventing us from doing

        /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
        while (true) {
          const networkMetaReady = apiService.getMeta();
          if (networkMetaReady) {
            break;
          } else {
            await delay(5);
          }
        }

        return new MetaService(apiService);
      },
      inject: [ApiService],
    },
    ApiService,
    StoreService,
    HealthService,
    PoiService,
  ],
})
export class MetaModule {}
