import { Button } from "@/components/ui/button";

interface AddMappingButtonProps {
  isDisabled: boolean;
  onClick: () => void;
}

export const AddMappingButton = ({
  isDisabled,
  onClick,
}: AddMappingButtonProps) => (
  <Button
    className="group rounded-none bg-card py-12 transition-all hover:bg-muted"
    disabled={isDisabled}
    onClick={onClick}
    variant="outline"
  >
    <div className="flex flex-col items-center gap-1 transition-transform group-hover:scale-110">
      <span className="text-2xl opacity-50">+</span>
      <span className="font-medium text-xs uppercase tracking-widest">
        {isDisabled ? "Channel Limit Reached" : "Assign Channel"}
      </span>
    </div>
  </Button>
);
