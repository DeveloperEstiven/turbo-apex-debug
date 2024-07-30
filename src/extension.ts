import * as vscode from "vscode";
import { COMMANDS } from "./commands";

const { registerCommand } = vscode.commands;

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Turbo System Debug is Activated");

  const logDisposable = registerCommand("turbo-system-debug.log", COMMANDS.log);
  context.subscriptions.push(logDisposable);

  const removeAllDisposable = registerCommand("turbo-system-debug.removeAll", COMMANDS.removeAll);
  context.subscriptions.push(removeAllDisposable);
}

export function deactivate() {}
