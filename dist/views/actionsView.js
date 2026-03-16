"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const ACTIONS = [
    { label: "Add ski race", description: "Create a new race", command: "skiraceManager.addRace" },
    { label: "Add player", description: "Create a new player", command: "skiraceManager.addPlayer" },
    { label: "Add tipp", description: "Tip top-5 for a race", command: "skiraceManager.addTip" },
    { label: "Add result", description: "Enter top-5 result", command: "skiraceManager.addResult" },
    { label: "Show Tipp results", description: "Points per race", command: "skiraceManager.showTipResults" }
];
class ActionItem extends vscode.TreeItem {
    constructor(action) {
        super(action.label, vscode.TreeItemCollapsibleState.None);
        this.description = action.description;
        this.contextValue = "skiraceManager.action";
        this.command = { title: action.label, command: action.command };
    }
}
class ActionsViewProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        return ACTIONS.map((a) => new ActionItem(a));
    }
}
exports.ActionsViewProvider = ActionsViewProvider;
//# sourceMappingURL=actionsView.js.map