import { CircularProgress } from "@/components/ui/Common";
import type { IconComponent } from "@/types/finance.types";

interface CircularProgressItemProps {
  Icon: IconComponent;
  progress: number;
  size?: number;
}

export function CircularProgressItem({
  Icon,
  progress,
  size = 64,
}: CircularProgressItemProps) {
  return <CircularProgress progress={progress} size={size} icon={Icon} />;
}
