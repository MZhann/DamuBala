"use client";

// web/src/lib/child-context.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Child } from "@/types";

interface ChildContextType {
  currentChild: Child | null;
  setCurrentChild: (child: Child | null) => void;
  clearChild: () => void;
  isHydrated: boolean;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export function ChildProvider({ children }: { children: ReactNode }) {
  const [currentChild, setCurrentChild] = useState<Child | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read from sessionStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = sessionStorage.getItem("currentChild");
    if (stored) {
      try {
        setCurrentChild(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("currentChild");
      }
    }
    setIsHydrated(true);
  }, []);

  const handleSetChild = (child: Child | null) => {
    setCurrentChild(child);
    if (child) {
      sessionStorage.setItem("currentChild", JSON.stringify(child));
    } else {
      sessionStorage.removeItem("currentChild");
    }
  };

  const clearChild = () => {
    setCurrentChild(null);
    sessionStorage.removeItem("currentChild");
  };

  return (
    <ChildContext.Provider
      value={{
        currentChild,
        setCurrentChild: handleSetChild,
        clearChild,
        isHydrated,
      }}
    >
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const context = useContext(ChildContext);
  if (context === undefined) {
    throw new Error("useChild must be used within a ChildProvider");
  }
  return context;
}
