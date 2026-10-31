import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { marked } from 'marked';
import { prepareMath } from '../public/math.js';

function render(source, inline = false) {
  const { text, formulas } = prepareMath(source, katex.renderToString, 'TESTMATH');
  const html = (inline ? marked.parseInline(text) : marked.parse(text)).replace(/TESTMATH(\d+)END/g, (_, n) => formulas[n]);
  assert.doesNotMatch(html, /katex-error/);
  return { html, formulas };
}
test('kernel and dimension blanks render without repeated subscript errors', () => {
  const { formulas } = render(String.raw`$\operatorname{Ker}A=____$，$\dim\operatorname{Ker}A=____$。`);
  assert.equal(formulas.length, 2);
  assert.match(formulas[0], /underline/);
});
test('linear algebra shorthand, matrices and subscripts', () => {
  const commands = ['Ker', 'ker', 'Im', 'im', 'rank', 'Rank', 'tr', 'Tr', 'span', 'Span', 'diag', 'nullity', 'Hom', 'End', 'dim', 'det'];
  for (const command of commands) render(`$\\${command} A$`);
  render(String.raw`$$\dim\Ker A + \rank A = n,\quad A\in\RR^{m\times n},\quad \norm{Ax},\quad \inner{x}{y}$$`);
  render(String.raw`$$\begin{pmatrix}a_{11}&a_{12}\\a_{21}&a_{22}\end{pmatrix}$$`);
});
test('Markdown emphasis, title math and code examples stay separate', () => {
  const result = render(String.raw`**核：$\Ker A$** 与 $\Im A$`, true);
  assert.equal(result.formulas.length, 2);
  assert.match(result.html, /^<strong>/);
  assert.doesNotMatch(result.html, /<p>/);
  const code = render('`$\\Ker A$`\n\n```latex\n$\\Im A$\n```\n\n$\\rank A$');
  assert.equal(code.formulas.length, 1);
  assert.match(code.html, /<code>\$\\Ker A\$<\/code>/);
});
