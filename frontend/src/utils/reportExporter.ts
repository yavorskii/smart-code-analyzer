import type { AnalysisResponse, CodeFile } from '../types/analysis';

export function generateMarkdownReport(response: AnalysisResponse, files: CodeFile[]): string {
  const timestamp = new Date().toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines: string[] = [];

  lines.push('# Smart Code Analyzer — Звіт аудиту програмного коду');
  lines.push('');
  lines.push(`> Дата формування звіту: ${timestamp}`);
  lines.push(`> Мова програмування: **${response.language}**`);
  lines.push(`> Загальний індекс якості: **${response.qualityScore} / 100**`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 1. Загальний огляд (Executive Summary)');
  lines.push('');
  lines.push(response.summary);
  lines.push('');
  lines.push(`- **Кількість проаналізованих файлів**: ${files.length}`);
  lines.push(`- **Кількість знайдених зауважень**: ${response.issues.length}`);
  lines.push(`- **Кількість архітектурних зв'язків**: ${response.architectureInsights.length}`);
  lines.push(`- **Кількість згенерованих тестів**: ${response.generatedTests.length}`);
  lines.push('');

  if (response.metrics) {
    lines.push('## 2. Метрики якості та підтримуваності (Software Metrics)');
    lines.push('');
    lines.push(`- **Індекс підтримуваності (Maintainability Index)**: ${response.metrics.overallMaintainabilityIndex} / 100 (Рейтинг: **${response.metrics.maintainabilityRating}**)`);
    lines.push(`- **Середня цикломатична складність**: ${response.metrics.averageCyclomaticComplexity}`);
    lines.push(`- **Максимальна цикломатична складність**: ${response.metrics.maxCyclomaticComplexity}`);
    lines.push(`- **Загальна кількість рядків (LOC)**: ${response.metrics.totalLines} (чистий код: ${response.metrics.totalSourceLines}, коментарі: ${response.metrics.totalCommentLines})`);
    lines.push('');

    lines.push('### Деталізація за файлами:');
    lines.push('');
    lines.push('| Файл | Рядків | Складність (CCN) | MI | Рівень ризику |');
    lines.push('| :--- | :---: | :---: | :---: | :--- |');
    for (const fm of response.metrics.files) {
      lines.push(`| \`${fm.fileName}\` | ${fm.sourceLines} | ${fm.cyclomaticComplexity} | ${fm.maintainabilityIndex} | ${fm.complexityRating} |`);
    }
    lines.push('');
  }

  lines.push("## 3. Архітектурний аналіз та міжмодульні зв'язки");
  lines.push('');
  if (response.architectureInsights.length === 0) {
    lines.push('Критичних архітектурних аномалій або циклічних залежностей не виявлено.');
  } else {
    for (const insight of response.architectureInsights) {
      lines.push(`### [${insight.relationshipType}] ${insight.sourceFile} → ${insight.targetFile}`);
      lines.push(`- **Опис**: ${insight.description}`);
      lines.push(`- **Рекомендація**: ${insight.suggestion}`);
      lines.push('');
    }
  }
  lines.push('');

  lines.push('## 4. Виявлені зауваження та дефекти коду');
  lines.push('');
  if (response.issues.length === 0) {
    lines.push('Зауважень не виявлено. Код відповідає встановленим стандартам якості.');
  } else {
    lines.push('| Рівень | Категорія | Файл та рядок | Опис та рекомендація |');
    lines.push('| :--- | :--- | :--- | :--- |');
    for (const issue of response.issues) {
      const lineStr = issue.line ? `:${issue.line}` : '';
      lines.push(`| **${issue.severity}** | \`${issue.category}\` | \`${issue.fileName}${lineStr}\` | **${issue.title}**: ${issue.description}. _Рекомендація: ${issue.recommendation}_ |`);
    }
  }
  lines.push('');

  if (response.refactoredFiles.length > 0) {
    lines.push('## 5. Запропоновані покращення та рефакторинг');
    lines.push('');
    for (const rf of response.refactoredFiles) {
      lines.push(`### Файл: \`${rf.fileName}\``);
      if (rf.changesSummary.length > 0) {
        lines.push('**Внесені оптимізації**:');
        for (const change of rf.changesSummary) {
          lines.push(`- ${change}`);
        }
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('*Звіт згенеровано автоматично програмною системою Smart Code Analyzer*');

  return lines.join('\n');
}

export function downloadMarkdownReport(content: string, fileName = 'smartcode-audit-report.md'): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printAuditReport(response: AnalysisResponse, files: CodeFile[]): void {
  const reportDate = new Date().toLocaleString('uk-UA');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте відкриття спливаючих вікон для друку звіту.');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>Звіт аудиту коду — Smart Code Analyzer</title>
  <style>
    @page { margin: 15mm; size: A4 portrait; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.5;
      padding: 20px;
      font-size: 13px;
    }
    .header {
      border-bottom: 2px solid #2b5797;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 22px; font-weight: 700; color: #2b5797; margin: 0; }
    .subtitle { font-size: 13px; color: #666; margin-top: 4px; }
    .meta-box {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: #f4f7fa;
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 20px;
    }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 11px; text-transform: uppercase; color: #73767a; font-weight: 600; }
    .meta-val { font-size: 16px; font-weight: 700; color: #202224; margin-top: 2px; }
    .score-badge {
      display: inline-block;
      padding: 4px 10px;
      background: ${response.qualityScore >= 80 ? '#e1f5fe' : response.qualityScore >= 50 ? '#fff3e0' : '#ffebee'};
      color: ${response.qualityScore >= 80 ? '#0277bd' : response.qualityScore >= 50 ? '#e65100' : '#c62828'};
      border-radius: 4px;
      font-weight: 800;
    }
    h2 {
      font-size: 16px;
      color: #2b5797;
      border-bottom: 1px solid #e4e7ed;
      padding-bottom: 4px;
      margin-top: 24px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    th {
      background: #f4f6f9;
      color: #333;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #dcdfe6;
      font-weight: 600;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #dcdfe6;
    }
    tr:nth-child(even) { background: #fafafa; }
    .severity {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .sev-critical { background: #fde2e2; color: #c41d1d; }
    .sev-warning { background: #faecd8; color: #b88230; }
    .sev-info { background: #e9e9eb; color: #606266; }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e4e7ed;
      font-size: 11px;
      color: #909399;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Smart Code Analyzer</h1>
      <div class="subtitle">Звіт експертної оцінки та аудиту архітектури програмного забезпечення</div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #666;">
      Дата: ${reportDate}
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <span class="meta-label">Мова розробки</span>
      <span class="meta-val">${response.language}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Індекс якості коду</span>
      <span class="meta-val"><span class="score-badge">${response.qualityScore} / 100</span></span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Індекс підтримуваності</span>
      <span class="meta-val">${response.metrics ? `${response.metrics.overallMaintainabilityIndex} / 100 (${response.metrics.maintainabilityRating})` : 'N/A'}</span>
    </div>
  </div>

  <h2>1. Резюме аудиту</h2>
  <p>${response.summary}</p>
  <p><strong>Кількість проаналізованих файлів:</strong> ${files.length} &nbsp;|&nbsp; 
     <strong>Знайдених зауважень:</strong> ${response.issues.length} &nbsp;|&nbsp;
     <strong>Архітектурних зв'язків:</strong> ${response.architectureInsights.length}</p>

  ${response.metrics ? `
  <h2>2. Метрики якості програмного коду</h2>
  <table>
    <thead>
      <tr>
        <th>Файл</th>
        <th>Рядків коду (SLOC)</th>
        <th>Цикломатична складність (CCN)</th>
        <th>Maintainability Index</th>
        <th>Рівень ризику</th>
      </tr>
    </thead>
    <tbody>
      ${response.metrics.files.map((fm) => `
        <tr>
          <td><code>${fm.fileName}</code></td>
          <td>${fm.sourceLines}</td>
          <td>${fm.cyclomaticComplexity}</td>
          <td>${fm.maintainabilityIndex} / 100 (${fm.maintainabilityRating})</td>
          <td>${fm.complexityRating}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <h2>3. Виявлені зауваження та дефекти коду</h2>
  ${response.issues.length === 0 ? '<p>Зауважень не виявлено. Код відповідає стандартам.</p>' : `
  <table>
    <thead>
      <tr>
        <th style="width: 80px;">Рівень</th>
        <th>Категорія</th>
        <th>Файл:Рядок</th>
        <th>Опис та рекомендація</th>
      </tr>
    </thead>
    <tbody>
      ${response.issues.map((i) => `
        <tr>
          <td><span class="severity ${i.severity === 'CRITICAL' ? 'sev-critical' : i.severity === 'WARNING' ? 'sev-warning' : 'sev-info'}">${i.severity}</span></td>
          <td><code>${i.category}</code></td>
          <td><code>${i.fileName}${i.line ? `:${i.line}` : ''}</code></td>
          <td><strong>${i.title}</strong>: ${i.description}<br><span style="color: #666; font-size: 11px;">Рекомендація: ${i.recommendation}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  `}

  ${response.architectureInsights.length > 0 ? `
  <h2>4. Архітектурні зв'язки та залежності</h2>
  <table>
    <thead>
      <tr>
        <th>Тип зв'язку</th>
        <th>Компоненти</th>
        <th>Опис та порада</th>
      </tr>
    </thead>
    <tbody>
      ${response.architectureInsights.map((a) => `
        <tr>
          <td><strong>${a.relationshipType}</strong></td>
          <td><code>${a.sourceFile} → ${a.targetFile}</code></td>
          <td>${a.description}<br><span style="color: #666; font-size: 11px;">Порада: ${a.suggestion}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    Smart Code Analyzer • Architectural Audit & Quality Inspection Engine<br>
    Згенеровано автоматично програмною системою Smart Code Analyzer
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
