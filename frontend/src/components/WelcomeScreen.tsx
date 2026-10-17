import React, { useState } from 'react';
import {
  FolderCode,
  Compass,
  Clock,
  Info,
  Database,
  ArrowRight,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { getSampleProject, getBlankProject } from '../data/sampleProjects';
import type { CodeFile, ProgrammingLanguage, AnalysisHistoryItem } from '../types/analysis';

interface WelcomeScreenProps {
  isOpen: boolean;
  canClose: boolean;
  onClose: () => void;
  currentLanguage: ProgrammingLanguage;
  currentProjectName: string;
  onOpenProject: (config: {
    language: ProgrammingLanguage;
    projectName: string;
    files: CodeFile[];
    mode: 'custom' | 'sample' | 'blank' | 'tutorial';
  }) => void;
  onOpenSavedAudit: (id: string) => Promise<void>;
  historyList: AnalysisHistoryItem[];
  onDeleteHistoryItem: (id: string, e: React.MouseEvent) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  isOpen,
  canClose,
  onClose,
  currentLanguage,
  currentProjectName,
  onOpenProject,
  onOpenSavedAudit,
  historyList,
  onDeleteHistoryItem,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'tutorial' | 'history' | 'about'>('projects');
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(currentLanguage);
  const [projectName, setProjectName] = useState(currentProjectName || 'SmartCodeApp');

  if (!isOpen) return null;

  const handleCreateCustom = () => {
    const name = projectName.trim() || 'MyProject';
    const files = getBlankProject(selectedLanguage);

    onOpenProject({
      language: selectedLanguage,
      projectName: name,
      files,
      mode: 'custom',
    });
  };

  const handleLaunchTutorial = () => {
    const files = getSampleProject(selectedLanguage);
    const demoName =
      selectedLanguage === 'JAVA'
        ? 'ShopOrderSystem (Interactive Tutorial)'
        : selectedLanguage === 'PYTHON'
        ? 'OrderProcessingApp (Interactive Tutorial)'
        : selectedLanguage === 'TYPESCRIPT'
        ? 'PaymentServiceTS (Interactive Tutorial)'
        : 'PaymentServiceJS (Interactive Tutorial)';

    onOpenProject({
      language: selectedLanguage,
      projectName: demoName,
      files,
      mode: 'tutorial',
    });
  };

  const languages: {
    id: ProgrammingLanguage;
    name: string;
    version: string;
    tagline: string;
    color: string;
    features: string[];
  }[] = [
    {
      id: 'JAVA',
      name: 'Java',
      version: 'Java 21 LTS',
      tagline: 'Enterprise архітектура, Records, Enums, In-memory javac, JUnit 5',
      color: '#e65100',
      features: ['Java 21 Virtual Threads & Records', 'In-memory javac компілятор', 'Модульні тести JUnit 5'],
    },
    {
      id: 'PYTHON',
      name: 'Python',
      version: 'Python 3.12',
      tagline: 'Clean Code & SOLID, Dataclasses, PEP 8, Pytest Runner',
      color: '#387eb8',
      features: ['Аналіз PEP 8 & чиста архітектура', 'Dataclasses & Type Hints', 'Pytest інтеграція'],
    },
    {
      id: 'TYPESCRIPT',
      name: 'TypeScript',
      version: 'TypeScript 5.x',
      tagline: 'Сувора типізація, інтерфейси, контракти та node:test',
      color: '#3178c6',
      features: ['Strict Types & ES Modules', 'Аналіз міжмодульних зв\'язків', 'Швидкий node:test runner'],
    },
    {
      id: 'JAVASCRIPT',
      name: 'JavaScript',
      version: 'Modern ES2024',
      tagline: 'Асинхронний код, чиста структура, відсутність спагеті-коду',
      color: '#f7df1e',
      features: ['Сучасний синтаксис ES6+', 'Перевірка якості та антипатернів', 'Ізольований запуск у V8'],
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 16, 18, 0.88)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '940px',
          maxWidth: '100%',
          height: '630px',
          maxHeight: '94vh',
          backgroundColor: '#1e1f22',
          border: '1px solid #393b40',
          borderRadius: '10px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {canClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              color: '#9da0a8',
              padding: '6px',
              borderRadius: '6px',
              background: '#2b2d30',
              border: '1px solid #393b40',
              zIndex: 10,
            }}
            title="Повернутися до відкритого редактора (Esc)"
          >
            <X size={15} />
          </button>
        )}

        {/* Left Sidebar */}
        <div
          style={{
            width: '240px',
            backgroundColor: '#18191c',
            borderRight: '1px solid #2b2d30',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 16px',
            flexShrink: 0,
          }}
        >
          <div>
            {/* Brand Logo & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3574f0 0%, #59a869 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(53, 116, 240, 0.35)',
                }}
              >
                <FolderCode size={18} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#dfe1e5', letterSpacing: '0.3px' }}>
                  Smart Code
                </div>
                <div style={{ fontSize: '11px', color: '#868a91' }}>Analyzer Web-IDE</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => setActiveTab('projects')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: activeTab === 'projects' ? '#2e436e' : 'transparent',
                  color: activeTab === 'projects' ? '#ffffff' : '#9da0a8',
                  fontSize: '12px',
                  fontWeight: activeTab === 'projects' ? 600 : 400,
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <FolderCode size={15} color={activeTab === 'projects' ? '#70a5f9' : '#868a91'} />
                <span>Новий проєкт</span>
              </button>

              <button
                onClick={() => setActiveTab('tutorial')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: activeTab === 'tutorial' ? '#2e436e' : 'transparent',
                  color: activeTab === 'tutorial' ? '#ffffff' : '#9da0a8',
                  fontSize: '12px',
                  fontWeight: activeTab === 'tutorial' ? 600 : 400,
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Compass size={15} color={activeTab === 'tutorial' ? '#70a5f9' : '#868a91'} />
                <span>Інтерактивний тур</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    background: '#59a869',
                    color: '#ffffff',
                    fontSize: '9px',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    fontWeight: 700,
                  }}
                >
                  DEMO
                </span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: activeTab === 'history' ? '#2e436e' : 'transparent',
                  color: activeTab === 'history' ? '#ffffff' : '#9da0a8',
                  fontSize: '12px',
                  fontWeight: activeTab === 'history' ? 600 : 400,
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Clock size={15} color={activeTab === 'history' ? '#70a5f9' : '#868a91'} />
                <span>Історія аудитів</span>
                {historyList.length > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: '#3574f0',
                      color: '#ffffff',
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {historyList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('about')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: activeTab === 'about' ? '#2e436e' : 'transparent',
                  color: activeTab === 'about' ? '#ffffff' : '#9da0a8',
                  fontSize: '12px',
                  fontWeight: activeTab === 'about' ? 600 : 400,
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Info size={15} color={activeTab === 'about' ? '#70a5f9' : '#868a91'} />
                <span>Про систему</span>
              </button>
            </nav>
          </div>

          {/* Footer info in sidebar */}
          <div style={{ fontSize: '10px', color: '#6f737a', borderTop: '1px solid #2b2d30', paddingTop: '12px' }}>
            <div>ПНУ ім. В. Стефаника</div>
            <div>Спеціальність 121 «ІПЗ»</div>
            <div style={{ marginTop: '4px', color: '#868a91' }}>Версія 2.4 LTS</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#1e1f22',
            padding: '28px 32px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === 'projects' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#dfe1e5', marginBottom: '4px' }}>
                  Створення власного проєкту
                </h1>
                <p style={{ fontSize: '12px', color: '#9da0a8' }}>
                  Оберіть мову програмування та налаштуйте початкові параметри. У проєкті не буде жодного тестового демо-коду.
                </p>
              </div>

              {/* Language Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                {languages.map((lang) => {
                  const isSelected = selectedLanguage === lang.id;
                  return (
                    <div
                      key={lang.id}
                      onClick={() => setSelectedLanguage(lang.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#262930' : '#232529',
                        border: isSelected ? '2px solid #3574f0' : '1px solid #32353a',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 16px rgba(53, 116, 240, 0.2)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#dfe1e5' }}>
                            {lang.name}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: isSelected ? '#3574f0' : '#2e3136',
                              color: isSelected ? '#ffffff' : '#9da0a8',
                              fontWeight: 600,
                            }}
                          >
                            {lang.version}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#868a91', marginBottom: '6px', lineHeight: 1.3 }}>
                          {lang.tagline}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {lang.features.map((feat, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10px',
                              color: '#a0a5ad',
                              background: '#1a1c1e',
                              padding: '2px 6px',
                              borderRadius: '3px',
                            }}
                          >
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Box: New Project Configuration */}
              <div
                style={{
                  backgroundColor: '#26282e',
                  border: '1px solid #393b40',
                  borderRadius: '8px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#dfe1e5' }}>
                  Створення проєкту ({selectedLanguage})
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '6px' }}>
                    Назва проєкту:
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. StudentPortal, PaymentSystem"
                    style={{
                      width: '100%',
                      background: '#1e1f22',
                      border: '1px solid #393b40',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      color: '#dfe1e5',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#868a91', marginTop: '6px' }}>
                    Буде створено базовий файл із мінімальною точкою входу Hello, World без надлишкових пакетів.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={handleCreateCustom}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px 18px',
                      backgroundColor: '#3574f0',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(53, 116, 240, 0.3)',
                    }}
                  >
                    <Plus size={15} />
                    <span>Створити проєкт і відкрити в IDE</span>
                    <ArrowRight size={14} />
                  </button>

                  <div style={{ fontSize: '11px', color: '#868a91', textAlign: 'center' }}>
                    Потрібна демонстрація виявлення дефектів архітектури для комісії?{' '}
                    <span
                      onClick={() => setActiveTab('tutorial')}
                      style={{ color: '#70a5f9', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Перейдіть до Інтерактивного туторіалу →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tutorial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Compass size={18} color="#70a5f9" />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#dfe1e5', margin: 0 }}>
                    Інтерактивний навчальний тур (Демо-режим)
                  </h2>
                </div>
                <p style={{ fontSize: '12px', color: '#9da0a8', margin: 0 }}>
                  Окремий сценарій із покроковими підказками на кожному етапі для наочної демонстрації системи комісії.
                </p>
              </div>

              {/* Language selection for tutorial */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '8px', fontWeight: 600 }}>
                  Оберіть мову для проходження туторіалу:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {languages.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLanguage(l.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '6px',
                        background: selectedLanguage === l.id ? '#2e436e' : '#26282e',
                        border: selectedLanguage === l.id ? '2px solid #3574f0' : '1px solid #393b40',
                        color: selectedLanguage === l.id ? '#ffffff' : '#dfe1e5',
                        fontSize: '12px',
                        fontWeight: selectedLanguage === l.id ? 700 : 500,
                        textAlign: 'center',
                      }}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tutorial Steps Preview Cards */}
              <div
                style={{
                  backgroundColor: '#26282e',
                  border: '1px solid #393b40',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#dfe1e5', marginBottom: '2px' }}>
                  Етапи, які будуть показані у навчальному турі:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: '#c4c7cf' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1e3a5f', color: '#70a5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px' }}>1</span>
                    <span><strong>Дерево файлів:</strong> Огляд класів, зв'язків та бейджів у стилі IntelliJ IDEA</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: '#c4c7cf' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1b4d3e', color: '#6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px' }}>2</span>
                    <span><strong>Створення файлу:</strong> Додавання Java 21 Record, Enum чи Interface з власним ім'ям</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: '#c4c7cf' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#593a17', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px' }}>3</span>
                    <span><strong>In-Memory Build:</strong> Компіляція коду в оперативній пам'яті через javac 21</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: '#c4c7cf' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2e436e', color: '#70a5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px' }}>4</span>
                    <span><strong>Аудит коду:</strong> Розрахунок Maintainability Index (MI), Cyclomatic Complexity</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: '#c4c7cf' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1b4d3e', color: '#59a869', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px' }}>5</span>
                    <span><strong>Запуск та тести:</strong> Виконання коду у процесі та запуск автозгенерованих тестів</span>
                  </div>
                </div>

                <button
                  onClick={handleLaunchTutorial}
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 18px',
                    backgroundColor: '#59a869',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(89, 168, 105, 0.35)',
                  }}
                >
                  <Compass size={16} />
                  <span>Запустити інтерактивний тур ({selectedLanguage})</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#dfe1e5', marginBottom: '4px' }}>
                  Історія аудитів (PostgreSQL)
                </h2>
                <p style={{ fontSize: '12px', color: '#9da0a8' }}>
                  Збережені результати статичного аналізу та перевірки якості коду:
                </p>
              </div>

              {historyList.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    backgroundColor: '#26282e',
                    border: '1px dashed #393b40',
                    borderRadius: '8px',
                    color: '#868a91',
                    fontSize: '12px',
                  }}
                >
                  <Database size={24} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <div>Немає збережених записів у базі даних.</div>
                  <div style={{ marginTop: '4px', fontSize: '11px' }}>
                    Запустіть аналіз коду (Inspect Code) у відкритому проекті, щоб зберегти звіт.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                  {historyList.map((item) => {
                    const score = item.qualityScore;
                    const scoreColor =
                      score >= 80 ? '#59a869' : score >= 60 ? '#f5a623' : '#f75464';

                    return (
                      <div
                        key={item.id}
                        onClick={() => onOpenSavedAudit(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          backgroundColor: '#26282e',
                          border: '1px solid #393b40',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              color: scoreColor,
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {score}/100
                          </span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#dfe1e5' }}>
                              {item.language} — {item.focus}
                            </div>
                            <div style={{ fontSize: '11px', color: '#868a91' }}>
                              {item.filesCount} файлів • {item.issuesCount} проблем • {new Date(item.createdAt).toLocaleString('uk-UA')}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={(e) => onDeleteHistoryItem(item.id, e)}
                            style={{
                              color: '#868a91',
                              padding: '4px',
                              borderRadius: '4px',
                            }}
                            title="Видалити запис"
                          >
                            <Trash2 size={13} />
                          </button>
                          <span style={{ fontSize: '11px', color: '#70a5f9', fontWeight: 600 }}>
                            Відкрити →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', color: '#c9ccd4' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#dfe1e5', marginBottom: '6px' }}>
                  Про кваліфікаційну систему Smart Code Analyzer
                </h2>
                <p style={{ lineHeight: 1.5, color: '#9da0a8' }}>
                  Програмна система розроблена в межах кваліфікаційної (дипломної) роботи на здобуття першого (бакалаврського) рівня вищої освіти за спеціальністю <strong>121 «Інженерія програмного забезпечення»</strong> у Прикарпатському національному університеті імені Василя Стефаника.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  backgroundColor: '#26282e',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #393b40',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#dfe1e5', marginBottom: '6px' }}>Основні модулі системи:</div>
                  <ul style={{ paddingLeft: '16px', color: '#9da0a8', lineHeight: 1.6 }}>
                    <li>Багатомовний синтаксичний та архітектурний аналізатор</li>
                    <li>Розрахунок метрик якості (SEI MI, McCabe CCN)</li>
                    <li>In-Memory компіляція Java 21 (<code style={{ color: '#70a5f9' }}>javax.tools</code>)</li>
                    <li>Безпечне середовище виконання з таймаутом</li>
                    <li>Генератор та раннер модульних тестів (JUnit 5, pytest)</li>
                  </ul>
                </div>

                <div>
                  <div style={{ fontWeight: 600, color: '#dfe1e5', marginBottom: '6px' }}>Гарячі клавіші IDE:</div>
                  <ul style={{ paddingLeft: '16px', color: '#9da0a8', lineHeight: 1.6 }}>
                    <li><strong style={{ color: '#dfe1e5' }}>Ctrl + F9</strong> — Компіляція проєкту (Build)</li>
                    <li><strong style={{ color: '#dfe1e5' }}>Shift + F10</strong> — Запуск застосунку (Run)</li>
                    <li><strong style={{ color: '#dfe1e5' }}>Ctrl + Enter</strong> — Аудит архітектури (Inspect)</li>
                    <li><strong style={{ color: '#dfe1e5' }}>Alt + Insert</strong> — Створення нового файлу / класу</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
