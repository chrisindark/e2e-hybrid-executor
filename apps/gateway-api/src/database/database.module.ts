import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getTypeOrmOptions } from './postgres.options';
import { PostgresService } from './postgres.service';

@Module({
  imports: [TypeOrmModule.forRoot(getTypeOrmOptions())],
  providers: [PostgresService],
  exports: [PostgresService],
})
export class DatabaseModule {}
