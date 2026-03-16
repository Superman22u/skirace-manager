import * as vscode from "vscode";
import { ActionsViewProvider } from "./views/actionsView";
import { AddPlayerPanel, AddRacePanel, AddResultPanel, AddTipPanel, ShowTipResultsPanel } from "./webviews/panels";

export function activate(context: vscode.ExtensionContext) {
  const actionsProvider = new ActionsViewProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("skiraceManager.actions", actionsProvider),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("skiraceManager.refreshActions", () => actionsProvider.refresh()),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("skiraceManager.addRace", () => AddRacePanel.show(context)),
    vscode.commands.registerCommand("skiraceManager.addPlayer", () => AddPlayerPanel.show(context)),
    vscode.commands.registerCommand("skiraceManager.addTip", () => AddTipPanel.show(context)),
    vscode.commands.registerCommand("skiraceManager.addResult", () => AddResultPanel.show(context)),
    vscode.commands.registerCommand("skiraceManager.showTipResults", () => ShowTipResultsPanel.show(context)),
  );
}

export function deactivate() {
  // nothing
}

