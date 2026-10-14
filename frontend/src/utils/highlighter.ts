function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
  'new', 'null', 'package', 'private', 'protected', 'public', 'record', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try',
  'void', 'volatile', 'while', 'true', 'false'
]);

export function highlightJava(code: string): string {
  if (!code) return '';

  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\[\s\S]|[^"\\])*")|(@[A-Za-z0-9_]+)|(\b\d+(?:\.\d+)?[fFdDlL]?\b)|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;

  let lastIndex = 0;
  let html = '';
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(code)) !== null) {
    html += escapeHtml(code.slice(lastIndex, match.index));
    lastIndex = tokenRegex.lastIndex;

    const [, comment, str, annotation, num, word] = match;
    if (comment) {
      html += `<span class="jb-hl-comment">${escapeHtml(comment)}</span>`;
    } else if (str) {
      html += `<span class="jb-hl-string">${escapeHtml(str)}</span>`;
    } else if (annotation) {
      html += `<span class="jb-hl-annotation">${escapeHtml(annotation)}</span>`;
    } else if (num) {
      html += `<span class="jb-hl-number">${num}</span>`;
    } else if (word) {
      if (KEYWORDS.has(word)) {
        html += `<span class="jb-hl-keyword">${word}</span>`;
      } else if (/^[A-Z][A-Za-z0-9_]*$/.test(word)) {
        html += `<span class="jb-hl-type">${word}</span>`;
      } else {
        html += word;
      }
    }
  }

  html += escapeHtml(code.slice(lastIndex));
  return html;
}
