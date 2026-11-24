#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2df10eee8c8aa250f1df0e83352cc83709668c945301ce082ee1bf0b44b3375b/contract';
import endContract from '../../snapshots/2df10eee8c8aa250f1df0e83352cc83709668c945301ce082ee1bf0b44b3375b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c709dba33838cf3edfe56057901ec66b7acee17a68c52b2b238ed5e6ccf95ac6/contract';
import startContract from '../../snapshots/c709dba33838cf3edfe56057901ec66b7acee17a68c52b2b238ed5e6ccf95ac6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'AppMeta',
        columns: [
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['key'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
