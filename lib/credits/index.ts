/**
 * Credits Module - Barrel Export
 */

export {
  matchEligibleCredits,
  getStateCredits,
  hasStateCredits,
  getStackableCredits,
} from "./stateCreditMatcher";

export { useStateCredits } from "./useStateCredits";

export type {
  CreditProgram,
  ProjectInput,
  StateCreditMatch,
} from "./stateCreditMatcher";
