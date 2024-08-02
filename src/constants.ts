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
  includeClassName: boolean;
  includeMethodName: boolean;
}

export const ERROR_VAR_EXACT_NAMES = ["error", "exception"];
export const ERROR_VAR_NAMES = [...ERROR_VAR_EXACT_NAMES, ...["e", "err", "ex", "exc"]];

export const APEX_EXT = ".cls";

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
