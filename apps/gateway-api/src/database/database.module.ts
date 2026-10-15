import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getTypeOrmOptions } from './postgres.options';
import { PostgresService } from './postgres.service';

@Module({
  imports: [
    // forRootAsync so the options are resolved *after* ConfigModule has loaded
    // the env file; a plain forRoot would read process.env too early and miss
    // DATABASE_APP_URL, silently falling back to the superuser connection.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => getTypeOrmOptions('runtime'),
    }),
  ],
  providers: [PostgresService],
  exports: [PostgresService],
})
export class DatabaseModule {}
