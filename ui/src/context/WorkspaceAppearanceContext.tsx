import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { WorkspaceAppearanceDraft } from "../lib/workspace-appearance";

interface WorkspaceAppearancePreview {
  companyId: string;
  appearance: WorkspaceAppearanceDraft;
}

interface WorkspaceAppearanceContextValue {
  draft: WorkspaceAppearancePreview | null;
  preview: (companyId: string, appearance: WorkspaceAppearanceDraft) => void;
  clearPreview: () => void;
}

const FALLBACK_VALUE: WorkspaceAppearanceContextValue = {
  draft: null,
  preview: () => undefined,
  clearPreview: () => undefined,
};

const WorkspaceAppearanceContext = createContext<WorkspaceAppearanceContextValue>(FALLBACK_VALUE);

export function WorkspaceAppearanceProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<WorkspaceAppearancePreview | null>(null);
  const preview = useCallback((companyId: string, appearance: WorkspaceAppearanceDraft) => {
    setDraft({ companyId, appearance });
  }, []);
  const clearPreview = useCallback(() => setDraft(null), []);
  const value = useMemo(() => ({ draft, preview, clearPreview }), [clearPreview, draft, preview]);
  return <WorkspaceAppearanceContext.Provider value={value}>{children}</WorkspaceAppearanceContext.Provider>;
}

export function useWorkspaceAppearancePreview() {
  return useContext(WorkspaceAppearanceContext);
}
