import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { getTypeOrmOptions } from './postgres.options';

const dataSource = new DataSource(getTypeOrmOptions());

export default dataSource;
