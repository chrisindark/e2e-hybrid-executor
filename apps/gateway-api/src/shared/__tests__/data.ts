import type { TestAction } from '../types';

export const buildTestAction = (): TestAction => 'click' as TestAction;

export const buildActorType = () => 'user' as const;

export const buildPlanTier = () => 'free' as const;
