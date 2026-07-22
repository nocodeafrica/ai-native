import type {
  CompanyStatus,
  PauseReason,
  WorkspaceBackgroundKind,
  WorkspaceBackgroundPosition,
  WorkspaceBackgroundPresence,
  WorkspaceBackgroundPreset,
  WorkspaceGlassCharacter,
} from "../constants.js";

export interface Company {
  id: string;
  name: string;
  description: string | null;
  status: CompanyStatus;
  pauseReason: PauseReason | null;
  pausedAt: Date | null;
  issuePrefix: string;
  issueCounter: number;
  budgetMonthlyCents: number;
  spentMonthlyCents: number;
  attachmentMaxBytes: number;
  defaultResponsibleUserId: string | null;
  requireBoardApprovalForNewAgents: boolean;
  feedbackDataSharingEnabled: boolean;
  feedbackDataSharingConsentAt: Date | null;
  feedbackDataSharingConsentByUserId: string | null;
  feedbackDataSharingTermsVersion: string | null;
  brandColor: string | null;
  logoAssetId: string | null;
  logoUrl: string | null;
  workspaceBackgroundKind: WorkspaceBackgroundKind;
  workspaceBackgroundPreset: WorkspaceBackgroundPreset;
  workspaceBackgroundAssetId: string | null;
  workspaceBackgroundUrl: string | null;
  workspaceBackgroundPosition: WorkspaceBackgroundPosition;
  workspaceBackgroundPresence: WorkspaceBackgroundPresence;
  workspaceGlassCharacter: WorkspaceGlassCharacter;
  createdAt: Date;
  updatedAt: Date;
}
