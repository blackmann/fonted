// The module 'vscode' contains the VS Code extensibility API
import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

const STYLE_ID_TAG = '<style id="fonted">';

export function activate(context: vscode.ExtensionContext) {
	const enable = vscode.commands.registerCommand("fonted.enable", () => {
		setFont(context);
	});

	context.subscriptions.push(enable);

	const disable = vscode.commands.registerCommand("fonted.disable", () => {
		unsetFont();
	});

	context.subscriptions.push(disable);
}

export function deactivate() {}

function getWorkbenchPath() {
	const workbenchRelativePath =
		"out/vs/code/electron-sandbox/workbench/workbench.html";
	const workbenchPath = path.join(vscode.env.appRoot, workbenchRelativePath);

	console.log("workbenchPath", workbenchPath);

	return workbenchPath;
}

function getWorkbenchHtml() {
	const workbenchPath = getWorkbenchPath();
	const html = fs.readFileSync(workbenchPath, "utf8");
	return html;
}

function getStyleMarkup() {
	const font = getFont();

	const fontStretch = font.fontStretch
		? `font-stretch: ${font.fontStretch};`
		: "";

	const style = `{font-family: "${font.fontFamily}" !important; ${fontStretch}}`;

	return `<style id="fonted">
  :is(.mac, .windows, .linux, :host-context(.OS), .monaco-inputbox input):not(.monaco-mouse-cursor-text) ${style}
  </style>`;
}

function setFont(context: vscode.ExtensionContext) {
	const font = getFont();

	if (!font.fontFamily) {
		unsetFont();
		return;
	}

	const html = getWorkbenchHtml();

	if (html.includes(STYLE_ID_TAG)) {
		return;
	}

	const newHtml = html.replace("</head>", `${getStyleMarkup()}</head>`);

	save(newHtml);
	promptRestart();
}

function unsetFont() {
	const html = getWorkbenchHtml();

	if (!html.includes(STYLE_ID_TAG)) {
		return;
	}

	const newHtml = html.replace(
		/<style id="fonted">(?:[^<]*\n)*([^<]*)<\/style>/gm,
		"",
	);

	save(newHtml);
	promptRestart();
}

function save(html: string) {
	const workbenchPath = getWorkbenchPath();
	fs.writeFileSync(workbenchPath, html);
}

function getConfig(name: string) {
	return vscode.workspace.getConfiguration().get(`fonted.${name}`);
}

function getFont() {
	return {
		fontFamily: getConfig("font") as string | undefined,
		fontStretch: getConfig("fontStretch") as string | undefined,
	};
}

// Copied from https://github.dev/iocave/monkey-patch/blob/b75dd36951132aae10b898a345cda489f0a5e3d6/src/extension.ts#L188
async function promptRestart() {
	// This is a hacky way to display the restart prompt
	const v = vscode.workspace.getConfiguration().inspect("window.titleBarStyle");
	if (v !== undefined) {
		const value = vscode.workspace
			.getConfiguration()
			.get("window.titleBarStyle");
		await vscode.workspace
			.getConfiguration()
			.update(
				"window.titleBarStyle",
				value === "native" ? "custom" : "native",
				vscode.ConfigurationTarget.Global,
			);
		vscode.workspace
			.getConfiguration()
			.update(
				"window.titleBarStyle",
				v.globalValue,
				vscode.ConfigurationTarget.Global,
			);
	}
}
