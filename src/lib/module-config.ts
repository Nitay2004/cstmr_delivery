export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  format?: "amount";
  badge?: boolean;
}

export interface FormField {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  inputType?: "text" | "number";
}