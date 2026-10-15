import 'reflect-metadata';

import { join } from 'node:path';

import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { getEnvFilePath } from '../apps/mainApp/modules/utils/utils.helper';
import { getTypeOrmOptions } from './postgres.options';

// The migration CLI runs from packages/db, so resolve the env file against the
// app root rather than the working directory.
config({ path: join(__dirname, '..', '..', getEnvFilePath()) });

// Migrations run as the owning role: `app_runtime` is not allowed to run DDL.
const dataSource = new DataSource(getTypeOrmOptions('migration'));

export default dataSource;
