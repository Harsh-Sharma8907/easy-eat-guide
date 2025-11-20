import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpeakingToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export const SpeakingToggle = ({ enabled, onToggle }: SpeakingToggleProps) => {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className="relative overflow-hidden hover-scale shadow-soft"
    >
      {enabled ? (
        <Volume2 className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <VolumeX className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle speaking mode</span>
    </Button>
  );
};
