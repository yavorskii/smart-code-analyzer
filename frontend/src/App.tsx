import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  GitBranch,
  AlertTriangle,
  FileCode2,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  ShieldAlert,
  Layers,
  FlaskConical,
  History,
  X,
  Clock,
} from 'lucide-react';
import { SAMPLE_JAVA_PROJECT } from './data/sampleProjects';
import {
  analyzeCode,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
} from './services/api';
import type {
  AnalysisFocus,
  AnalysisHistoryItem,
  AnalysisResponse,
  CodeFile,
  ProgrammingLanguage,
} from './types/analysis';
import './App.css';

export default function App() {
  const [files, setFiles] = useState<CodeFile[]>(SAMPLE_JAVA_PROJECT);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [language, setLanguage] = useState<ProgrammingLanguage>('JAVA');
  const [focus, setFocus] = useState<AnalysisFocus>('ARCHITECTURE');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'issues' | 'refactor' | 'tests'>('insights');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<AnalysisHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const currentFile = files[activeFileIndex] || files[0];

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const items = await getAnalysisHistory();
      setHistoryList(items);
    } catch {
      // Backend may be starting or offline
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleContentChange = (content: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === activeFileIndex ? { ...f, content } : f))
    );
  };

  const handleAddFile = () => {
    const ext = language === 'JAVA' ? '.java' : language === 'PYTHON' ? '.py' : '.ts';
    const newName = `Component${files.length + 1}${ext}`;
    const newFile: CodeFile = {
      fileName: newName,
      content: language === 'JAVA' ? `package ua.pnu.shop;\n\npublic class Component${files.length + 1} {\n    // Implementation\n}\n` : '',
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileIndex(files.length);
  };

  const handleDeleteFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);
    setActiveFileIndex(Math.max(0, index - 1));
  };

  const handleLoadSample = () => {
    setFiles(SAMPLE_JAVA_PROJECT);
    setActiveFileIndex(0);
    setLanguage('JAVA');
    setResponse(null);
    setError(null);
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeCode({
        language,
        focus,
        files,
      });
      setResponse(res);
      setActiveTab('insights');
      fetchHistory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = async (id: string) => {
    try {
      setLoading(true);
      const pastReport = await getAnalysisById(id);
      setResponse(pastReport);
      setHistoryOpen(false);
      setActiveTab('insights');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load past audit');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAnalysis(id);
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
      if (response?.id === id) {
        setResponse(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-good';
    if (score >= 50) return 'score-warning';
    return 'score-critical';
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">
            <Code2 size={24} />
          </div>
          <div>
            <h1 className="brand-title">Smart Code Analyzer</h1>
            <p className="brand-subtitle">
              Система статичного мультифайлового аналізу та архітектурного аудиту
            </p>
          </div>
          <span className="academic-badge">
            ПНУ ім. В. Стефаника • 121 ІПЗ
          </span>
        </div>

        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setHistoryOpen(true)}
            title="Переглянути історію перевірок у БД"
          >
            <History size={16} />
            Історія аудитів
            {historyList.length > 0 && (
              <span className="badge-count" style={{ marginLeft: '4px' }}>
                {historyList.length}
              </span>
            )}
          </button>

          <button className="btn-secondary" onClick={handleLoadSample}>
            <RotateCcw size={16} />
            Демо-проєкт
          </button>
        </div>
      </header>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="controls-group">
          <div className="control-item">
            <label htmlFor="language-select">Мова:</label>
            <select
              id="language-select"
              className="custom-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
            >
              <option value="JAVA">Java (Spring Boot / Java 21)</option>
              <option value="PYTHON">Python</option>
              <option value="TYPESCRIPT">TypeScript</option>
              <option value="JAVASCRIPT">JavaScript</option>
            </select>
          </div>

          <div className="control-item">
            <label htmlFor="focus-select">Фокус аудиту:</label>
            <select
              id="focus-select"
              className="custom-select"
              value={focus}
              onChange={(e) => setFocus(e.target.value as AnalysisFocus)}
            >
              <option value="ARCHITECTURE">Архітектура та зв'язки класів</option>
              <option value="CLEAN_CODE">Чистий код і SOLID</option>
              <option value="MODERN_FEATURES">Сучасні фічі мови</option>
              <option value="PERFORMANCE">Продуктивність</option>
              <option value="SECURITY">Безпека</option>
            </select>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleRunAnalysis}
          disabled={loading || files.length === 0}
        >
          {loading ? (
            <>
              <Sparkles className="animate-spin" size={16} />
              Аналізуємо зв'язки...
            </>
          ) : (
            <>
              <Play size={16} />
              Запустити мультифайловий аналіз
            </>
          )}
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{ padding: '0.75rem 1.75rem', background: 'rgba(244, 63, 94, 0.15)', borderBottom: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <AlertTriangle size={18} />
          <span>Помилка: {error} (переконайтеся, що бекенд Spring Boot запущено на порті 8080)</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="workspace-grid">
        {/* Editor Side */}
        <section className="editor-panel">
          <div className="tabs-bar">
            {files.map((file, idx) => (
              <div
                key={file.fileName + idx}
                className={`file-tab ${idx === activeFileIndex ? 'active' : ''}`}
                onClick={() => setActiveFileIndex(idx)}
              >
                <FileCode2 size={14} />
                <span>{file.fileName}</span>
                {files.length > 1 && (
                  <span
                    className="tab-close"
                    onClick={(e) => handleDeleteFile(idx, e)}
                    title="Видалити файл"
                  >
                    <Trash2 size={12} />
                  </span>
                )}
              </div>
            ))}
            <button className="btn-add-tab" onClick={handleAddFile} title="Додати новий файл">
              <Plus size={14} />
              Додати файл
            </button>
          </div>

          <div className="editor-wrapper">
            <textarea
              className="code-textarea"
              value={currentFile?.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Вставте код класу тут..."
              spellCheck={false}
            />
          </div>

          <div className="editor-footer">
            <span>Файл: {currentFile?.fileName}</span>
            <span>Рядків: {(currentFile?.content.match(/\n/g) || []).length + 1}</span>
            <span>Символів: {currentFile?.content.length || 0}</span>
          </div>
        </section>

        {/* Results Side */}
        <section className="results-panel">
          {!response ? (
            <div className="empty-state">
              <Layers className="empty-icon" />
              <h2 className="empty-title">Готово до мультифайлового аудиту</h2>
              <p className="empty-desc">
                Натисніть <strong>«Запустити мультифайловий аналіз»</strong>, щоб виконати архітектурну перевірку взаємозв'язків між класами, знайти циклові залежності, антипатерни та зберегти звіт у базу даних.
              </p>
            </div>
          ) : (
            <>
              {/* Score Header */}
              <div className="results-header">
                <div className="score-banner">
                  <div className={`score-badge-circle ${getScoreClass(response.qualityScore)}`}>
                    <span className="score-value">{response.qualityScore}</span>
                    <span className="score-label">Health</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Результати аналізу коду
                    </h2>
                    <p className="summary-text">{response.summary}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="results-tabs">
                <button
                  className={`result-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                  onClick={() => setActiveTab('insights')}
                >
                  <GitBranch size={16} />
                  Архітектура зв'язків
                  <span className="badge-count">{response.architectureInsights.length}</span>
                </button>
                <button
                  className={`result-tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
                  onClick={() => setActiveTab('issues')}
                >
                  <ShieldAlert size={16} />
                  Дефекти коду
                  <span className="badge-count">{response.issues.length}</span>
                </button>
                <button
                  className={`result-tab-btn ${activeTab === 'refactor' ? 'active' : ''}`}
                  onClick={() => setActiveTab('refactor')}
                >
                  <Sparkles size={16} />
                  Рефакторинг
                  <span className="badge-count">{response.refactoredFiles.length}</span>
                </button>
                <button
                  className={`result-tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tests')}
                >
                  <FlaskConical size={16} />
                  Автотести
                  <span className="badge-count">{response.generatedTests.length}</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="results-content">
                {activeTab === 'insights' && (
                  <>
                    {response.architectureInsights.length === 0 ? (
                      <div className="empty-state">
                        <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
                        <h3 className="empty-title">Архітектурних конфліктів не виявлено</h3>
                        <p className="empty-desc">Між класами немає циклових залежностей та жорсткої зв'язності.</p>
                      </div>
                    ) : (
                      response.architectureInsights.map((insight, idx) => (
                        <div
                          key={idx}
                          className={`card-insight ${insight.relationshipType === 'CIRCULAR_DEPENDENCY' ? 'circular' : 'coupling'}`}
                        >
                          <div className="insight-header">
                            <span className="insight-type">
                              {insight.relationshipType === 'CIRCULAR_DEPENDENCY'
                                ? 'Циклічна залежність (Circular Dependency)'
                                : 'Жорстка зв\'язність (Tight Coupling)'}
                            </span>
                            <span className="insight-files">
                              {insight.sourceFile} ↔ {insight.targetFile}
                            </span>
                          </div>
                          <p className="insight-desc">{insight.description}</p>
                          <div className="insight-suggestion">
                            <strong>Інженерна рекомендація:</strong> {insight.suggestion}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === 'issues' && (
                  <>
                    {response.issues.length === 0 ? (
                      <div className="empty-state">
                        <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
                        <h3 className="empty-title">Проблем не виявлено</h3>
                        <p className="empty-desc">Код відповідає всім перевіреним нормам якості.</p>
                      </div>
                    ) : (
                      response.issues.map((issue) => (
                        <div key={issue.id} className="issue-card">
                          <div className="issue-header">
                            <span
                              className={`tag-severity ${
                                issue.severity === 'CRITICAL'
                                  ? 'tag-critical'
                                  : issue.severity === 'WARNING'
                                  ? 'tag-warning'
                                  : 'tag-info'
                              }`}
                            >
                              {issue.severity}
                            </span>
                            <span className="issue-location">
                              {issue.fileName}{issue.line ? ` : рядок ${issue.line}` : ''}
                            </span>
                          </div>
                          <h4 className="issue-title">{issue.title}</h4>
                          <p className="issue-desc">{issue.description}</p>
                          <div className="issue-rec">
                            <strong>Як виправити:</strong> {issue.recommendation}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === 'refactor' && (
                  <>
                    {response.refactoredFiles.length === 0 ? (
                      <div className="empty-state">
                        <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
                        <h3 className="empty-title">Рефакторинг не потрібен</h3>
                        <p className="empty-desc">Усі файли вже оптимізовані.</p>
                      </div>
                    ) : (
                      response.refactoredFiles.map((file, idx) => (
                        <div key={idx} className="code-viewer-card">
                          <div className="code-viewer-header">
                            <span className="code-viewer-title">{file.fileName} (Покращена версія)</span>
                            <button
                              className="btn-secondary"
                              onClick={() => handleCopy(file.refactoredContent, `refactor-${idx}`)}
                            >
                              <Copy size={14} />
                              {copiedIndex === `refactor-${idx}` ? 'Скопійовано!' : 'Копіювати код'}
                            </button>
                          </div>
                          {file.changesSummary.length > 0 && (
                            <div className="changes-list">
                              <strong>Внесені покращення:</strong>
                              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                                {file.changesSummary.map((change, cIdx) => (
                                  <li key={cIdx}>{change}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <pre className="code-pre">{file.refactoredContent}</pre>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === 'tests' && (
                  <>
                    {response.generatedTests.length === 0 ? (
                      <div className="empty-state">
                        <FlaskConical size={48} style={{ color: '#60a5fa', marginBottom: '1rem' }} />
                        <h3 className="empty-title">Тести не згенеровано</h3>
                        <p className="empty-desc">Додайте сервісний клас (наприклад OrderService), щоб отримати каркас юніт-тестів.</p>
                      </div>
                    ) : (
                      response.generatedTests.map((test, idx) => (
                        <div key={idx} className="code-viewer-card">
                          <div className="code-viewer-header">
                            <div>
                              <span className="code-viewer-title">{test.testFileName}</span>
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                                (для {test.targetFile} • {test.framework})
                              </span>
                            </div>
                            <button
                              className="btn-secondary"
                              onClick={() => handleCopy(test.testCode, `test-${idx}`)}
                            >
                              <Copy size={14} />
                              {copiedIndex === `test-${idx}` ? 'Скопійовано!' : 'Копіювати тест'}
                            </button>
                          </div>
                          <pre className="code-pre">{test.testCode}</pre>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {/* History Drawer Modal */}
      {historyOpen && (
        <div className="modal-overlay" onClick={() => setHistoryOpen(false)}>
          <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="history-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="#60a5fa" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Історія аудитів (PostgreSQL)</h3>
              </div>
              <button
                className="btn-secondary"
                style={{ padding: '4px', borderRadius: '50%' }}
                onClick={() => setHistoryOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="history-list">
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  Завантаження записів з бази...
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                  Записів у базі поки що немає. Запустіть аналіз, і він з'явиться тут автоматично.
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="history-card"
                    onClick={() => handleSelectHistoryItem(item.id)}
                  >
                    <div className="history-card-top">
                      <span className={`history-score-badge ${getScoreClass(item.qualityScore)}`}>
                        {item.qualityScore}/100 Health
                      </span>
                      <span className="history-date">{formatDate(item.createdAt)}</span>
                    </div>

                    <p className="history-card-summary">{item.summary}</p>

                    <div className="history-card-footer">
                      <span>
                        {item.language} • {item.filesCount} файлів • {item.issuesCount} проблем
                      </span>
                      <button
                        className="tab-close"
                        style={{ padding: '3px' }}
                        title="Видалити запис з БД"
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      >
                        <Trash2 size={13} color="#f43f5e" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
