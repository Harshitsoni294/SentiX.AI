import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "Fetching trending posts..." }: LoadingScreenProps) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-brand2/10 animate-fade-in" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center gap-4 animate-enter">
        <Loader2 className="animate-spin" />
        <p className="text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
