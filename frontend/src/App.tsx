import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  FolderTree,
  Plus,
  Trash2,
  Copy,
  Clock,
  X,
  Database,
  Terminal,
  BarChart3,
  Hammer,
  Search,
  Download,
  Printer,
  Edit2,
  LayoutGrid,
  Compass,
} from 'lucide-react';
import { getSampleProject } from './data/sampleProjects';
import {
  analyzeCode,
  compileCode,
  executeCode,
  runTests,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
} from './services/api';
import { highlightCode } from './utils/highlighter';
import { FileIcon } from './components/FileIcon';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NewFileDialog } from './components/NewFileDialog';
import { RenameFileDialog } from './components/RenameFileDialog';
import { TutorialGuide } from './components/TutorialGuide';
import { generateMarkdownReport, downloadMarkdownReport, printAuditReport } from './utils/reportExporter';
import type {
  AnalysisFocus,
  AnalysisHistoryItem,
  AnalysisResponse,
  CodeFile,
  CompilationResponse,
  ExecutionResponse,
  TestExecutionResponse,
  ProgrammingLanguage,
} from './types/analysis';
import './App.css';

export default function App() {
  const [projectName, setProjectName] = useState<string>('ShopOrderSystem');
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(true);
  const [isTutorialActive, setIsTutorialActive] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState<boolean>(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState<boolean>(false);
  const [fileToRename, setFileToRename] = useState<string | null>(null);

  const [files, setFiles] = useState<CodeFile[]>(() => getSampleProject('JAVA'));
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [language, setLanguage] = useState<ProgrammingLanguage>('JAVA');
  const [focus, setFocus] = useState<AnalysisFocus>('ARCHITECTURE');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [compiling, setCompiling] = useState<boolean>(false);
  const [compilationResult, setCompilationResult] = useState<CompilationResponse | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [testExecutionResult, setTestExecutionResult] = useState<TestExecutionResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'issues' | 'metrics' | 'refactor' | 'tests' | 'build' | 'run'>('insights');
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

  const detectedPackage = React.useMemo(() => {
    if (language !== 'JAVA') return '';
    for (const f of files) {
      const m = f.content.match(/^\s*package\s+([a-zA-Z0-9_.]+);/m);
      if (m && m[1]) return m[1];
    }
    return 'ua.pnu.app';
  }, [language, files]);

  const handleCreateFile = (newFile: CodeFile) => {
    setFiles((prev) => [...prev, newFile]);
    setActiveFileIndex(files.length);
  };

  const handleRenameFile = (oldName: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.fileName === oldName) {
          let updatedContent = f.content;
          const oldBase = oldName.replace(/\.[^/.]+$/, '');
          const newBase = newName.replace(/\.[^/.]+$/, '');
          if (oldBase !== newBase) {
            const typeRegex = new RegExp(`\\b(class|record|interface|enum)\\s+${oldBase}\\b`, 'g');
            updatedContent = updatedContent.replace(typeRegex, `$1 ${newBase}`);
          }
          return { fileName: newName, content: updatedContent };
        }
        return f;
      })
    );
  };

  const handleDeleteFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const file = files[index];
    if (!file) return;

    if (files.length <= 1) {
      if (window.confirm(`Це єдиний файл у проєкті. Бажаєте очистити його вміст?`)) {
        setFiles([{ fileName: file.fileName, content: '' }]);
      }
      return;
    }

    if (window.confirm(`Видалити файл "${file.fileName}" з проєкту?`)) {
      const nextFiles = files.filter((_, i) => i !== index);
      setFiles(nextFiles);
      setActiveFileIndex(Math.max(0, index - 1));
    }
  };

  const handleOpenProjectFromWelcome = (config: {
    language: ProgrammingLanguage;
    projectName: string;
    files: CodeFile[];
    mode: 'custom' | 'sample' | 'blank' | 'tutorial';
  }) => {
    setLanguage(config.language);
    setProjectName(config.projectName);
    setFiles(config.files);
    setActiveFileIndex(0);
    setResponse(null);
    setCompilationResult(null);
    setExecutionResult(null);
    setTestExecutionResult(null);
    setError(null);
    setIsWelcomeOpen(false);
    if (config.mode === 'tutorial') {
      setIsTutorialActive(true);
      setTutorialStep(1);
    } else {
      setIsTutorialActive(false);
      setTutorialStep(1);
    }
  };

  const handleOpenSavedAudit = async (id: string) => {
    try {
      setLoading(true);
      const pastReport = await getAnalysisById(id);
      setResponse(pastReport);
      setLanguage(pastReport.language);
      setIsWelcomeOpen(false);
      setIsTutorialActive(false);
      setActiveTab('insights');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити збережений звіт');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key === 'Insert') || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        setIsNewFileDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBuildProject = async () => {
    setCompiling(true);
    setActiveTab('build');
    try {
      const res = await compileCode({ language, files });
      setCompilationResult(res);
    } catch (err) {
      setCompilationResult({
        success: false,
        language,
        compilerName: 'Compiler Error',
        executionTimeMs: 0,
        errorCount: 1,
        warningCount: 0,
        diagnostics: [{
          fileName: currentFile?.fileName || 'Main',
          lineNumber: 1,
          columnNumber: 1,
          severity: 'ERROR',
          message: err instanceof Error ? err.message : 'Compilation request failed',
        }],
        outputLog: `Build failed: ${err instanceof Error ? err.message : 'Error'}\n`,
      });
    } finally {
      setCompiling(false);
    }
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setActiveTab('run');
    try {
      const res = await executeCode({
        language,
        files,
        mainFileName: currentFile?.fileName,
      });
      setExecutionResult(res);
    } catch (err) {
      setExecutionResult({
        success: false,
        language,
        exitCode: 1,
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        executionTimeMs: 0,
        commandExecuted: 'run',
        timedOut: false,
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleRunAllTests = async () => {
    if (!response || response.generatedTests.length === 0) return;
    setRunningTests(true);
    try {
      const res = await runTests({
        language,
        files,
        tests: response.generatedTests,
      });
      setTestExecutionResult(res);
    } catch (err) {
      setTestExecutionResult({
        success: false,
        language,
        totalCount: 0,
        passedCount: 0,
        failedCount: 1,
        skippedCount: 0,
        executionTimeMs: 0,
        framework: 'Test Runner',
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Failed to execute tests',
        outputLog: err instanceof Error ? err.message : 'Failed to execute tests',
      });
    } finally {
      setRunningTests(false);
    }
  };

  const handleRunSingleTest = async (testFileName: string) => {
    if (!response || response.generatedTests.length === 0) return;
    setRunningTests(true);
    try {
      const res = await runTests({
        language,
        files,
        tests: response.generatedTests,
        testFileName,
      });
      setTestExecutionResult(res);
    } catch (err) {
      setTestExecutionResult({
        success: false,
        language,
        totalCount: 0,
        passedCount: 0,
        failedCount: 1,
        skippedCount: 0,
        executionTimeMs: 0,
        framework: 'Test Runner',
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Failed to execute test',
        outputLog: err instanceof Error ? err.message : 'Failed to execute test',
      });
    } finally {
      setRunningTests(false);
    }
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    setTestExecutionResult(null);
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
          <button
            className="jb-brand-btn"
            onClick={() => setIsWelcomeOpen(true)}
            title="Повернутися на стартову сторінку / змінити проєкт"
          >
            <FolderTree size={14} color="#3574f0" />
            <span className="jb-logo-text">Smart Code Analyzer</span>
          </button>
          <button
            className="jb-project-pill"
            onClick={() => setIsWelcomeOpen(true)}
            title="Поточний проєкт (натисніть для вибору іншого)"
          >
            <span>📁 {projectName}</span>
          </button>
        </div>

        <div className="jb-toolbar-center">
          <button
            className="jb-lang-badge"
            onClick={() => setIsWelcomeOpen(true)}
            title="Мова зафіксована для поточного проєкту. Натисніть, щоб повернутися назад та обрати іншу мову"
          >
            <span style={{ fontSize: '13px' }}>
              {language === 'JAVA' ? '☕' : language === 'PYTHON' ? '🐍' : language === 'TYPESCRIPT' ? '🔷' : '🟨'}
            </span>
            <span style={{ fontWeight: 600 }}>
              {language === 'JAVA' ? 'Java 21 LTS' : language === 'PYTHON' ? 'Python 3.12' : language === 'TYPESCRIPT' ? 'TypeScript' : 'JavaScript'}
            </span>
          </button>

          {isTutorialActive && (
            <button
              className="jb-tutorial-chip"
              onClick={() => setTutorialStep((s) => (s % 5) + 1)}
              title="Інтерактивний туторіал активний. Клікніть для наступного кроку"
            >
              <Compass size={12} />
              <span>Тур: Крок {tutorialStep}/5</span>
            </button>
          )}

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
            className="jb-build-btn"
            onClick={handleBuildProject}
            disabled={compiling || files.length === 0}
            title="Build Project (Ctrl+F9 / In-memory javac & AST compiler)"
            style={{ marginLeft: '8px' }}
          >
            <Hammer size={13} />
            <span>{compiling ? 'Building...' : 'Build Project'}</span>
          </button>

          <button
            className="jb-run-btn"
            onClick={handleRunCode}
            disabled={executing || files.length === 0}
            title="Run Application (Shift+F10 / Executes entry point in isolated runtime)"
          >
            <Play size={13} fill="#ffffff" />
            <span>{executing ? 'Running...' : 'Run'}</span>
          </button>

          <button
            className="jb-inspect-btn"
            onClick={handleRunAnalysis}
            disabled={loading || files.length === 0}
            title="Inspect Code (Run multi-file architectural analysis)"
          >
            <Search size={13} />
            <span>{loading ? 'Inspecting...' : 'Inspect Code'}</span>
          </button>
        </div>

        <div className="jb-toolbar-right">
          {isTutorialActive && (
            <button
              className="jb-btn-tool"
              onClick={() => setIsTutorialActive(false)}
              title="Завершити навчальний тур"
              style={{ color: '#f5a623' }}
            >
              <X size={13} />
              <span>Завершити тур</span>
            </button>
          )}

          <button
            className="jb-btn-tool"
            onClick={() => setIsWelcomeOpen(true)}
            title="Стартова сторінка вибору мови та проєкту"
          >
            <LayoutGrid size={13} />
            <span>Projects</span>
          </button>

          <button
            className="jb-btn-tool"
            onClick={() => setHistoryOpen(true)}
            title="Database History (PostgreSQL)"
          >
            <Database size={13} />
            <span>History</span>
            {historyList.length > 0 && <span className="jb-badge">{historyList.length}</span>}
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
            {language === 'JAVA'
              ? `src/main/java/${detectedPackage.replace(/\./g, '/')}`
              : language === 'PYTHON'
              ? 'src/app'
              : language === 'TYPESCRIPT'
              ? 'src/services'
              : 'src/modules'}
          </div>

          <div className="jb-file-tree">
            {files.map((file, idx) => (
              <div
                key={file.fileName + idx}
                className={`jb-tree-item ${idx === activeFileIndex ? 'active' : ''}`}
                onClick={() => setActiveFileIndex(idx)}
              >
                <FileIcon fileName={file.fileName} content={file.content} size={14} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.fileName}
                </span>
                <div className="jb-tree-item-actions">
                  <button
                    className="jb-tree-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileToRename(file.fileName);
                      setIsRenameDialogOpen(true);
                    }}
                    title="Перейменувати файл"
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    className="jb-tree-action-btn jb-tree-delete"
                    onClick={(e) => handleDeleteFile(idx, e)}
                    title="Видалити файл"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="jb-tree-actions">
            <button className="jb-btn-add" onClick={() => setIsNewFileDialogOpen(true)}>
              <Plus size={11} />
              <span>New File / Class</span>
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
                <FileIcon fileName={file.fileName} content={file.content} size={13} />
                <span>{file.fileName}</span>
                <span
                  className="jb-tab-close"
                  onClick={(e) => handleDeleteFile(idx, e)}
                  title="Закрити / видалити файл"
                >
                  ×
                </span>
              </div>
            ))}
            <button
              className="jb-tab-add"
              onClick={() => setIsNewFileDialogOpen(true)}
              title="Новий файл / клас (Alt+Insert)"
            >
              <Plus size={13} />
            </button>
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
                className={`jb-tool-tab ${activeTab === 'metrics' ? 'active' : ''}`}
                onClick={() => setActiveTab('metrics')}
              >
                <span>Metrics</span>
                {response?.metrics && (
                  <span className="jb-badge">{response.metrics.overallMaintainabilityIndex}/100</span>
                )}
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
              <button
                className={`jb-tool-tab ${activeTab === 'build' ? 'active' : ''}`}
                onClick={() => setActiveTab('build')}
              >
                <span>Build Output</span>
                {compilationResult && (
                  <span
                    className={`jb-badge ${compilationResult.success ? '' : 'jb-badge-error'}`}
                    style={{ marginLeft: '4px' }}
                  >
                    {compilationResult.success ? 'OK' : `${compilationResult.errorCount} err`}
                  </span>
                )}
              </button>
              <button
                className={`jb-tool-tab ${activeTab === 'run' ? 'active' : ''}`}
                onClick={() => setActiveTab('run')}
              >
                <span>Run</span>
                {executionResult && (
                  <span
                    className={`jb-badge ${executionResult.success ? '' : 'jb-badge-error'}`}
                    style={{ marginLeft: '4px' }}
                  >
                    {executionResult.success ? 'exit 0' : `exit ${executionResult.exitCode}`}
                  </span>
                )}
              </button>
            </div>

            {response && (
              <div className="jb-health-summary">
                <span className={`jb-health-tag ${response.qualityScore >= 80 ? 'jb-health-good' : response.qualityScore >= 50 ? 'jb-health-warning' : 'jb-health-critical'}`}>
                  Score: {response.qualityScore}/100
                </span>
                {response.metrics && (
                  <span
                    className={`jb-health-tag ${response.metrics.overallMaintainabilityIndex >= 65 ? 'jb-health-good' : 'jb-health-warning'}`}
                    style={{ marginLeft: '4px' }}
                    title={`Maintainability Index: ${response.metrics.overallMaintainabilityIndex}/100 (Rating ${response.metrics.maintainabilityRating})`}
                  >
                    MI: {response.metrics.overallMaintainabilityIndex} ({response.metrics.maintainabilityRating})
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                  <button
                    className="jb-btn-tool"
                    onClick={() => {
                      const md = generateMarkdownReport(response, files);
                      downloadMarkdownReport(md, `smartcode-audit-${response.language.toLowerCase()}.md`);
                    }}
                    title="Export full audit report as Markdown (.md)"
                    style={{ padding: '2px 8px', fontSize: '11px', height: '22px' }}
                  >
                    <Download size={11} />
                    <span>Export MD</span>
                  </button>
                  <button
                    className="jb-btn-tool"
                    onClick={() => printAuditReport(response, files)}
                    title="Print or Save Audit Report as PDF"
                    style={{ padding: '2px 8px', fontSize: '11px', height: '22px' }}
                  >
                    <Printer size={11} />
                    <span>PDF / Print</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="jb-inspection-content">
            {activeTab === 'run' ? (
              <div className="jb-run-console">
                <div className="jb-console-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Play size={12} fill="#3574f0" color="#3574f0" />
                    <span style={{ fontWeight: 600, color: '#dfe1e5' }}>
                      Run: {currentFile?.fileName || 'Application'}
                    </span>
                    {executionResult && (
                      <span style={{ color: '#8da1b9' }}>({executionResult.executionTimeMs} ms)</span>
                    )}
                  </div>
                  {executionResult && (
                    <span className={`jb-health-tag ${executionResult.success ? 'jb-health-good' : 'jb-health-critical'}`}>
                      {executionResult.timedOut
                        ? 'TIMED OUT'
                        : executionResult.success
                        ? 'PROCESS FINISHED (EXIT 0)'
                        : `PROCESS FAILED (EXIT ${executionResult.exitCode})`}
                    </span>
                  )}
                </div>

                {!executionResult ? (
                  <div className="jb-empty-box">
                    <Play size={32} />
                    <div style={{ fontWeight: 600, color: '#dfe1e5', marginBottom: '4px' }}>
                      No Process Executed Yet
                    </div>
                    <div style={{ fontSize: '11px', maxWidth: '320px' }}>
                      Click <strong>«Run» ▶️</strong> in the top toolbar to execute your code in an isolated runtime ({language === 'JAVA' ? 'Java 21 OpenJDK' : language === 'PYTHON' ? 'Python 3.12' : 'Node.js / TSX'}) and view live terminal output.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="jb-run-cmd-line">
                      <span style={{ color: '#8da1b9' }}>$</span>
                      <span>{executionResult.commandExecuted}</span>
                    </div>
                    <div className="jb-run-body">
                      {executionResult.stdout && (
                        <div className="jb-run-stdout">{executionResult.stdout}</div>
                      )}
                      {executionResult.stderr && (
                        <div className="jb-run-stderr">{executionResult.stderr}</div>
                      )}
                      {!executionResult.stdout && !executionResult.stderr && (
                        <div style={{ color: '#8da1b9', fontStyle: 'italic' }}>
                          (Process completed without console output)
                        </div>
                      )}
                    </div>
                    <div className="jb-run-footer">
                      <span>
                        Process finished with exit code {executionResult.exitCode}
                        {executionResult.timedOut && ' (Execution timed out after 5s)'}
                      </span>
                      <span style={{ color: '#565a60' }}>•</span>
                      <span>Elapsed: {executionResult.executionTimeMs} ms</span>
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === 'build' ? (
              <div className="jb-build-console">
                <div className="jb-console-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hammer size={13} color="#dfe1e5" />
                    <span style={{ fontWeight: 600, color: '#dfe1e5' }}>
                      {compilationResult ? compilationResult.compilerName : 'In-Memory Compiler'}
                    </span>
                    {compilationResult && (
                      <span style={{ color: '#8da1b9' }}>({compilationResult.executionTimeMs} ms)</span>
                    )}
                  </div>
                  {compilationResult && (
                    <span className={`jb-health-tag ${compilationResult.success ? 'jb-health-good' : 'jb-health-critical'}`}>
                      {compilationResult.success ? 'BUILD SUCCESSFUL' : `BUILD FAILED (${compilationResult.errorCount} ERRORS)`}
                    </span>
                  )}
                </div>

                {!compilationResult ? (
                  <div className="jb-empty-box">
                    <Hammer size={32} />
                    <div style={{ fontWeight: 600, color: '#dfe1e5', marginBottom: '4px' }}>
                      No Build Executed Yet
                    </div>
                    <div style={{ fontSize: '11px', maxWidth: '300px' }}>
                      Click <strong>«Build Project» 🔨</strong> in the top toolbar to compile your code in-memory with JDK 21 <code>javac</code> and check for compiler errors.
                    </div>
                  </div>
                ) : (
                  <>
                    {compilationResult.diagnostics.length > 0 && (
                      <div style={{ padding: '8px 12px', background: '#202226', borderBottom: '1px solid #323438' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#f75464', marginBottom: '6px' }}>
                          Compiler Diagnostics ({compilationResult.diagnostics.length}):
                        </div>
                        <div className="jb-diag-list">
                          {compilationResult.diagnostics.map((diag, idx) => (
                            <div
                              key={idx}
                              className="jb-diag-card"
                              onClick={() => {
                                const fileIdx = files.findIndex((f) => f.fileName === diag.fileName);
                                if (fileIdx >= 0) {
                                  setActiveFileIndex(fileIdx);
                                }
                              }}
                              title="Click to jump to file"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: '#f75464', fontWeight: 600 }}>[{diag.severity}]</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: '#8da1b9' }}>
                                  {diag.fileName}:{diag.lineNumber}:{diag.columnNumber}
                                </span>
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#e4e6eb' }}>{diag.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <pre className="jb-console-log">{compilationResult.outputLog}</pre>
                  </>
                )}
              </div>
            ) : !response ? (
              <div className="jb-empty-box">
                <Terminal size={32} />
                <div style={{ fontWeight: 600, color: '#dfe1e5', marginBottom: '4px' }}>
                  No Inspection Performed
                </div>
                <div style={{ fontSize: '11px', maxWidth: '280px' }}>
                  Click <strong>«Inspect Code»</strong> in toolbar to run multi-file architectural analysis, detect circular dependencies, and calculate metrics.
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

                {/* Tab: Metrics & Complexity */}
                {activeTab === 'metrics' && (
                  <div className="jb-metrics-dashboard">
                    {!response.metrics ? (
                      <div className="jb-empty-box">
                        <BarChart3 size={32} />
                        <div style={{ color: '#868a91', fontWeight: 600 }}>No Metrics Available</div>
                        <div style={{ fontSize: '11px' }}>Run inspection to calculate software metrics.</div>
                      </div>
                    ) : (
                      <>
                        {/* KPI Cards Grid */}
                        <div className="jb-metrics-grid">
                          <div className="jb-metric-card">
                            <div className="jb-metric-card-header">
                              <span>Maintainability (MI)</span>
                              <span className={`jb-grade-badge grade-${response.metrics.maintainabilityRating.toLowerCase()}`}>
                                {response.metrics.maintainabilityRating}
                              </span>
                            </div>
                            <div className="jb-metric-card-value">
                              {response.metrics.overallMaintainabilityIndex}
                              <span style={{ fontSize: '12px', color: '#868a91' }}>/100</span>
                            </div>
                            <div className="jb-metric-card-sub">
                              SEI / Microsoft Index
                            </div>
                          </div>

                          <div className="jb-metric-card">
                            <div className="jb-metric-card-header">
                              <span>Cyclomatic (CC)</span>
                              <span className={`jb-complexity-pill complexity-${response.metrics.averageCyclomaticComplexity <= 10 ? 'low' : response.metrics.averageCyclomaticComplexity <= 20 ? 'moderate' : 'high'}`}>
                                {response.metrics.averageCyclomaticComplexity <= 10 ? 'LOW' : 'MODERATE'}
                              </span>
                            </div>
                            <div className="jb-metric-card-value">
                              {response.metrics.averageCyclomaticComplexity}
                              <span style={{ fontSize: '11px', color: '#868a91' }}>avg (max {response.metrics.maxCyclomaticComplexity})</span>
                            </div>
                            <div className="jb-metric-card-sub">
                              McCabe Decision Points
                            </div>
                          </div>

                          <div className="jb-metric-card">
                            <div className="jb-metric-card-header">
                              <span>Cognitive Load</span>
                            </div>
                            <div className="jb-metric-card-value">
                              {response.metrics.totalCognitiveComplexity}
                            </div>
                            <div className="jb-metric-card-sub">
                              Nesting & control burden
                            </div>
                          </div>

                          <div className="jb-metric-card">
                            <div className="jb-metric-card-header">
                              <span>Lines of Code</span>
                            </div>
                            <div className="jb-metric-card-value">
                              {response.metrics.totalSourceLines}
                              <span style={{ fontSize: '11px', color: '#868a91' }}>SLOC</span>
                            </div>
                            <div className="jb-metric-card-sub">
                              {response.metrics.averageCommentRatio}% comments ({response.metrics.totalCommentLines} lines)
                            </div>
                          </div>
                        </div>

                        {/* File Breakdown Table */}
                        <div className="jb-metrics-table-container">
                          <table className="jb-metrics-table">
                            <thead>
                              <tr>
                                <th>File Name</th>
                                <th>Lines (Total/Src)</th>
                                <th>Comments</th>
                                <th>Cyclomatic (CC)</th>
                                <th>Cognitive</th>
                                <th>MI Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {response.metrics.files.map((fm) => (
                                <tr key={fm.fileName}>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <FileIcon fileName={fm.fileName} size={13} />
                                      <span>{fm.fileName}</span>
                                    </div>
                                  </td>
                                  <td>{fm.totalLines} / {fm.sourceLines}</td>
                                  <td>{fm.commentRatio}% ({fm.commentLines})</td>
                                  <td>
                                    <span className={`jb-complexity-pill complexity-${fm.complexityRating.toLowerCase().replace('_', '-')}`}>
                                      CC: {fm.cyclomaticComplexity}
                                    </span>
                                  </td>
                                  <td>{fm.cognitiveComplexity}</td>
                                  <td>
                                    <span className={`jb-grade-badge grade-${fm.maintainabilityRating.toLowerCase()}`} style={{ marginRight: '6px' }}>
                                      {fm.maintainabilityRating}
                                    </span>
                                    <span>{fm.maintainabilityIndex}/100</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Engineering / Formula Reference Box */}
                        <div className="jb-metrics-formula-box">
                          <div><strong>Maintainability Index (SEI/Microsoft standard):</strong> <code>MI = 171 - 5.2·ln(HV) - 0.23·CC - 16.2·ln(LOC)</code> (Grade A: 85-100, B: 65-84, C: 50-64, D: &lt;50).</div>
                          <div style={{ marginTop: '2px' }}><strong>McCabe Cyclomatic Complexity:</strong> <code>V(G) = P + 1</code> (1-10 Simple low-risk, 11-20 Moderate, &gt;20 High testing cost).</div>
                        </div>
                      </>
                    )}
                  </div>
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
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#8da1b9' }}>
                            {response.generatedTests.length} test suite(s) generated for your project classes
                          </span>
                          <button
                            className="jb-run-btn"
                            onClick={handleRunAllTests}
                            disabled={runningTests}
                            style={{ padding: '3px 10px', fontSize: '11.5px' }}
                            title="Execute all generated tests via test framework runner"
                          >
                            <Play size={12} fill="#ffffff" />
                            <span>{runningTests ? 'Running Tests...' : 'Run All Tests'}</span>
                          </button>
                        </div>

                        {testExecutionResult && (
                          <div className={`jb-test-result-box ${testExecutionResult.success ? 'jb-test-passed' : 'jb-test-failed'}`}>
                            <div className="jb-test-result-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`jb-test-status-pill ${testExecutionResult.success ? 'pass' : 'fail'}`}>
                                  {testExecutionResult.success ? 'TESTS PASSED' : 'TESTS FAILED'}
                                </span>
                                <span style={{ fontWeight: 600, color: '#dfe1e5' }}>
                                  {testExecutionResult.passedCount} of {testExecutionResult.totalCount} passed
                                </span>
                                {testExecutionResult.failedCount > 0 && (
                                  <span style={{ color: '#f75464', fontWeight: 600 }}>
                                    ({testExecutionResult.failedCount} failed)
                                  </span>
                                )}
                              </div>
                              <span style={{ color: '#8da1b9', fontSize: '11px' }}>
                                {testExecutionResult.framework} • {testExecutionResult.executionTimeMs} ms
                              </span>
                            </div>
                            <pre className="jb-test-result-log">
                              {testExecutionResult.outputLog}
                            </pre>
                          </div>
                        )}

                        {response.generatedTests.map((test, idx) => (
                          <div key={idx} className="jb-code-block">
                            <div className="jb-code-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{test.testFileName} ({test.framework})</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  className="jb-btn-tool"
                                  onClick={() => handleRunSingleTest(test.testFileName)}
                                  disabled={runningTests}
                                  title={`Run ${test.testFileName}`}
                                  style={{ color: '#59a869', borderColor: '#2d5e38' }}
                                >
                                  <Play size={10} fill="#59a869" />
                                  <span>{runningTests ? 'Testing...' : 'Run Test'}</span>
                                </button>
                                <button
                                  className="jb-btn-tool"
                                  onClick={() => handleCopy(test.testCode, `test-${idx}`)}
                                >
                                  <Copy size={11} />
                                  <span>{copiedIndex === `test-${idx}` ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                            <pre
                              className="jb-code-pre"
                              dangerouslySetInnerHTML={{ __html: highlightCode(test.testCode, test.testFileName) }}
                            />
                          </div>
                        ))}
                      </>
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

      {/* Welcome Screen Dialog */}
      <WelcomeScreen
        isOpen={isWelcomeOpen}
        canClose={files.length > 0}
        onClose={() => setIsWelcomeOpen(false)}
        currentLanguage={language}
        currentProjectName={projectName}
        onOpenProject={handleOpenProjectFromWelcome}
        onOpenSavedAudit={handleOpenSavedAudit}
        historyList={historyList}
        onDeleteHistoryItem={handleDeleteHistoryItem}
      />

      {/* New File Dialog */}
      <NewFileDialog
        isOpen={isNewFileDialogOpen}
        language={language}
        currentFiles={files}
        defaultPackage={detectedPackage}
        onClose={() => setIsNewFileDialogOpen(false)}
        onCreate={handleCreateFile}
      />

      {/* Rename File Dialog */}
      <RenameFileDialog
        isOpen={isRenameDialogOpen}
        currentFileName={fileToRename || ''}
        currentFiles={files}
        onClose={() => {
          setIsRenameDialogOpen(false);
          setFileToRename(null);
        }}
        onRename={handleRenameFile}
      />

      {/* Interactive Guided Tour / Tutorial */}
      <TutorialGuide
        active={isTutorialActive}
        currentStep={tutorialStep}
        language={language}
        onNext={() => setTutorialStep((s) => Math.min(5, s + 1))}
        onPrev={() => setTutorialStep((s) => Math.max(1, s - 1))}
        onClose={() => setIsTutorialActive(false)}
      />
    </div>
  );
}
