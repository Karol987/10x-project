// src/components/onboarding/ProgressBar.tsx

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Visual progress indicator for onboarding steps
 * Shows current step and progress bar
 */
export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Krok {currentStep} z {totalSteps}
        </span>
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full bg-primary transition-all duration-500 ease-out", "rounded-full")}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Postęp onboardingu: krok ${currentStep} z ${totalSteps}`}
        />
      </div>
    </div>
  );
}
