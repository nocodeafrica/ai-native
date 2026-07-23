import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { assets } from "./assets.js";
import { companies } from "./companies.js";

export const companyWorkspaceBackgrounds = pgTable(
  "company_workspace_backgrounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyUq: uniqueIndex("company_workspace_backgrounds_company_uq").on(table.companyId),
    assetUq: uniqueIndex("company_workspace_backgrounds_asset_uq").on(table.assetId),
  }),
);
