import type { ExecutionMode } from '../../shared/trace-event.entity';

/**
 * Transport-agnostic options for a test run. The HTTP `RunTestDto` maps request
 * fields onto this shape; the validation lives in the HTTP layer.
 */
export interface RunOptions {
  mode?: ExecutionMode;

  /** Step `order` to deliberately break, simulating UI drift. Optional -
   *  omit to run the whole test deterministically with no forced failure. */
  forceFailureAtStep?: number;
}
