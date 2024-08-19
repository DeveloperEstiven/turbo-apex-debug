export const REGEXP = {
  LEADING_WHITESPACE: /^\s+/,
  BACKSLASH: /\\/g,
} as const;

export interface Config {
  logMessagePrefixes: string[];
  errorMessagePrefixes: string[];
  logMessageDelimiter: string;
  promptPrefix: boolean;
  includeLineNum: boolean;
  includeEntityName: boolean;
  includeMethodName: boolean;
}

export const ERROR_VAR_EXACT_NAMES = ["error", "exception"];
export const ERROR_VAR_NAMES = [...ERROR_VAR_EXACT_NAMES, ...["e", "err", "ex", "exc"]];

export const SUPPORTED_EXTENSIONS = [".cls", ".trigger", ".apex"] as const;

export const TYPES = [
  "Integer",
  "String",
  "Boolean",
  "Date",
  "Datetime",
  "Decimal",
  "Double",
  "Long",
  "Object",
  "Id",
  "List",
  "Set",
  "Map",
  "sObject",
  "Blob",
  "Time",
  "Enum",
  "Interface",
  "Void",
  "Any",
];

export const SPACING_KEYWORDS = [
  "public ",
  "private ",
  "protected ",
  "global ",
  "override ",
  "@IsTest ",
  "static ",
  "(",
  ")",
  "{",
];
