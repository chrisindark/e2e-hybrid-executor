import { DocumentBuilder } from '@nestjs/swagger';

import {
  PREPRODUCTION_KEY,
  PRODUCTION_KEY,
  STAGING_KEY,
} from '../../../../../constants/constants';

const appName = process.env.APP_NAME ?? 'App';
const subPath =
  process.env.NODE_ENV === PRODUCTION_KEY ||
  process.env.NODE_ENV === STAGING_KEY ||
  process.env.NODE_ENV === PREPRODUCTION_KEY
    ? '/app'
    : '';

const swaggerConfig = new DocumentBuilder()
  .setTitle(appName)
  .setDescription(`${appName} apis`)
  .setVersion('1.0.0')
  .addTag(appName)
  .addServer(subPath, appName)
  .addBearerAuth(
    {
      type: 'http',
      description: 'Enter JWT token',
      name: 'JWT',
      in: 'header',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    'JwtAuth',
  )
  .addBearerAuth(
    {
      type: 'apiKey',
      description: 'Enter hash value',
      name: 'hash',
      in: 'header',
    },
    'UserAuth',
  )
  .build();

export default swaggerConfig;
