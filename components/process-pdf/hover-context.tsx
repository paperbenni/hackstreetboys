import React, { createContext, useContext, useState, ReactNode } from "react";

interface HoverContextType {
  hoveredCommission: string | null;
  setHoveredCommission: (commission: string | null) => void;
}

const HoverContext = createContext<HoverContextType | undefined>(undefined);

export const HoverProvider = ({ children }: { children: ReactNode }) => {
  const [hoveredCommission, setHoveredCommission] = useState<string | null>(null);
  return (
    <HoverContext.Provider value={{ hoveredCommission, setHoveredCommission }}>
      {children}
    </HoverContext.Provider>
  );
};

export const useHover = () => {
  const context = useContext(HoverContext);
  if (!context) {
    throw new Error("useHover must be used within a HoverProvider");
  }
  return context;
}; 