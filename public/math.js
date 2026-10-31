export const mathOptions = {
  throwOnError: false, trust: false, strict: 'ignore',
  macros: {
    '\\Ker': '\\operatorname{Ker}', '\\ker': '\\operatorname{ker}',
    '\\Im': '\\operatorname{Im}', '\\im': '\\operatorname{im}',
    '\\rank': '\\operatorname{rank}', '\\Rank': '\\operatorname{Rank}',
    '\\tr': '\\operatorname{tr}', '\\Tr': '\\operatorname{Tr}',
    '\\span': '\\operatorname{span}', '\\Span': '\\operatorname{Span}',
    '\\diag': '\\operatorname{diag}', '\\nullity': '\\operatorname{nullity}',
    '\\Hom': '\\operatorname{Hom}', '\\End': '\\operatorname{End}',
    '\\RR': '\\mathbb{R}', '\\CC': '\\mathbb{C}',
    '\\norm': '\\left\\lVert #1\\right\\rVert',
    '\\inner': '\\left\\langle #1,#2\\right\\rangle'
  }
};

// 先保护公式，再解析 Markdown；代码示例中的公式保持原样。
export function prepareMath(value, render, token) {
  const formulas = [];
  const text = String(value ?? '').replace(/```[^\n]*\n[\s\S]*?```|~~~[^\n]*\n[\s\S]*?~~~|(`+)[^\n]*?\1|\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|(?<!\\)\$([^$\n]+?)(?<!\\)\$|\\\(([\s\S]+?)\\\)/g, (match, code, a, b, c, d) => {
    if (code || match.startsWith('```') || match.startsWith('~~~')) return match;
    const formula = (a ?? b ?? c ?? d).replace(/_{3,}/g, '\\underline{\\qquad}');
    const index = formulas.length;
    formulas.push(render(formula, { ...mathOptions, macros: { ...mathOptions.macros }, displayMode: a !== undefined || b !== undefined }));
    return `${token}${index}END`;
  });
  return { text, formulas };
}
