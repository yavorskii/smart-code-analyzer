import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  FolderTree,
  Plus,
  Trash2,
  Copy,
  Clock,
  X,
  Database,
  Terminal,
} from 'lucide-react';
import { getSampleProject } from './data/sampleProjects';
import {
  analyzeCode,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
} from './services/api';
import { highlightCode } from './utils/highlighter';
import { FileIcon } from './components/FileIcon';
import type {
  AnalysisFocus,
  AnalysisHistoryItem,
  AnalysisResponse,
  CodeFile,
  ProgrammingLanguage,
} from './types/analysis';
import './App.css';

export default function App() {
  const [files, setFiles] = useState<CodeFile[]>(() => getSampleProject('JAVA'));
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const currentFile = files[activeFileIndex] || files[0];

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const items = await getAnalysisHistory();
      setHistoryList(items);
    } catch {
      // Backend may be starting
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const handleContentChange = (content: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === activeFileIndex ? { ...f, content } : f))
    );
  };

  const getFileExtension = (lang: ProgrammingLanguage) => {
    switch (lang) {
      case 'JAVA':
        return '.java';
      case 'PYTHON':
        return '.py';
      case 'JAVASCRIPT':
        return '.js';
      case 'TYPESCRIPT':
        return '.ts';
      default:
        return '.java';
    }
  };

  const getTemplateContent = (lang: ProgrammingLanguage, name: string) => {
    switch (lang) {
      case 'JAVA':
        return `package ua.pnu.shop;\n\npublic class ${name} {\n    \n}\n`;
      case 'PYTHON':
        return `class ${name}:\n    def __init__(self):\n        pass\n`;
      case 'JAVASCRIPT':
      case 'TYPESCRIPT':
        return `export class ${name} {\n    constructor() {\n        \n    }\n}\n`;
      default:
        return '';
    }
  };

  const handleAddFile = () => {
    const ext = getFileExtension(language);
    const baseName = `Component${files.length + 1}`;
    const newName = `${baseName}${ext}`;
    const newFile: CodeFile = {
      fileName: newName,
      content: getTemplateContent(language, baseName),
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

  const handleLanguageChange = (newLang: ProgrammingLanguage) => {
    setLanguage(newLang);
    setFiles(getSampleProject(newLang));
    setActiveFileIndex(0);
    setResponse(null);
    setError(null);
  };

  const handleLoadSample = () => {
    setFiles(getSampleProject(language));
    setActiveFileIndex(0);
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

  const lineCount = (currentFile?.content.match(/\n/g) || []).length + 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

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
    <div className="jb-ide-container">
      {/* JetBrains Main Toolbar */}
      <header className="jb-toolbar">
        <div className="jb-toolbar-left">
          <span className="jb-logo-text">Smart Code Analyzer</span>
        </div>

        <div className="jb-toolbar-center">
          <span className="jb-control-label">Language:</span>
          <select
            className="jb-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as ProgrammingLanguage)}
          >
            <option value="JAVA">Java (Java 21 / Spring)</option>
            <option value="PYTHON">Python</option>
            <option value="TYPESCRIPT">TypeScript</option>
            <option value="JAVASCRIPT">JavaScript</option>
          </select>

          <span className="jb-control-label" style={{ marginLeft: '8px' }}>Profile:</span>
          <select
            className="jb-select"
            value={focus}
            onChange={(e) => setFocus(e.target.value as AnalysisFocus)}
          >
            <option value="ARCHITECTURE">Architecture & Coupling</option>
            <option value="CLEAN_CODE">Clean Code & SOLID</option>
            <option value="MODERN_FEATURES">Modern Features</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="SECURITY">Security</option>
          </select>

          <button
            className="jb-run-btn"
            onClick={handleRunAnalysis}
            disabled={loading || files.length === 0}
            title="Inspect Code (Run static analysis)"
          >
            <Play size={13} fill="#ffffff" />
            {loading ? 'Inspecting...' : 'Inspect Code'}
          </button>
        </div>

        <div className="jb-toolbar-right">
          <button
            className="jb-btn-tool"
            onClick={() => setHistoryOpen(true)}
            title="Database History (PostgreSQL)"
          >
            <Database size={13} />
            <span>History</span>
            {historyList.length > 0 && <span className="jb-badge">{historyList.length}</span>}
          </button>

          <button className="jb-btn-tool" onClick={handleLoadSample} title="Reset to Sample Demo Project">
            <RotateCcw size={13} />
            <span>Reset Demo</span>
          </button>
        </div>
      </header>

      {/* Error Bar */}
      {error && (
        <div style={{ background: '#47262a', color: '#f75464', padding: '6px 12px', fontSize: '11px', borderBottom: '1px solid #6b333a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Error: {error} (Check Spring Boot backend on port 8080)</span>
        </div>
      )}

      {/* Main IDE Workspace */}
      <div className="jb-workspace">
        {/* Left: Project Explorer */}
        <aside className="jb-project-panel">
          <div className="jb-panel-titlebar">
            <span>Project</span>
            <FolderTree size={12} />
          </div>

          <div style={{ padding: '6px 8px', fontSize: '11px', color: '#868a91', borderBottom: '1px solid #2b2d30' }}>
            {language === 'JAVA' ? 'src/main/java/ua/pnu/shop' : language === 'PYTHON' ? 'src/app' : language === 'TYPESCRIPT' ? 'src/services' : 'src/modules'}
          </div>

          <div className="jb-file-tree">
            {files.map((file, idx) => (
              <div
                key={file.fileName + idx}
                className={`jb-tree-item ${idx === activeFileIndex ? 'active' : ''}`}
                onClick={() => setActiveFileIndex(idx)}
              >
                <FileIcon fileName={file.fileName} size={14} />
                <span>{file.fileName}</span>
                {files.length > 1 && (
                  <button
                    className="jb-tree-delete"
                    onClick={(e) => handleDeleteFile(idx, e)}
                    title="Delete file"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="jb-tree-actions">
            <button className="jb-btn-add" onClick={handleAddFile}>
              <Plus size={11} />
              <span>New File</span>
            </button>
          </div>
        </aside>

        {/* Center: Editor */}
        <main className="jb-editor-panel">
          <div className="jb-tab-bar">
            {files.map((file, idx) => (
              <div
                key={file.fileName + idx}
                className={`jb-tab ${idx === activeFileIndex ? 'active' : ''}`}
                onClick={() => setActiveFileIndex(idx)}
              >
                <FileIcon fileName={file.fileName} size={13} />
                <span>{file.fileName}</span>
                {files.length > 1 && (
                  <span
                    className="jb-tab-close"
                    onClick={(e) => handleDeleteFile(idx, e)}
                  >
                    ×
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="jb-editor-body">
            <div className="jb-gutter" ref={gutterRef}>
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>

            <div className="jb-editor-wrapper">
              <pre
                ref={highlightRef}
                className="jb-highlight-layer"
                dangerouslySetInnerHTML={{
                  __html: highlightCode(currentFile?.content || '', currentFile?.fileName) + '\n',
                }}
              />
              <textarea
                ref={textareaRef}
                className="jb-textarea"
                value={currentFile?.content || ''}
                onChange={(e) => handleContentChange(e.target.value)}
                onScroll={handleScroll}
                placeholder="// Write or paste code here..."
                spellCheck={false}
              />
            </div>
          </div>

          <footer className="jb-statusbar">
            <div>
              <span>File: {currentFile?.fileName}</span>
            </div>
            <div className="jb-statusbar-right">
              <span>UTF-8</span>
              <span>4 spaces</span>
              <span>Java 21</span>
              <span>Lines: {lineCount}</span>
            </div>
          </footer>
        </main>

        {/* Right: Inspections / Problems Tool Window */}
        <section className="jb-inspection-panel">
          <div className="jb-tool-header">
            <div className="jb-tool-tabs">
              <button
                className={`jb-tool-tab ${activeTab === 'insights' ? 'active' : ''}`}
                onClick={() => setActiveTab('insights')}
              >
                <span>Architecture</span>
                {response && <span className="jb-badge">{response.architectureInsights.length}</span>}
              </button>
              <button
                className={`jb-tool-tab ${activeTab === 'issues' ? 'active' : ''}`}
                onClick={() => setActiveTab('issues')}
              >
                <span>Problems</span>
                {response && <span className="jb-badge">{response.issues.length}</span>}
              </button>
              <button
                className={`jb-tool-tab ${activeTab === 'refactor' ? 'active' : ''}`}
                onClick={() => setActiveTab('refactor')}
              >
                <span>Quick-Fixes</span>
                {response && <span className="jb-badge">{response.refactoredFiles.length}</span>}
              </button>
              <button
                className={`jb-tool-tab ${activeTab === 'tests' ? 'active' : ''}`}
                onClick={() => setActiveTab('tests')}
              >
                <span>Tests</span>
                {response && <span className="jb-badge">{response.generatedTests.length}</span>}
              </button>
            </div>

            {response && (
              <div className="jb-health-summary">
                <span className={`jb-health-tag ${response.qualityScore >= 80 ? 'jb-health-good' : response.qualityScore >= 50 ? 'jb-health-warning' : 'jb-health-critical'}`}>
                  Score: {response.qualityScore}/100
                </span>
              </div>
            )}
          </div>

          <div className="jb-inspection-content">
            {!response ? (
              <div className="jb-empty-box">
                <Terminal size={32} />
                <div style={{ fontWeight: 600, color: '#dfe1e5', marginBottom: '4px' }}>
                  No Inspection Performed
                </div>
                <div style={{ fontSize: '11px', maxWidth: '280px' }}>
                  Click <strong>«Inspect Code»</strong> in toolbar to run multi-file architectural analysis, detect circular dependencies, and view inspection warnings.
                </div>
              </div>
            ) : (
              <>
                {/* Summary Alert */}
                <div style={{ padding: '6px 10px', background: '#26282b', border: '1px solid #393b40', borderRadius: '3px', fontSize: '11.5px', color: '#bcbec4' }}>
                  {response.summary}
                </div>

                {/* Tab: Architecture */}
                {activeTab === 'insights' && (
                  <>
                    {response.architectureInsights.length === 0 ? (
                      <div className="jb-empty-box">
                        <div style={{ color: '#59a869', fontWeight: 600 }}>No Architectural Cycles Detected</div>
                        <div style={{ fontSize: '11px' }}>Clean component boundaries and loose coupling.</div>
                      </div>
                    ) : (
                      response.architectureInsights.map((insight, idx) => (
                        <div key={idx} className="jb-card">
                          <div className="jb-card-header">
                            <span className={`jb-card-badge ${insight.relationshipType === 'CIRCULAR_DEPENDENCY' ? 'jb-badge-error' : 'jb-badge-warning'}`}>
                              {insight.relationshipType === 'CIRCULAR_DEPENDENCY' ? 'Circular Dependency' : 'Tight Coupling'}
                            </span>
                            <span className="jb-card-loc">
                              {insight.sourceFile} ↔ {insight.targetFile}
                            </span>
                          </div>
                          <div className="jb-card-desc">{insight.description}</div>
                          <div className="jb-card-fix">
                            <strong>Architectural recommendation:</strong> {insight.suggestion}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Tab: Problems / Code Smells */}
                {activeTab === 'issues' && (
                  <>
                    {response.issues.length === 0 ? (
                      <div className="jb-empty-box">
                        <div style={{ color: '#59a869', fontWeight: 600 }}>0 Problems Detected</div>
                        <div style={{ fontSize: '11px' }}>No code smell or design rule violations found.</div>
                      </div>
                    ) : (
                      response.issues.map((issue) => (
                        <div key={issue.id} className="jb-card">
                          <div className="jb-card-header">
                            <span className={`jb-card-badge ${issue.severity === 'CRITICAL' ? 'jb-badge-error' : issue.severity === 'WARNING' ? 'jb-badge-warning' : 'jb-badge-info'}`}>
                              {issue.severity}
                            </span>
                            <span className="jb-card-loc">
                              {issue.fileName}{issue.line ? `:${issue.line}` : ''}
                            </span>
                          </div>
                          <div className="jb-card-title">{issue.title}</div>
                          <div className="jb-card-desc">{issue.description}</div>
                          <div className="jb-card-fix">
                            <strong>Fix:</strong> {issue.recommendation}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Tab: Refactoring */}
                {activeTab === 'refactor' && (
                  <>
                    {response.refactoredFiles.length === 0 ? (
                      <div className="jb-empty-box">
                        <div style={{ color: '#59a869', fontWeight: 600 }}>No Refactoring Required</div>
                        <div style={{ fontSize: '11px' }}>All classes are properly structured.</div>
                      </div>
                    ) : (
                      response.refactoredFiles.map((file, idx) => (
                        <div key={idx} className="jb-code-block">
                          <div className="jb-code-header">
                            <span>{file.fileName} (Refactored)</span>
                            <button
                              className="jb-btn-tool"
                              onClick={() => handleCopy(file.refactoredContent, `refactor-${idx}`)}
                            >
                              <Copy size={11} />
                              <span>{copiedIndex === `refactor-${idx}` ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          {file.changesSummary.length > 0 && (
                            <div style={{ padding: '6px 10px', background: '#202226', borderBottom: '1px solid #323438', fontSize: '11px', color: '#8da1b9' }}>
                              <strong>Applied changes:</strong>
                              <ul style={{ paddingLeft: '14px', marginTop: '2px' }}>
                                {file.changesSummary.map((c, cIdx) => (
                                  <li key={cIdx}>{c}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <pre
                            className="jb-code-pre"
                            dangerouslySetInnerHTML={{ __html: highlightCode(file.refactoredContent, file.fileName) }}
                          />
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Tab: Generated Tests */}
                {activeTab === 'tests' && (
                  <>
                    {response.generatedTests.length === 0 ? (
                      <div className="jb-empty-box">
                        <div style={{ color: '#868a91', fontWeight: 600 }}>No Unit Tests Generated</div>
                        <div style={{ fontSize: '11px' }}>Add service classes (e.g. OrderService) to generate tests.</div>
                      </div>
                    ) : (
                      response.generatedTests.map((test, idx) => (
                        <div key={idx} className="jb-code-block">
                          <div className="jb-code-header">
                            <span>{test.testFileName} ({test.framework})</span>
                            <button
                              className="jb-btn-tool"
                              onClick={() => handleCopy(test.testCode, `test-${idx}`)}
                            >
                              <Copy size={11} />
                              <span>{copiedIndex === `test-${idx}` ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <pre
                            className="jb-code-pre"
                            dangerouslySetInnerHTML={{ __html: highlightCode(test.testCode, test.testFileName) }}
                          />
                        </div>
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* History Drawer Modal (JetBrains Git / Local History style) */}
      {historyOpen && (
        <div className="jb-modal-overlay" onClick={() => setHistoryOpen(false)}>
          <div className="jb-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="jb-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="#3574f0" />
                <span>Inspection History (PostgreSQL)</span>
              </div>
              <button
                className="jb-btn-tool"
                style={{ padding: '2px 4px' }}
                onClick={() => setHistoryOpen(false)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="jb-drawer-list">
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#868a91' }}>
                  Loading history from PostgreSQL...
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6f737a' }}>
                  No past audit records in database.
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="jb-history-row"
                    onClick={() => handleSelectHistoryItem(item.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`jb-card-badge ${item.qualityScore >= 80 ? 'jb-badge-info' : item.qualityScore >= 50 ? 'jb-badge-warning' : 'jb-badge-error'}`}>
                        Score: {item.qualityScore}/100
                      </span>
                      <span style={{ fontSize: '11px', color: '#6f737a' }}>{formatDate(item.createdAt)}</span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#c4c7cf', lineHeight: '1.3' }}>
                      {item.summary}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#868a91', borderTop: '1px solid #2e3034', paddingTop: '4px', marginTop: '2px' }}>
                      <span>{item.language} • {item.filesCount} files • {item.issuesCount} problems</span>
                      <button
                        className="jb-tree-delete"
                        style={{ opacity: 1, padding: '2px' }}
                        title="Delete audit from DB"
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      >
                        <Trash2 size={11} color="#f75464" />
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
