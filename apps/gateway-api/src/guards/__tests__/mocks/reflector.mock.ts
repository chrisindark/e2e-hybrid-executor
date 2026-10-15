import { createMock } from 'test/helpers/mock-factory';
import type { Reflector } from '@nestjs/core';

export const mockReflector = () => createMock<Reflector>();
