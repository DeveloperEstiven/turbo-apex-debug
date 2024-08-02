import { commands, ExtensionContext, window } from "vscode";
import { handleError } from "./utils/common.utils";
import { insertDebug, removeAll } from "./utils/extension.utils";

const { registerCommand } = commands;

export function activate(context: ExtensionContext) {
  window.showInformationMessage("Turbo System Debug is Activated");

  const logDisposable = registerCommand("turbo-system-debug.log", () => {
    const editor = window.activeTextEditor;
    if (!editor) {
      return handleError("NO_EDITOR");
    }

    const selection = editor.selections[0];
    const text = editor.document.getText(selection);
    if (!text) {
      return handleError("NOT_HIGHLIGHTED");
    }

    insertDebug(selection.active.line, text, editor);
  });
  context.subscriptions.push(logDisposable);

  const removeAllDisposable = registerCommand("turbo-system-debug.removeAll", () => {
    const editor = window.activeTextEditor;
    if (!editor) {
      return handleError("NO_EDITOR");
    }

    removeAll(editor);
  });
  context.subscriptions.push(removeAllDisposable);
}

export function deactivate() {}
