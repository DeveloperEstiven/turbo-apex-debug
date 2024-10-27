import { TextDocument, Position, TextEditor, Range, commands, DocumentSymbol, SymbolKind } from "vscode";
import { SPACING_KEYWORDS, REGEXP, TYPES, ERROR_VAR_NAMES, SUPPORTED_EXTENSIONS } from "../constants";
import { findSymbols, getConfiguration, handleError, isRunningInTest } from "./common.utils";

const determineSpacing = (document: TextDocument, lineNum: number) => {
  let lineText = document.lineAt(lineNum).text;
  const keywordCount = SPACING_KEYWORDS.reduce((count, keyword) => count + (lineText.includes(keyword) ? 1 : 0), 0);

  if (keywordCount > 2) {
    lineNum++;
    lineText = document.lineAt(lineNum).text;

    if (lineText.includes("{")) {
      while (!lineText.includes("}") && lineNum < document.lineCount) {
        lineNum++;
        lineText = document.lineAt(lineNum).text;
      }
      lineText = document.lineAt(lineNum - 2).text;
    }
  }

  return lineText.match(REGEXP.LEADING_WHITESPACE)?.[0] || "";
};

const buildDebug = ({
  delimiter,
  prefix,
  spacing,
  text,
  startBreak,
  endBreak,
  suffix = "",
  entityName,
  lineNum,
  methodName,
}: BuildDebugStatementParams) => {
  const startLineBreak = startBreak ? "\n" : "";
  const endLineBreak = endBreak ? "\n" : "";
  const formattedPrefix = prefix ? `${prefix} ` : "";
  const formattedLineNum = lineNum ? `[${lineNum}] ` : "";
  const formattedEntityName = entityName ? `[${entityName}] ` : "";
  const formattedMethodName = methodName ? `[${methodName}] ` : "";
  return `${startLineBreak}${spacing}System.debug('${formattedPrefix}${formattedLineNum}${formattedEntityName}${formattedMethodName}${text}${delimiter} ' + ${text}${suffix});${endLineBreak}`;
};

const getMethodName = async (lineNumber: number, document: TextDocument): Promise<string> => {
  const symbols = await commands.executeCommand<DocumentSymbol[]>("vscode.executeDocumentSymbolProvider", document.uri);

  if (isRunningInTest()) {
    return "methodName";
  }

  if (symbols?.length) {
    const methodNames = findSymbols(SymbolKind.Method, symbols).map((method) => method.name);

    while (lineNumber >= 0) {
      const lineText = document.lineAt(lineNumber).text;
      const matchingMethodName = methodNames.find((methodName) => lineText.includes(methodName));
      if (matchingMethodName) {
        return matchingMethodName;
      }
      lineNumber--;
    }
  }

  return "";
};

export const insertDebug = async (selectionLineNum: number, text: string, editor: TextEditor) => {
  const { document } = editor;

  const { delimiter, includeLineNum, includeEntityName, includeMethodName, getPrefix } = getConfiguration();
  const spacing = determineSpacing(document, selectionLineNum);

  const prefix = await getPrefix(ERROR_VAR_NAMES.includes(text.trim().toLowerCase()) ? "ERROR" : "REGULAR");
  if (!prefix) {
    return;
  }

  const debugParams: BuildDebugStatementParams = { spacing, text, delimiter, prefix };

  const fileExtension = extractFileExtension(document.fileName);
  if (!fileExtension) {
    return;
  }

  if (fileExtension !== ".apex") {
    debugParams.entityName = includeEntityName ? extractEntityName(document.fileName, fileExtension) : "";
  }

  if (fileExtension === ".cls") {
    debugParams.methodName = includeMethodName ? await getMethodName(selectionLineNum, document) : "";
  }

  await editor.edit((builder) => {
    for (let lineNum = selectionLineNum; lineNum < document.lineCount; lineNum++) {
      const lineText = document.lineAt(lineNum).text;

      if (shouldInsert.afterException(lineText, text)) {
        debugParams.suffix = ".getMessage()";
        debugParams.endBreak = true;
        debugParams.lineNum = includeLineNum ? lineNum + 2 : undefined;
        builder.insert(new Position(lineNum + 1, 0), buildDebug(debugParams));
        break;
      }

      if (shouldInsert.beforeReturn(lineText.trim())) {
        debugParams.endBreak = true;
        debugParams.lineNum = includeLineNum ? lineNum + 1 : undefined;
        builder.insert(new Position(lineNum, 0), buildDebug(debugParams));
        break;
      }

      if (shouldInsert.afterSemicolon(lineText)) {
        debugParams.startBreak = true;
        debugParams.lineNum = includeLineNum ? lineNum + 2 : undefined;
        builder.insert(new Position(lineNum, lineText.indexOf(";") + 1), buildDebug(debugParams));
        break;
      }

      if (shouldInsert.afterBrace(lineText)) {
        debugParams.startBreak = true;
        debugParams.lineNum = includeLineNum ? lineNum + 2 : undefined;
        builder.insert(new Position(lineNum, lineText.length), buildDebug(debugParams));
        break;
      }

      if (shouldInsert.beforeBrace(lineText.trim())) {
        debugParams.lineNum = includeLineNum ? lineNum + 1 : undefined;
        builder.insert(new Position(lineNum, 0), buildDebug(debugParams));
        break;
      }
    }
  });
};

export const removeAll = async (editor: TextEditor) => {
  const linesToDelete: Range[] = [];

  for (let i = 0; i < editor.document.lineCount; i++) {
    const lineText = editor.document.lineAt(i).text.trim().toLowerCase();
    if (lineText.startsWith("system.debug(") && lineText.endsWith(");")) {
      linesToDelete.push(editor.document.lineAt(i).rangeIncludingLineBreak);
    }
  }

  await editor.edit((builder) => linesToDelete.reverse().forEach((range) => builder.delete(range)));
};

const extractFileExtension = (filePath: string) => {
  const fileExtension = SUPPORTED_EXTENSIONS.find((ext) => filePath.endsWith(ext));
  if (!fileExtension) {
    handleError("INVALID_ENTITY");
    return "";
  }
  return fileExtension;
};

export const extractEntityName = (filePath: string, ext: (typeof SUPPORTED_EXTENSIONS)[number]) => {
  const normalizedPath = filePath.replace(REGEXP.BACKSLASH, "/");
  const fileNameWithExtension = normalizedPath.split("/").pop() || "";
  return fileNameWithExtension.replace(ext, "");
};

interface BuildDebugStatementParams {
  spacing: string;
  text: string;
  delimiter: string;
  prefix: string;
  startBreak?: boolean;
  endBreak?: boolean;
  suffix?: string;
  lineNum?: number;
  entityName?: string;
  methodName?: string;
}

type InsertType = "afterException" | "beforeReturn" | "afterSemicolon" | "afterBrace" | "beforeBrace";
const shouldInsert: Record<InsertType, (...args: string[]) => boolean> = {
  afterSemicolon: (text) => text.includes(";"),
  beforeReturn: (text) => text.startsWith("return") || text.startsWith("throw"),
  afterBrace: (text) => text.endsWith("{") && TYPES.every((type) => !text.includes(type)),
  beforeBrace: (text) => text.endsWith("}"),
  afterException: (text, debugOutput) =>
    text.includes("Exception") && text.endsWith("{") && ERROR_VAR_NAMES.includes(debugOutput.trim().toLowerCase()),
};
