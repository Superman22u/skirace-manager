import * as vscode from "vscode";

type Action = {
  label: string;
  description?: string;
  command: string;
};

const ACTIONS: Action[] = [
  { label: "Add ski race", description: "Create a new race", command: "skiraceManager.addRace" },
  { label: "Add player", description: "Create a new player", command: "skiraceManager.addPlayer" },
  { label: "Add tipp", description: "Tip top-5 for a race", command: "skiraceManager.addTip" },
  { label: "Add result", description: "Enter top-5 result", command: "skiraceManager.addResult" },
  { label: "Show Tipp results", description: "Points per race", command: "skiraceManager.showTipResults" }
];

class ActionItem extends vscode.TreeItem {
  constructor(action: Action) {
    super(action.label, vscode.TreeItemCollapsibleState.None);
    this.description = action.description;
    this.contextValue = "skiraceManager.action";
    this.command = { title: action.label, command: action.command };
  }
}

export class ActionsViewProvider implements vscode.TreeDataProvider<ActionItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<ActionItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ActionItem): vscode.TreeItem {
    return element;
  }

  getChildren(): ActionItem[] {
    return ACTIONS.map((a) => new ActionItem(a));
  }
}

