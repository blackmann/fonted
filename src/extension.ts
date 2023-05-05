// The module 'vscode' contains the VS Code extensibility API
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

type Pattern = {
  pattern: RegExp,
  file: string
}

const WORKBENCH_DESKTOP_MAIN_JS = 'workbench.desktop.main.js'
const WORKBENCH_DESKTOP_MAIN_CSS = 'workbench.desktop.main.css'

const FONTED_STUB_PATTERN = /(\/\* fonted:start \*\/\')([a-zA-Z0-9- ]+)(\',\/\* fonted:end \*\/)/g

function addStabsToFont(font: string) {
  return `/* fonted:start */'${font}',/* fonted:end */`
}

const JS_PATTERN: Pattern = {
  pattern: /(:host-context\(\.(windows|linux|mac)\)[ ]{0,}\{[ ]{0,}font-family:)/g,
  file: WORKBENCH_DESKTOP_MAIN_JS
}

const CSS_PATTERN: Pattern = {
  pattern: /(.(windows|linux|mac)[ ]{0,}\{[ ]{0,}font-family:)/g,
  file: WORKBENCH_DESKTOP_MAIN_CSS
}

const PATTERNS = [JS_PATTERN, CSS_PATTERN]

export function activate(context: vscode.ExtensionContext) {
  let enable = vscode.commands.registerCommand('fonted.enable', () => {
    setFont()
    promptRestart()
  })

  context.subscriptions.push(enable)

  let disable = vscode.commands.registerCommand('fonted.disable', () => {
    unsetFont()
    promptRestart()
  })

  context.subscriptions.push(disable)
}

export function deactivate() {
  unsetFont()
  promptRestart()
}

function getWorkbenchPath() {
  const basePath = path.dirname(require.main!.filename)
  const workbenchRelativePath = '/vs/workbench'
  const workbenchPath = path.join(basePath, workbenchRelativePath)
  return workbenchPath
}

function setFont() {
  const font = getFont()

  if (!font) {
    unsetFont()
    return
  }

  
  for (const { pattern, file } of PATTERNS) {
    const workbenchPath = getWorkbenchPath()
    const workbenchContentPath = path.join(
      workbenchPath,
      file
    )
    let content = fs.readFileSync(workbenchContentPath, 'utf8')

    if (FONTED_STUB_PATTERN.test(content)) {
      content = content.replaceAll(FONTED_STUB_PATTERN, `$1${font}$3`)
    } else {
      content = content.replaceAll(pattern, `$1${addStabsToFont(font)}`)
    }

    fs.writeFileSync(
      workbenchContentPath,
      content
    )
  }
}

function unsetFont() {
  for (const { file } of PATTERNS) {
    const workbenchPath = getWorkbenchPath()
    const workbenchContentPath = path.join(
      workbenchPath,
      file
    )
    let content = fs.readFileSync(workbenchContentPath, 'utf8')

    content = content.replaceAll(FONTED_STUB_PATTERN, '')

    fs.writeFileSync(
      workbenchContentPath,
      content
    )
  }
}

function getFont() {
  return vscode.workspace.getConfiguration().get<string>('fonted.font')
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
