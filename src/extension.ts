// The module 'vscode' contains the VS Code extensibility API
import * as fs from 'fs'
import * as jsdom from 'jsdom'
import * as path from 'path'
import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  let enable = vscode.commands.registerCommand('fonted.enable', () => {
  	setFont(context)
  });

  context.subscriptions.push(enable);

  let disable = vscode.commands.registerCommand('fonted.disable', () => {
  	deactivate()
  });

  context.subscriptions.push(disable);
}

export function deactivate() {

}

function getWorkbenchPath() {
  const basePath = path.dirname(require.main!.filename)
  const workbenchRelativePath =
    '/vs/code/electron-sandbox/workbench/workbench.html'
  const workbenchPath = [basePath, workbenchRelativePath].join('')

  return workbenchPath
}

function getWorkbenchHtml() {
  const workbenchPath = getWorkbenchPath()
  const html = fs.readFileSync(workbenchPath, 'utf8')
  return html
}

function setFont(context: vscode.ExtensionContext) {
  const font = getFont()
  if (!font) {
    unsetFont()
    return
  }

  const html = getWorkbenchHtml()
  const styleDefinition = getStyleDefinition()

  if (html.includes(styleDefinition)) {
    return
  }

  const dom = new jsdom.JSDOM(html)
	const window = dom.window
	const document = window.document

  const style = document.createElement('style')
  style.id = 'fonted'
  style.appendChild(document.createTextNode(styleDefinition))

  document.getElementsByTagName('head')[0].appendChild(style)

  save(window)
  promptRestart()
}

function unsetFont() {
  const dom = new jsdom.JSDOM(getWorkbenchHtml())
  const window = dom.window

  const style = window.document.querySelector('style#fonted')
  if (!style) {
    return
  }

  style.remove()

  save(window)
  promptRestart()
}

function save(window: jsdom.DOMWindow) {
  const xmlSerializer = new window.XMLSerializer()

  const workbenchPath = getWorkbenchPath()
  const document = window.document
  fs.writeFileSync(workbenchPath, xmlSerializer.serializeToString(document))
}

function getStyleDefinition() {
  const font = getFont()
  return `.mac, .windows, .linux {font-family: "${font}" !important;}`
}

function getFont() {
  return vscode.workspace.getConfiguration().get('fonted.font')
}

// Copied from https://github.dev/iocave/monkey-patch/blob/b75dd36951132aae10b898a345cda489f0a5e3d6/src/extension.ts#L188
async function promptRestart() {
  // This is a hacky way to display the restart prompt
  let v = vscode.workspace.getConfiguration().inspect('window.titleBarStyle')
  if (v !== undefined) {
    let value = vscode.workspace.getConfiguration().get('window.titleBarStyle')
    await vscode.workspace
      .getConfiguration()
      .update(
        'window.titleBarStyle',
        value === 'native' ? 'custom' : 'native',
        vscode.ConfigurationTarget.Global
      )
    vscode.workspace
      .getConfiguration()
      .update(
        'window.titleBarStyle',
        v.globalValue,
        vscode.ConfigurationTarget.Global
      )
  }
}
