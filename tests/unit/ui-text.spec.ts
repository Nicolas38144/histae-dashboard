import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import ts from 'typescript';

async function sourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  }))).flat().filter((path) => /\.tsx?$/.test(path));
}

// Only technical values may remain outside the message dictionaries.
const technical = new Set([
  'Escape', 'Content-Type', 'Accept-Language', 'LocalizedError', 'AbortError', 'NotAllowedError',
  'SecurityError', 'InvalidStateError', 'UnknownError', 'InvalidCharacterError', 'UTC', 'fr-FR', 'en-GB', 'es-ES', 'it-IT',
  'noopener noreferrer', 'opacity 150ms ease', 'minmax(280px, 1fr) 180px 180px auto',
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'radial-gradient(circle at 15% 20%, rgba(92, 91, 231, .18), transparent 32%), radial-gradient(circle at 85% 80%, rgba(14, 165, 164, .16), transparent 30%)',
]);
const visibleAttributes = new Set([
  'label', 'title', 'description', 'placeholder', 'helperText', 'aria-label', 'alt',
  'primary', 'secondary', 'confirmLabel', 'valueLabel', 'loadLabel',
]);

it('keeps visible UI copy in the translation dictionaries', async () => {
  const violations: string[] = [];
  for (const file of await sourceFiles('src')) {
    const ast = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const report = (node: ts.Node) => violations.push(`${file}:${ast.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${node.getText(ast)}`);
    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node) && node.text.trim()) report(node);
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const parent = node.parent;
        const attribute = ts.isJsxExpression(parent) ? parent.parent : parent;
        if (ts.isJsxAttribute(attribute) && visibleAttributes.has(attribute.name.getText(ast)) && node.text.trim()) report(node);
        else if (ts.isJsxExpression(parent) && !ts.isJsxAttribute(parent.parent) && node.text.trim()) report(node);
        else if (!technical.has(node.text) && !ts.isImportDeclaration(parent) && !ts.isExportDeclaration(parent)
          && !ts.isLiteralTypeNode(parent) && !ts.isPropertySignature(parent)
          && !(ts.isPropertyAssignment(parent) && parent.name === node)
          && (/^[A-Z][a-z]/.test(node.text) || /[À-ÿ]|[a-z]\s+[a-z]/u.test(node.text))) report(node);
      }
      if (ts.isTemplateExpression(node)) {
        const copy = node.head.text + node.templateSpans.map((span) => span.literal.text).join('');
        // Paths, CSS calculations and ISO date construction are technical templates.
        if (/[A-Za-zÀ-ÿ]/u.test(copy) && !/^\/|^premium_|^calc\(|px$|^T00:00:00Z$/.test(copy)) report(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  expect(violations).toEqual([]);
});
