import React, { useState, useEffect, useRef } from 'react';
import { X, FileCode, Plus, AlertCircle } from 'lucide-react';
import type { CodeFile, ProgrammingLanguage } from '../types/analysis';

interface NewFileDialogProps {
  isOpen: boolean;
  language: ProgrammingLanguage;
  currentFiles: CodeFile[];
  onClose: () => void;
  onCreate: (file: CodeFile) => void;
}

type JavaType = 'CLASS' | 'RECORD' | 'INTERFACE' | 'ENUM' | 'EXCEPTION' | 'MAIN';
type PythonType = 'CLASS' | 'DATACLASS' | 'MODULE' | 'TEST';
type TypeScriptType = 'CLASS' | 'INTERFACE' | 'TYPE' | 'ENUM' | 'TEST';
type JavaScriptType = 'CLASS' | 'MODULE' | 'TEST';

export const NewFileDialog: React.FC<NewFileDialogProps> = ({
  isOpen,
  language,
  currentFiles,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<string>('CLASS');
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedType(language === 'JAVA' ? 'CLASS' : language === 'PYTHON' ? 'CLASS' : 'CLASS');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, language]);

  if (!isOpen) return null;

  const sanitizeIdentifier = (raw: string) => {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/\.(java|py|ts|js|tsx|jsx)$/i, '');
    cleaned = cleaned.replace(/[^a-zA-Z0-9_$]/g, '');
    return cleaned;
  };

  const cleanName = sanitizeIdentifier(name);

  const getFullFileName = () => {
    const base = cleanName || 'Untitled';
    switch (language) {
      case 'JAVA':
        return `${base}.java`;
      case 'PYTHON':
        if (selectedType === 'TEST' && !base.startsWith('test_')) {
          return `test_${base.toLowerCase()}.py`;
        }
        return `${base.toLowerCase()}.py`;
      case 'TYPESCRIPT':
        if (selectedType === 'TEST') {
          return `${base}.test.ts`;
        }
        return `${base}.ts`;
      case 'JAVASCRIPT':
        if (selectedType === 'TEST') {
          return `${base}.test.js`;
        }
        return `${base}.js`;
      default:
        return `${base}.java`;
    }
  };

  const generateContent = () => {
    const identifier = cleanName || 'Item';

    if (language === 'JAVA') {
      switch (selectedType as JavaType) {
        case 'RECORD':
          return `public record ${identifier}() {\n}\n`;
        case 'INTERFACE':
          return `public interface ${identifier} {\n}\n`;
        case 'ENUM':
          return `public enum ${identifier} {\n}\n`;
        case 'EXCEPTION':
          return (
            `public class ${identifier} extends RuntimeException {\n` +
            `    public ${identifier}(String message) {\n` +
            `        super(message);\n` +
            `    }\n` +
            `}\n`
          );
        case 'MAIN':
          return (
            `public class ${identifier} {\n` +
            `    public static void main(String[] args) {\n` +
            `        System.out.println("Hello, World!");\n` +
            `    }\n` +
            `}\n`
          );
        case 'CLASS':
        default:
          return `public class ${identifier} {\n}\n`;
      }
    }

    if (language === 'PYTHON') {
      switch (selectedType as PythonType) {
        case 'DATACLASS':
          return (
            `from dataclasses import dataclass\n\n` +
            `@dataclass\n` +
            `class ${identifier}:\n` +
            `    pass\n`
          );
        case 'TEST':
          return (
            `import pytest\n\n` +
            `def test_example():\n` +
            `    assert True\n`
          );
        case 'MODULE':
          return (
            `def main():\n` +
            `    print("Hello, World!")\n\n` +
            `if __name__ == '__main__':\n` +
            `    main()\n`
          );
        case 'CLASS':
        default:
          return `class ${identifier}:\n    pass\n`;
      }
    }

    if (language === 'TYPESCRIPT') {
      switch (selectedType as TypeScriptType) {
        case 'INTERFACE':
          return `export interface ${identifier} {\n}\n`;
        case 'TYPE':
          return `export type ${identifier} = {\n};\n`;
        case 'ENUM':
          return `export enum ${identifier} {\n}\n`;
        case 'TEST':
          return (
            `import { test } from 'node:test';\nimport assert from 'node:assert';\n\n` +
            `test('example', () => {\n` +
            `    assert.strictEqual(1, 1);\n` +
            `});\n`
          );
        case 'CLASS':
        default:
          return `export class ${identifier} {\n}\n`;
      }
    }

    // JavaScript
    switch (selectedType as JavaScriptType) {
      case 'TEST':
        return (
          `const { test } = require('node:test');\nconst assert = require('node:assert');\n\n` +
          `test('example', () => {\n` +
          `    assert.strictEqual(1, 1);\n` +
          `});\n`
        );
      case 'MODULE':
        return (
          `function execute() {\n}\n\n` +
          `module.exports = { execute };\n`
        );
      case 'CLASS':
      default:
        return (
          `class ${identifier} {\n` +
          `}\n\n` +
          `module.exports = ${identifier};\n`
        );
    }
  };

  const handleCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cleanName) {
      setError('Вкажіть назву файлу / класу');
      return;
    }

    const finalFileName = getFullFileName();
    const alreadyExists = currentFiles.some(
      (f) => f.fileName.toLowerCase() === finalFileName.toLowerCase()
    );

    if (alreadyExists) {
      setError(`Файл "${finalFileName}" вже існує в проєкті`);
      return;
    }

    const content = generateContent();
    onCreate({
      fileName: finalFileName,
      content,
    });
    onClose();
  };

  const renderTypeSelector = () => {
    if (language === 'JAVA') {
      const types: { id: JavaType; label: string; badge: string; color: string }[] = [
        { id: 'CLASS', label: 'Class', badge: 'C', color: '#3574f0' },
        { id: 'RECORD', label: 'Record', badge: 'R', color: '#59a869' },
        { id: 'INTERFACE', label: 'Interface', badge: 'I', color: '#2a8264' },
        { id: 'ENUM', label: 'Enum', badge: 'E', color: '#f5a623' },
        { id: 'EXCEPTION', label: 'Exception', badge: '!', color: '#f75464' },
        { id: 'MAIN', label: 'Main Class', badge: '▶', color: '#59a869' },
      ];

      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '4px',
                background: selectedType === t.id ? '#2e436e' : '#2b2d30',
                border: selectedType === t.id ? '1px solid #3574f0' : '1px solid #393b40',
                color: selectedType === t.id ? '#ffffff' : '#dfe1e5',
                textAlign: 'left',
                fontSize: '11px',
                fontWeight: selectedType === t.id ? 600 : 400,
              }}
            >
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: t.color,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {t.badge}
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      );
    }

    if (language === 'PYTHON') {
      const types: { id: PythonType; label: string; badge: string }[] = [
        { id: 'CLASS', label: 'Class', badge: 'C' },
        { id: 'DATACLASS', label: 'Dataclass', badge: 'D' },
        { id: 'MODULE', label: 'Module / Script', badge: 'M' },
        { id: 'TEST', label: 'Pytest Test', badge: '🧪' },
      ];

      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '6px' }}>
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '4px',
                background: selectedType === t.id ? '#2e436e' : '#2b2d30',
                border: selectedType === t.id ? '1px solid #3574f0' : '1px solid #393b40',
                color: selectedType === t.id ? '#ffffff' : '#dfe1e5',
                fontSize: '11px',
                fontWeight: selectedType === t.id ? 600 : 400,
              }}
            >
              <span>{t.badge}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      );
    }

    if (language === 'TYPESCRIPT') {
      const types: { id: TypeScriptType; label: string; badge: string }[] = [
        { id: 'CLASS', label: 'Class', badge: 'C' },
        { id: 'INTERFACE', label: 'Interface', badge: 'I' },
        { id: 'TYPE', label: 'Type Alias', badge: 'T' },
        { id: 'ENUM', label: 'Enum', badge: 'E' },
        { id: 'TEST', label: 'node:test', badge: '🧪' },
      ];

      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '4px',
                background: selectedType === t.id ? '#2e436e' : '#2b2d30',
                border: selectedType === t.id ? '1px solid #3574f0' : '1px solid #393b40',
                color: selectedType === t.id ? '#ffffff' : '#dfe1e5',
                fontSize: '11px',
                fontWeight: selectedType === t.id ? 600 : 400,
              }}
            >
              <span>{t.badge}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      );
    }

    // JavaScript
    const jsTypes: { id: JavaScriptType; label: string; badge: string }[] = [
      { id: 'CLASS', label: 'Class', badge: 'C' },
      { id: 'MODULE', label: 'Module Function', badge: 'M' },
      { id: 'TEST', label: 'node:test', badge: '🧪' },
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
        {jsTypes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedType(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              borderRadius: '4px',
              background: selectedType === t.id ? '#2e436e' : '#2b2d30',
              border: selectedType === t.id ? '1px solid #3574f0' : '1px solid #393b40',
              color: selectedType === t.id ? '#ffffff' : '#dfe1e5',
              fontSize: '11px',
              fontWeight: selectedType === t.id ? 600 : 400,
            }}
          >
            <span>{t.badge}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        style={{
          width: '500px',
          maxWidth: '100%',
          backgroundColor: '#1e1f22',
          border: '1px solid #393b40',
          borderRadius: '8px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#2b2d30',
            borderBottom: '1px solid #393b40',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={15} color="#3574f0" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#dfe1e5' }}>
              Новий {language === 'JAVA' ? 'файл / тип Java' : `файл ${language}`}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#9da0a8', padding: '2px', borderRadius: '4px' }}
            title="Закрити (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name Field */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '4px' }}>
              Назва файлу / ідентифікатор:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder={language === 'JAVA' ? 'наприклад: UserRecord, PaymentService, Role' : 'наприклад: UserService, config'}
                style={{
                  flex: 1,
                  background: '#2b2d30',
                  border: '1px solid #393b40',
                  borderRadius: '4px',
                  padding: '7px 10px',
                  color: '#dfe1e5',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '12px', color: '#6f737a', fontFamily: 'monospace' }}>
                → {getFullFileName()}
              </span>
            </div>
          </div>

          {/* Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '4px' }}>
              Тип шаблону:
            </label>
            {renderTypeSelector()}
          </div>

          {/* Code Preview */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '4px' }}>
              Попередній перегляд:
            </label>
            <pre
              style={{
                background: '#141517',
                border: '1px solid #2b2d30',
                borderRadius: '4px',
                padding: '8px 10px',
                color: '#dfe1e5',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono, monospace)',
                maxHeight: '100px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}
            >
              {generateContent()}
            </pre>
          </div>

          {/* Error notice */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#47262a',
                color: '#f75464',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                background: '#2b2d30',
                color: '#dfe1e5',
                border: '1px solid #393b40',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              Скасувати
            </button>
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                background: '#3574f0',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <Plus size={13} />
              <span>Створити файл</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
