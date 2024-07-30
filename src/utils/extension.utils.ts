import { TextDocument, Position, TextEditor, Range } from "vscode";
import { SPACING_KEYWORDS, REGEXP, TYPES, ERROR_VAR_NAMES, ACCESS_MODIFIERS } from "../constants";
import { getConfiguration, handleError } from "./common.utils";

const determineSpacing = (document: TextDocument, lineNum: number): string => {
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

const getMethodName = (fullText: string, lineNumber: number, document: TextDocument): string => {
  const trimmedText = fullText.trim();
  const startLine = trimmedText.startsWith("@") || trimmedText.includes("(") ? lineNumber + 1 : lineNumber;

  const findMethodName = (lineNum: number): string => {
    while (lineNum >= 0) {
      const lineText = document.lineAt(lineNum).text.trim();
      if (ACCESS_MODIFIERS.some((keyword) => lineText.startsWith(keyword)) && isMethodLine(lineText)) {
        return lineText.match(REGEXP.METHOD_NAME)?.[1] || "";
      }
      lineNum--;
    }
    return "";
  };

  return findMethodName(startLine) || findMethodName(0);
};

export const insertDebug = async (selectionLineNum: number, text: string, editor: TextEditor) => {
  const { document } = editor;
  const { delimiter, includeLineNum, includeClassName, includeMethodName, getPrefix } = getConfiguration();
  const spacing = determineSpacing(document, selectionLineNum);
  const prefix = await getPrefix(ERROR_VAR_NAMES.includes(text.trim().toLowerCase()) ? "ERROR" : "REGULAR");

  const debugParams: BuildDebugStatementParams = { spacing, text, delimiter, prefix };

  debugParams.className = includeClassName ? extractClassName(document.fileName) : undefined;
  debugParams.methodName = includeMethodName
    ? getMethodName(document.lineAt(editor.selections[0].end.line).text, selectionLineNum, document)
    : undefined;

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

export const extractClassName = (filePath: string): string => {
  if (!filePath.endsWith(".cls")) {
    handleError("NO_APEX");
    return "";
  }
  const normalizedPath = filePath.replace(/\\/g, "/");
  const fileNameWithExtension = normalizedPath.split("/").pop() || "";
  return fileNameWithExtension.replace(".cls", "");
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

const isMethodLine = (text: string): boolean => text.includes("(") && text.includes(")");
