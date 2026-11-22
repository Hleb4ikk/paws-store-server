#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/58d296ae4e2b42bfe941db9cef7e82bed77b6d733cb978c0adaabd3e111d60b0/contract';
import startContract from '../../snapshots/58d296ae4e2b42bfe941db9cef7e82bed77b6d733cb978c0adaabd3e111d60b0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c709dba33838cf3edfe56057901ec66b7acee17a68c52b2b238ed5e6ccf95ac6/contract';
import endContract from '../../snapshots/c709dba33838cf3edfe56057901ec66b7acee17a68c52b2b238ed5e6ccf95ac6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('category', 'text', {
          notNull: true,
          default: lit('Uncategorized'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
