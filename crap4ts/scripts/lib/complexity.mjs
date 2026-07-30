import { createRequire } from "node:module";
import path from "node:path";

import defaultTypeScript from "typescript";

import { isSingleFileComponent, scriptOf } from "./sfc.mjs";

let ts = defaultTypeScript;

export function loadTypeScript(projectRoot) {
  try {
    const require = createRequire(path.join(projectRoot, "package.json"));
    ts = require("typescript");
  } catch {
    ts = defaultTypeScript;
  }
  return ts;
}

const functionKinds = () =>
  new Set([
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.MethodDeclaration,
    ts.SyntaxKind.ArrowFunction,
    ts.SyntaxKind.FunctionExpression,
    ts.SyntaxKind.Constructor,
    ts.SyntaxKind.GetAccessor,
    ts.SyntaxKind.SetAccessor,
  ]);

const isFunction = (node) => functionKinds().has(node.kind);

function decisionPoints(node) {
  switch (node.kind) {
    case ts.SyntaxKind.IfStatement:
    case ts.SyntaxKind.ForStatement:
    case ts.SyntaxKind.ForInStatement:
    case ts.SyntaxKind.ForOfStatement:
    case ts.SyntaxKind.WhileStatement:
    case ts.SyntaxKind.DoStatement:
    case ts.SyntaxKind.CaseClause:
    case ts.SyntaxKind.CatchClause:
    case ts.SyntaxKind.ConditionalExpression:
      return 1;
    case ts.SyntaxKind.BinaryExpression: {
      const operator = node.operatorToken.kind;
      const logical =
        operator === ts.SyntaxKind.AmpersandAmpersandToken ||
        operator === ts.SyntaxKind.BarBarToken ||
        operator === ts.SyntaxKind.QuestionQuestionToken;
      return logical ? 1 : 0;
    }
    default:
      return 0;
  }
}

function complexityOf(node) {
  const body = node.body ?? node;
  let total = 1 + decisionPoints(body);
  const walk = (current) => {
    ts.forEachChild(current, (child) => {
      if (isFunction(child)) return;
      total += decisionPoints(child);
      walk(child);
    });
  };
  walk(body);
  return total;
}

function className(node, sourceFile) {
  let current = node.parent;
  while (current) {
    if (ts.isClassDeclaration(current) || ts.isClassExpression(current)) {
      return current.name ? current.name.getText(sourceFile) : "<anonymous class>";
    }
    current = current.parent;
  }
  return null;
}

function functionName(node, sourceFile, startLine) {
  if (node.kind === ts.SyntaxKind.Constructor) {
    return "constructor";
  }
  if (node.name) {
    return node.name.getText(sourceFile);
  }
  const parent = node.parent;
  if (parent && (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent))) {
    return parent.name.getText(sourceFile);
  }
  return `<anonymous>:${startLine}`;
}

function qualifiedName(node, sourceFile, startLine) {
  const base = functionName(node, sourceFile, startLine);
  const owner = className(node, sourceFile);
  const isMember =
    node.kind === ts.SyntaxKind.MethodDeclaration ||
    node.kind === ts.SyntaxKind.Constructor ||
    node.kind === ts.SyntaxKind.GetAccessor ||
    node.kind === ts.SyntaxKind.SetAccessor;
  return owner && isMember ? `${owner}.${base}` : base;
}

const scriptKindOf = (lang) =>
  ({
    ts: ts.ScriptKind.TS,
    tsx: ts.ScriptKind.TSX,
    js: ts.ScriptKind.JS,
    jsx: ts.ScriptKind.JSX,
  })[lang] ?? ts.ScriptKind.TS;

export function extractFunctions(fileName, sourceText) {
  const component = isSingleFileComponent(fileName) ? scriptOf(sourceText) : null;
  const sourceFile = ts.createSourceFile(
    fileName,
    component === null ? sourceText : component.text,
    ts.ScriptTarget.Latest,
    true,
    component === null ? undefined : scriptKindOf(component.lang),
  );
  const lineOf = (position) =>
    sourceFile.getLineAndCharacterOfPosition(position).line + 1;
  const functions = [];
  const visit = (node) => {
    if (isFunction(node)) {
      const startLine = lineOf(node.getStart(sourceFile));
      functions.push({
        name: qualifiedName(node, sourceFile, startLine),
        file: fileName,
        startLine,
        endLine: lineOf(node.getEnd()),
        complexity: complexityOf(node),
      });
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return functions;
}
