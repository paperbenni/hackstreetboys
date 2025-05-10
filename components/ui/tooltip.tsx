import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  className?: string;
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface TooltipContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement>;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined);

function useTooltip() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("useTooltip must be used within a TooltipProvider");
  }
  return context;
}

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const Tooltip = ({ children, className }: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className={cn("relative inline-flex", className)}>
        {children}
      </div>
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = ({ children, asChild = false }: TooltipTriggerProps) => {
  const { setIsOpen, triggerRef } = useTooltip();
  
  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      className={asChild ? "" : "inline-flex"}
    >
      {children}
    </div>
  );
};

const TooltipContent = ({ children, className }: TooltipContentProps) => {
  const { isOpen } = useTooltip();
  
  if (!isOpen) return null;
  
  return (
    <div
      className={cn(
        "z-50 absolute top-full mt-1 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-950 shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };