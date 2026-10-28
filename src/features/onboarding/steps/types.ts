import type { OnboardingState } from '../state'

export interface StepProps {
  state: OnboardingState
  update: (patch: Partial<OnboardingState>) => void
}
