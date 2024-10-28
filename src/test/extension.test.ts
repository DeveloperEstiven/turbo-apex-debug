import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { insertDebug, removeAll } from "../utils/extension.utils";
import * as path from "path";
import * as fs from "fs";

suite("Turbo Apex Debug Extension Test Suite", function () {
  this.timeout(10000);
  vscode.window.showInformationMessage("Start all tests.");

  let testEditor: vscode.TextEditor;
  let quickPickStub: sinon.SinonStub;
  const testFilePath = path.join(__dirname, "TestClass.cls");

  suiteSetup(async () => {
    const content = `public class TestClass {
    public Integer methodName() {
        Integer x = 10;
        String message = 'Hello, World!';
        try {
            throw new AuraHandledException('Test Exception');
        } catch (Exception ex) {
            System.debug(ex.getMessage());
        }
        return x;
    }
}`;
    fs.writeFileSync(testFilePath, content);

    const uri = vscode.Uri.file(testFilePath);
    const document = await vscode.workspace.openTextDocument(uri);
    testEditor = await vscode.window.showTextDocument(document);

    quickPickStub = sinon.stub(vscode.window, "showQuickPick").resolves({ label: "✅" });
  });

  suiteTeardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    quickPickStub.restore();
  });

  test("Should insert System.debug() statement after a semicolon", async () => {
    await insertDebug(2, "x", testEditor);

    const expectedDebugStatement = `System.debug('✅ [4] [TestClass] [methodName] x: ' + x);`;
    assert.strictEqual(testEditor.document.lineAt(3).text.trim(), expectedDebugStatement);
  });

  test("Should insert System.debug() statement before a return statement", async () => {
    await insertDebug(10, "x", testEditor);
    const expectedDebugStatement = `System.debug('✅ [${10 + 1}] [TestClass] [methodName] x: ' + x);`;
    assert.strictEqual(testEditor.document.lineAt(10).text.trim(), expectedDebugStatement);
  });

  test("Should insert System.debug() statement after an exception declaration", async () => {
    await insertDebug(6 + 1, "ex", testEditor);

    const expectedDebugStatement = `System.debug('✅ [${7 + 2}] [TestClass] [methodName] ex: ' + ex.getMessage());`;
    assert.strictEqual(testEditor.document.lineAt(7 + 1).text.trim(), expectedDebugStatement);
  });

  test("Should remove all System.debug() statements", async () => {
    await removeAll(testEditor);

    const remainingText = testEditor.document.getText().includes("System.debug");
    assert.strictEqual(remainingText, false);
  });

  test("Should handle no active editor error", async () => {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");

    const spy = sinon.spy(vscode.window, "showErrorMessage");

    await vscode.commands.executeCommand("turbo-apex-debug.log");

    assert.strictEqual(spy.calledWith("⚠️ Turbo Apex Debug: Editor is not active"), true);

    spy.restore();
  });

  test("Should handle not highlighted text error", async () => {
    const spy = sinon.spy(vscode.window, "showErrorMessage");

    const document = await vscode.workspace.openTextDocument({
      language: "apex",
      content: `public class TestClass {
    public void methodName() {
        Integer x = 10;
        String message = 'Hello, World!';
    }
}`,
    });
    testEditor = await vscode.window.showTextDocument(document);

    await vscode.commands.executeCommand("turbo-apex-debug.log");

    assert.strictEqual(spy.calledWith("⚠️ Turbo Apex Debug: No text highlighted"), true);

    spy.restore();
  });

  test("Should insert System.debug() statement with correct methodName", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "apex",
      content: `public class TestClass {
    public void methodName() {
        Integer x = 10;
        String message = 'Hello, World!';
    }
  
    public void secondMethodName() {
        methodName();
        String message = 'Hello!';
    }
}`,
    });

    testEditor = await vscode.window.showTextDocument(document);
    await insertDebug(8, "message", testEditor);
    const expectedDebugStatement = `System.debug('✅ [${9 + 1}] [Untitled-2] [secondMethodName] message: ' + message);`;
    assert.strictEqual(testEditor.document.lineAt(9).text.trim(), expectedDebugStatement);
  });

  test("Should insert System.debug() for methodName only", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "apex",
      content: `public class TestClass {
    public void methodName() {
        Integer x = 10;
        String message = 'Hello, World!';
    }
}`,
    });

    testEditor = await vscode.window.showTextDocument(document);
    await insertDebug(1, "methodName", testEditor);
    const expectedDebugStatement = `System.debug('✅ --------------------- [${2 + 1}] [Untitled-3] [methodName]');`;
    assert.strictEqual(testEditor.document.lineAt(2).text.trim(), expectedDebugStatement);
  });
});
