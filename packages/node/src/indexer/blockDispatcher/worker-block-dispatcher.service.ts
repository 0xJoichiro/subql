// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import assert from 'assert';
import path from 'path';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import {
  getLogger,
  NodeConfig,
  IndexerEvent,
  Worker,
  AutoQueue,
  StoreService,
  PoiService,
  StoreCacheService,
  BaseBlockDispatcher,
  IProjectService,
} from '@subql/node-core';
import { Store } from '@subql/types';
import chalk from 'chalk';
import { last } from 'lodash';
import { Sequelize, Transaction } from 'sequelize';
import { SubqueryProject } from '../../configure/SubqueryProject';
import { RuntimeService } from '../runtime/runtimeService';
import {
  FetchBlock,
  ProcessBlock,
  InitWorker,
  NumFetchedBlocks,
  NumFetchingBlocks,
  GetWorkerStatus,
  SyncRuntimeService,
  GetSpecFromMap,
  ReloadDynamicDs,
} from '../worker/worker';
// import { BaseBlockDispatcher } from './base-block-dispatcher';

const logger = getLogger('WorkerBlockDispatcherService');

type IIndexerWorker = {
  processBlock: ProcessBlock;
  fetchBlock: FetchBlock;
  numFetchedBlocks: NumFetchedBlocks;
  numFetchingBlocks: NumFetchingBlocks;
  getStatus: GetWorkerStatus;
  syncRuntimeService: SyncRuntimeService;
  getSpecFromMap: GetSpecFromMap;
  reloadDynamicDs: ReloadDynamicDs;
};

type IInitIndexerWorker = IIndexerWorker & {
  initWorker: InitWorker;
};

type IndexerWorker = IIndexerWorker & {
  terminate: () => Promise<number>;
};

async function createIndexerWorker(store: Store): Promise<IndexerWorker> {
  const indexerWorker = Worker.create<IInitIndexerWorker>(
    path.resolve(__dirname, '../../../dist/indexer/worker/worker.js'),
    [
      'initWorker',
      'processBlock',
      'fetchBlock',
      'numFetchedBlocks',
      'numFetchingBlocks',
      'getStatus',
      'syncRuntimeService',
      'getSpecFromMap',
      'reloadDynamicDs',
    ],
    {
      storeCount: store.count.bind(store),
      storeGet: store.get.bind(store),
      storeGetByField: store.getByField.bind(store),
      storeGetOneByField: store.getOneByField.bind(store),
      storeSet: store.set.bind(store),
      storeBulkCreate: store.bulkCreate.bind(store),
      storeBulkUpdate: store.bulkUpdate.bind(store),
      storeRemove: store.remove.bind(store),
    },
  );

  await indexerWorker.initWorker();

  return indexerWorker;
}

@Injectable()
export class WorkerBlockDispatcherService
  extends BaseBlockDispatcher<AutoQueue<void>>
  implements OnApplicationShutdown
{
  private workers: IndexerWorker[];
  private numWorkers: number;
  private runtimeService: RuntimeService;

  private taskCounter = 0;
  private isShutdown = false;

  constructor(
    nodeConfig: NodeConfig,
    eventEmitter: EventEmitter2,
    @Inject('IProjectService') projectService: IProjectService,
    storeService: StoreService,
    storeCacheService: StoreCacheService,
    private sequelize: Sequelize,
    poiService: PoiService,
    @Inject('ISubqueryProject') project: SubqueryProject,
  ) {
    const numWorkers = nodeConfig.workers;
    super(
      nodeConfig,
      eventEmitter,
      project,
      projectService,
      new AutoQueue(numWorkers * nodeConfig.batchSize * 2),
      storeService,
      storeCacheService,
      poiService,
    );
    this.numWorkers = numWorkers;
  }

  async init(
    onDynamicDsCreated: (height: number) => Promise<void>,
    runtimeService?: RuntimeService,
  ): Promise<void> {
    if (this.nodeConfig.unfinalizedBlocks) {
      throw new Error(
        'Sorry, best block feature is not supported with workers yet.',
      );
    }

    this.workers = await Promise.all(
      new Array(this.numWorkers)
        .fill(0)
        .map(() => createIndexerWorker(this.storeService.getStore())),
    );

    this.onDynamicDsCreated = onDynamicDsCreated;

    const blockAmount = await this.projectService.getProcessedBlockCount();
    this.setProcessedBlockCount(blockAmount ?? 0);
    // Sync workers runtime from main
    this.runtimeService = runtimeService;
    this.syncWorkerRuntimes();
  }

  async onApplicationShutdown(): Promise<void> {
    this.isShutdown = true;
    // Stop processing blocks
    this.queue.abort();

    // Stop all workers
    if (this.workers) {
      await Promise.all(this.workers.map((w) => w.terminate()));
    }
  }

  syncWorkerRuntimes(): void {
    this.workers.map((w) =>
      w.syncRuntimeService(
        this.runtimeService.specVersionMap,
        this.runtimeService.latestFinalizedHeight,
      ),
    );
  }

  enqueueBlocks(heights: number[], latestBufferHeight?: number): void {
    if (!!latestBufferHeight && !heights.length) {
      this.latestBufferedHeight = latestBufferHeight;
      return;
    }

    logger.info(
      `Enqueueing blocks ${heights[0]}...${last(heights)}, total ${
        heights.length
      } blocks`,
    );

    // eslint-disable-next-line no-constant-condition
    if (true) {
      /*
       * Load balancing:
       * worker1: 1,2,3
       * worker2: 4,5,6
       */
      const workerIdx = this.getNextWorkerIndex();
      heights.map((height) => this.enqueueBlock(height, workerIdx));
    } else {
      /*
       * Load balancing:
       * worker1: 1,3,5
       * worker2: 2,4,6
       */
      heights.map((height) =>
        this.enqueueBlock(height, this.getNextWorkerIndex()),
      );
    }

    this.latestBufferedHeight = latestBufferHeight ?? last(heights);
  }

  private enqueueBlock(height: number, workerIdx: number) {
    if (this.isShutdown) return;
    const worker = this.workers[workerIdx];

    assert(worker, `Worker ${workerIdx} not found`);

    // Used to compare before and after as a way to check if queue was flushed
    const bufferedHeight = this.latestBufferedHeight;

    const processBlock = async () => {
      let tx: Transaction;
      try {
        // get SpecVersion from main runtime service
        const { blockSpecVersion, syncedDictionary } =
          await this.runtimeService.getSpecVersion(height);
        // if main runtime specVersion has been updated, then sync with all workers specVersion map, and lastFinalizedBlock
        if (syncedDictionary) {
          this.syncWorkerRuntimes();
        }
        const start = new Date();
        await worker.fetchBlock(height, blockSpecVersion);
        const end = new Date();

        if (bufferedHeight > this.latestBufferedHeight) {
          logger.debug(`Queue was reset for new DS, discarding fetched blocks`);
          return;
        }

        const waitTime = end.getTime() - start.getTime();
        if (waitTime > 1000) {
          logger.info(
            `Waiting to fetch block ${height}: ${chalk.red(`${waitTime}ms`)}`,
          );
        } else if (waitTime > 200) {
          logger.info(
            `Waiting to fetch block ${height}: ${chalk.yellow(
              `${waitTime}ms`,
            )}`,
          );
        }

        tx = await this.sequelize.transaction();

        this.preProcessBlock(height, tx);

        const {
          blockHash,
          dynamicDsCreated,
          /*operationHash, */ reindexBlockHeight,
        } = await worker.processBlock(height);

        await this.postProcessBlock(height, tx, {
          dynamicDsCreated,
          blockHash,
          // operationHash: Buffer.from(operationHash, 'base64'),
          reindexBlockHeight,
        });

        await tx.commit();

        if (dynamicDsCreated) {
          // Ensure all workers are aware of all dynamic ds
          await Promise.all(this.workers.map((w) => w.reloadDynamicDs()));
        }
      } catch (e) {
        await tx.rollback();
        logger.error(
          e,
          `failed to index block at height ${height} ${
            e.handler ? `${e.handler}(${e.stack ?? ''})` : ''
          }`,
        );
        process.exit(1);
      }
    };

    void this.queue.put(processBlock);
  }

  @Interval(15000)
  async sampleWorkerStatus(): Promise<void> {
    for (const worker of this.workers) {
      const status = await worker.getStatus();
      logger.info(JSON.stringify(status));
    }
  }

  // Getter doesn't seem to cary from abstract class
  get latestBufferedHeight(): number {
    return this._latestBufferedHeight;
  }

  set latestBufferedHeight(height: number) {
    super.latestBufferedHeight = height;
    // There is only a single queue with workers so we treat them as the same
    this.eventEmitter.emit(IndexerEvent.BlockQueueSize, {
      value: this.queueSize,
    });
  }

  private getNextWorkerIndex(): number {
    const index = this.taskCounter % this.numWorkers;

    this.taskCounter++;

    return index;
  }
}
