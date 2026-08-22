import {
  PREPRODUCTION_KEY,
  PRODUCTION_KEY,
  STAGING_KEY,
} from '../../../../constants/constants';

export function getEnvFilePath() {
  if (process.env.NODE_ENV === PRODUCTION_KEY) {
    return '.env.production';
  }

  if (
    process.env.NODE_ENV === STAGING_KEY ||
    process.env.NODE_ENV === PREPRODUCTION_KEY
  ) {
    return '.env.staging';
  }

  return '.env.local';
}
