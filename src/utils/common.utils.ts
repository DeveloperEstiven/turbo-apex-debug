import * as vscode from "vscode";
import { Config } from "../constants";

const showErrorMessage = (message: string) => {
  const prefixedMessage = `⚠️ Turbo System Debug: ${message}`;
  vscode.window.showErrorMessage(prefixedMessage);
};

type KnownError = "NO_EDITOR" | "NOT_HIGHLIGHTED" | "INVALID_ENTITY";
export const handleError = (type: KnownError) => {
  switch (type) {
    case "NO_EDITOR":
      showErrorMessage("Editor is not active");
      break;
    case "NOT_HIGHLIGHTED":
      showErrorMessage("No text highlighted");
      break;
    case "INVALID_ENTITY":
      showErrorMessage("Please open an Apex (.cls) or Trigger (.trigger) file");
      break;
    default:
      showErrorMessage("An unknown error occurred");
  }
};

export const getConfiguration = () => {
  const {
    errorMessagePrefixes,
    logMessageDelimiter,
    logMessagePrefixes,
    promptPrefix,
    includeEntityName,
    includeMethodName,
    includeLineNum,
  } = vscode.workspace.getConfiguration("turboSystemDebug") as unknown as Config;

  const getPrefix = async (type: "REGULAR" | "ERROR" = "REGULAR") => {
    const prefixes = type === "REGULAR" ? [...logMessagePrefixes, ...errorMessagePrefixes] : errorMessagePrefixes;

    if (!prefixes.length) {
      return "";
    }

    if (promptPrefix && prefixes.length > 1) {
      return (await vscode.window.showQuickPick(prefixes, { placeHolder: "Select Prefix" })) || "";
    }

    return prefixes[getRandomIndex(prefixes)];
  };

  return {
    delimiter: logMessageDelimiter,
    getPrefix,
    includeLineNum,
    includeEntityName,
    includeMethodName,
  };
};

export const getRandomIndex = <T>(array: T[]) => Math.floor(Math.random() * array.length);

export const findSymbols = (kind: vscode.SymbolKind, symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] => {
  const instances = symbols.filter((symbol) => symbol.kind === kind);
  return instances.concat(symbols.flatMap((symbol) => findSymbols(kind, symbol.children)));
};
