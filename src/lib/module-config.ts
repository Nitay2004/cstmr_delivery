import type { ReactNode } from "react";

export type ModuleRow = { id: string } & Record<string, unknown>;

export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  format?: "amount" | "date";
  badge?: boolean;
  render?: (row: ModuleRow) => ReactNode;
}

export interface FormField {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  inputType?: "text" | "number" | "date";
  options?: string[];
}