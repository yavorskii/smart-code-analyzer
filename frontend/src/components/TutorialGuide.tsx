import React from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  FolderTree,
  FileCode,
  Hammer,
  Search,
  Play,
  Lightbulb,
} from 'lucide-react';
import type { ProgrammingLanguage } from '../types/analysis';

export interface TutorialStep {
  title: string;
  icon: React.ReactNode;
  description: string;
  actionHint: string;
  targetHighlight?: 'tree' | 'editor' | 'build' | 'inspect' | 'run' | 'tabs';
}

interface TutorialGuideProps {
  active: boolean;
  currentStep: number;
  language: ProgrammingLanguage;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const TutorialGuide: React.FC<TutorialGuideProps> = ({
  active,
  currentStep,
  language,
  onNext,
  onPrev,
  onClose,
}) => {
  if (!active) return null;

  const steps: TutorialStep[] = [
    {
      title: 'Крок 1: Огляд структури проєкту',
      icon: <FolderTree size={16} color="#3574f0" />,
      description:
        `У лівій панелі "Project" розміщені файли з розумними розпізнавальними бейджами (C - клас, R - рекорд Java 21, I - інтерфейс, E - enum). ` +
        `У демо-проєкті закладено архітектурні дефекти для перевірки аналізатора.`,
      actionHint: 'Клікніть по будь-якому файлу у дереві зліва, щоб переглянути його код.',
      targetHighlight: 'tree',
    },
    {
      title: 'Крок 2: Створення власних класів та рекордів',
      icon: <FileCode size={16} color="#59a869" />,
      description:
        `Ви не обмежені фіксованими файлами! Натисніть кнопку "+ New File / Class" (або Alt + Insert). ` +
        `Ви зможете задати власне ім'я файлу та обрати тип: Class, Record (Java 21), Interface, Enum чи Exception з живим прев'ю.`,
      actionHint: 'Спробуйте створити новий Java Record або клас через діалог створення.',
      targetHighlight: 'tree',
    },
    {
      title: 'Крок 3: In-Memory Компіляція (Build Project)',
      icon: <Hammer size={16} color="#f5a623" />,
      description:
        `Натисніть кнопку "Build Project" (Ctrl + F9). ` +
        `Бекенд запускає справжній компілятор javax.tools.JavaCompiler, компілює всі файли в оперативній пам'яті та миттєво діагностує помилки.`,
      actionHint: 'Натисніть кнопку "Build Project" у верхньому тулбарі для перевірки коду.',
      targetHighlight: 'build',
    },
    {
      title: 'Крок 4: Статичний аналіз та метрики (Inspect Code)',
      icon: <Search size={16} color="#70a5f9" />,
      description:
        `Натисніть "Inspect Code" (Ctrl + Enter). ` +
        `Система обчислить індекс підтримуваності SEI Maintainability Index (A/B/C/D), цикломатичну складність Маккейба, виявить Circular Dependencies та згенерує рекомендації рефакторингу.`,
      actionHint: 'Натисніть "Inspect Code" у верхньому тулбарі та перегляньте вкладку Insights.',
      targetHighlight: 'inspect',
    },
    {
      title: 'Крок 5: Ізольований запуск та Run Tests',
      icon: <Play size={16} color="#59a869" />,
      description:
        `Натисніть кнопку "Run" (Shift + F10) для виконання main() у безпечній пісочниці з виводом stdout у консоль. ` +
        `А на вкладці "Tests" запустіть автозгенеровані тести JUnit 5 / pytest однією кнопкою "Run Tests".`,
      actionHint: 'Запустіть виконання коду через "Run" або перейдіть до тестів!',
      targetHighlight: 'run',
    },
  ];

  const step = steps[currentStep - 1] || steps[0];
  const total = steps.length;
  const isLast = currentStep === total;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '680px',
        maxWidth: '92vw',
        zIndex: 2500,
        backgroundColor: '#1e1f22',
        border: '2px solid #3574f0',
        borderRadius: '10px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(53, 116, 240, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      {/* Top Banner Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: '#26282e',
          borderBottom: '1px solid #32353a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '4px',
              borderRadius: '4px',
              backgroundColor: '#2e436e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={14} color="#70a5f9" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#dfe1e5' }}>
            Інтерактивний навчальний тур • {language}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#3574f0',
              color: '#ffffff',
              padding: '1px 8px',
              borderRadius: '10px',
            }}
          >
            {currentStep} / {total}
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#868a91',
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
          title="Завершити туторіал"
        >
          <span>Завершити тур</span>
          <X size={14} />
        </button>
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {step.icon}
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#dfe1e5', margin: 0 }}>
            {step.title}
          </h3>
        </div>

        <p style={{ fontSize: '12px', color: '#c4c7cf', lineHeight: 1.5, margin: 0 }}>
          {step.description}
        </p>

        {/* Action Hint Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#161719',
            border: '1px solid #2b2d30',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#a8adb8',
          }}
        >
          <Lightbulb size={14} color="#f5a623" style={{ flexShrink: 0 }} />
          <span>
            <strong>Підказка:</strong> {step.actionHint}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <button
            onClick={onPrev}
            disabled={currentStep === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#2b2d30',
              border: '1px solid #393b40',
              borderRadius: '5px',
              color: currentStep === 1 ? '#6f737a' : '#dfe1e5',
              fontSize: '12px',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 1 ? 0.5 : 1,
            }}
          >
            <ArrowLeft size={13} />
            <span>Назад</span>
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: total }, (_, i) => i + 1).map((num) => (
              <span
                key={num}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: num === currentStep ? '#3574f0' : '#393b40',
                  display: 'inline-block',
                }}
              />
            ))}
          </div>

          <button
            onClick={isLast ? onClose : onNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 18px',
              backgroundColor: isLast ? '#59a869' : '#3574f0',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: isLast
                ? '0 2px 8px rgba(89, 168, 105, 0.4)'
                : '0 2px 8px rgba(53, 116, 240, 0.4)',
            }}
          >
            {isLast ? (
              <>
                <CheckCircle2 size={13} />
                <span>Завершити туторіал</span>
              </>
            ) : (
              <>
                <span>Далі</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
