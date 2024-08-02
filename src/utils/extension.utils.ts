import { TextDocument, Position, TextEditor, Range, commands, DocumentSymbol, SymbolKind } from "vscode";
import { SPACING_KEYWORDS, REGEXP, TYPES, ERROR_VAR_NAMES, APEX_EXT } from "../constants";
import { findSymbols, getConfiguration, handleError } from "./common.utils";

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
  className,
  lineNum,
  methodName,
}: BuildDebugStatementParams) => {
  const startLineBreak = startBreak ? "\n" : "";
  const endLineBreak = endBreak ? "\n" : "";
  const formattedPrefix = prefix ? `${prefix} ` : "";
  const formattedLineNum = lineNum ? `[${lineNum}] ` : "";
  const formattedClassName = className ? `[${className}] ` : "";
  const formattedMethodName = methodName ? `[${methodName}] ` : "";
  return `${startLineBreak}${spacing}System.debug('${formattedPrefix}${formattedLineNum}${formattedClassName}${formattedMethodName}${text}${delimiter} ' + ${text}${suffix});${endLineBreak}`;
};

const getMethodName = async (lineNumber: number, document: TextDocument): Promise<string> => {
  const symbols = await commands.executeCommand<DocumentSymbol[]>("vscode.executeDocumentSymbolProvider", document.uri);

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

  const { delimiter, includeLineNum, includeClassName, includeMethodName, getPrefix } = getConfiguration();
  const spacing = determineSpacing(document, selectionLineNum);

  const prefix = await getPrefix(ERROR_VAR_NAMES.includes(text.trim().toLowerCase()) ? "ERROR" : "REGULAR");

  const debugParams: BuildDebugStatementParams = { spacing, text, delimiter, prefix };

  debugParams.className = includeClassName ? extractClassName(document.fileName) : "";
  debugParams.methodName = includeMethodName ? await getMethodName(selectionLineNum, document) : "";

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

//TODO: support triggers
export const extractClassName = (filePath: string): string => {
  if (!filePath.endsWith(APEX_EXT)) {
    handleError("NO_APEX");
    return "";
  }
  const normalizedPath = filePath.replace(REGEXP.BACKSLASH, "/");
  const fileNameWithExtension = normalizedPath.split("/").pop() || "";
  return fileNameWithExtension.replace(APEX_EXT, "");
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
  className?: string;
  methodName?: string;
}

const shouldInsert = {
  afterSemicolon: (text: string) => text.includes(";"),
  beforeReturn: (text: string) => text.startsWith("return") || text.startsWith("throw"),
  afterBrace: (text: string) => text.endsWith("{") && TYPES.every((type) => !text.includes(type)),
  beforeBrace: (text: string) => text.endsWith("}"),
  afterException: (text: string, debugOutput: string) =>
    text.includes("Exception") && text.endsWith("{") && ERROR_VAR_NAMES.includes(debugOutput.trim().toLowerCase()),
};
