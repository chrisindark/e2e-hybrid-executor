import {
  BeforeApplicationShutdown,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';

@Injectable()
export class PingService
  implements BeforeApplicationShutdown, OnApplicationShutdown
{
  private readonly logger = new Logger(PingService.name);

  constructor() {}

  beforeApplicationShutdown = async (signal?: string) => {
    this.logger.debug(`beforeApplicationShutdown signal: ${signal}`);
    this.logger.debug('closing ping service...');

    return Promise.resolve();
  };

  onApplicationShutdown = async (signal?: string) => {
    this.logger.debug(`onApplicationShutdown signal: ${signal}`);
    this.logger.debug('closed ping service...');

    return Promise.resolve();
  };

  ping = async () => {
    return {
      message: 'pong',
    };
  };

  pingDetail = async (id: string) => {
    return {
      message: `pong: #${id}`,
    };
  };

  pingAuthenticated = async () => {
    return {
      message: 'authenticated pong',
    };
  };

  pingJwtAuthenticated = async () => {
    return {
      message: 'authenticated pong',
    };
  };

  pingThrowHttpError = async () => {
    throw new InternalServerErrorException();
  };

  pingThrowError = async () => {
    throw new Error('ping error message');
  };

  pingThrowUnhandledPromise = () => {
    return new Promise(() => {
      return new Promise(() => {
        throw new Error('test error');
      });
    });
  };
}
