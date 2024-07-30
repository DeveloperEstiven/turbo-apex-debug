import * as vscode from "vscode";
import { handleError } from "./utils/common.utils";
import { insertDebug, removeAll } from "./utils/extension.utils";

export const COMMANDS = {
  log: () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return handleError("NO_EDITOR");
    }

    const selection = editor.selections[0];
    const text = editor.document.getText(selection);
    if (!text) {
      return handleError("NOT_HIGHLIGHTED");
    }

    insertDebug(selection.active.line, text, editor);
  },

  removeAll: () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return handleError("NO_EDITOR");
    }

    removeAll(editor);
  },
};
