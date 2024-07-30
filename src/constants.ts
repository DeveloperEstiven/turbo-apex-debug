export const REGEXP = {
  LEADING_WHITESPACE: /^\s+/,
  METHOD_NAME: /(\w+)\s*\(/,
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

export const ERROR_VAR_NAMES = ["e", "err", "error", "ex", "exc", "exception"];

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

export const ACCESS_MODIFIERS = ["public ", "private ", "protected ", "global ", "override ", "@IsTest ", "static "];
