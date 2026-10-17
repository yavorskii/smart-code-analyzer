import React, { useState, useEffect, useRef } from 'react';
import { X, FileCode, Plus, AlertCircle } from 'lucide-react';
import type { CodeFile, ProgrammingLanguage } from '../types/analysis';

interface NewFileDialogProps {
  isOpen: boolean;
  language: ProgrammingLanguage;
  currentFiles: CodeFile[];
  defaultPackage?: string;
  onClose: () => void;
  onCreate: (file: CodeFile) => void;
}

type JavaType = 'CLASS' | 'RECORD' | 'INTERFACE' | 'ENUM' | 'ANNOTATION' | 'EXCEPTION' | 'MAIN';
type PythonType = 'CLASS' | 'DATACLASS' | 'MODULE' | 'TEST';
type TypeScriptType = 'CLASS' | 'INTERFACE' | 'TYPE' | 'ENUM' | 'TEST';
type JavaScriptType = 'CLASS' | 'MODULE' | 'TEST';

export const NewFileDialog: React.FC<NewFileDialogProps> = ({
  isOpen,
  language,
  currentFiles,
  defaultPackage = 'ua.pnu.app',
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<string>('CLASS');
  const [packageName, setPackageName] = useState(defaultPackage);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedType(language === 'JAVA' ? 'CLASS' : language === 'PYTHON' ? 'CLASS' : 'CLASS');
      setPackageName(defaultPackage);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, language, defaultPackage]);

  if (!isOpen) return null;

  const sanitizeIdentifier = (raw: string) => {
    let cleaned = raw.trim();
    // Strip extension if entered by user
    cleaned = cleaned.replace(/\.(java|py|ts|js|tsx|jsx)$/i, '');
    // Replace hyphens or spaces with underscores or CamelCase
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
    const identifier = cleanName || 'NewItem';
    const pkg = packageName.trim() || 'ua.pnu.app';

    if (language === 'JAVA') {
      const header = `package ${pkg};\n\n`;
      switch (selectedType as JavaType) {
        case 'RECORD':
          return (
            header +
            `/**\n * Immutable record component.\n */\n` +
            `public record ${identifier}(\n    String id,\n    String name,\n    double value\n) {\n}\n`
          );
        case 'INTERFACE':
          return (
            header +
            `public interface ${identifier} {\n    void process();\n    String getStatus();\n}\n`
          );
        case 'ENUM':
          return (
            header +
            `public enum ${identifier} {\n    ACTIVE,\n    INACTIVE,\n    PENDING,\n    ARCHIVED\n}\n`
          );
        case 'ANNOTATION':
          return (
            header +
            `import java.lang.annotation.*;\n\n` +
            `@Retention(RetentionPolicy.RUNTIME)\n` +
            `@Target({ElementType.TYPE, ElementType.METHOD})\n` +
            `public @interface ${identifier} {\n    String value() default "";\n}\n`
          );
        case 'EXCEPTION':
          return (
            header +
            `public class ${identifier} extends RuntimeException {\n` +
            `    public ${identifier}(String message) {\n        super(message);\n    }\n\n` +
            `    public ${identifier}(String message, Throwable cause) {\n        super(message, cause);\n    }\n}\n`
          );
        case 'MAIN':
          return (
            header +
            `public class ${identifier} {\n` +
            `    public static void main(String[] args) {\n` +
            `        System.out.println("Execution started in ${identifier}");\n` +
            `    }\n}\n`
          );
        case 'CLASS':
        default:
          return (
            header +
            `public class ${identifier} {\n` +
            `    private String id;\n\n` +
            `    public ${identifier}() {\n    }\n\n` +
            `    public String getId() {\n        return id;\n    }\n` +
            `    public void setId(String id) {\n        this.id = id;\n    }\n}\n`
          );
      }
    }

    if (language === 'PYTHON') {
      switch (selectedType as PythonType) {
        case 'DATACLASS':
          return (
            `from dataclasses import dataclass\n\n` +
            `@dataclass\n` +
            `class ${identifier}:\n` +
            `    id: str\n` +
            `    name: str\n` +
            `    is_active: bool = True\n`
          );
        case 'TEST':
          return (
            `import pytest\n\n` +
            `def test_${identifier.toLowerCase()}_initial_state():\n` +
            `    assert True\n\n` +
            `def test_${identifier.toLowerCase()}_calculation():\n` +
            `    result = 40 + 2\n` +
            `    assert result == 42\n`
          );
        case 'MODULE':
          return (
            `def ${identifier.toLowerCase()}_task():\n` +
            `    print("Task running")\n\n` +
            `if __name__ == '__main__':\n` +
            `    ${identifier.toLowerCase()}_task()\n`
          );
        case 'CLASS':
        default:
          return (
            `class ${identifier}:\n` +
            `    def __init__(self, name: str = "${identifier}"):\n` +
            `        self.name = name\n\n` +
            `    def execute(self) -> str:\n` +
            `        return f"Executing {self.name}"\n`
          );
      }
    }

    if (language === 'TYPESCRIPT') {
      switch (selectedType as TypeScriptType) {
        case 'INTERFACE':
          return (
            `export interface ${identifier} {\n` +
            `    id: string;\n` +
            `    title: string;\n` +
            `    createdAt: Date;\n}\n`
          );
        case 'TYPE':
          return (
            `export type ${identifier} = {\n` +
            `    id: string;\n` +
            `    status: 'PENDING' | 'SUCCESS' | 'FAILED';\n` +
            `    payload?: Record<string, unknown>;\n};\n`
          );
        case 'ENUM':
          return (
            `export enum ${identifier} {\n` +
            `    DEFAULT = 'DEFAULT',\n` +
            `    ACTIVE = 'ACTIVE',\n` +
            `    DISABLED = 'DISABLED',\n}\n`
          );
        case 'TEST':
          return (
            `import { describe, it } from 'node:test';\nimport assert from 'node:assert';\n\n` +
            `describe('${identifier}', () => {\n` +
            `    it('should initialize properly', () => {\n` +
            `        assert.strictEqual(true, true);\n` +
            `    });\n});\n`
          );
        case 'CLASS':
        default:
          return (
            `export class ${identifier} {\n` +
            `    constructor(private readonly name: string = '${identifier}') {}\n\n` +
            `    public run(): string {\n` +
            `        return \`Running \${this.name}\`;\n` +
            `    }\n}\n`
          );
      }
    }

    // JavaScript
    switch (selectedType as JavaScriptType) {
      case 'TEST':
        return (
          `const { test } = require('node:test');\nconst assert = require('node:assert');\n\n` +
          `test('${identifier} behavior', () => {\n` +
          `    assert.strictEqual(1, 1);\n});\n`
        );
      case 'MODULE':
        return (
          `function ${identifier.toLowerCase()}Handler(input) {\n` +
          `    return input ? input.toUpperCase() : '';\n}\n\n` +
          `module.exports = { ${identifier.toLowerCase()}Handler };\n`
        );
      case 'CLASS':
      default:
        return (
          `class ${identifier} {\n` +
          `    constructor(name = '${identifier}') {\n` +
          `        this.name = name;\n` +
          `    }\n\n` +
          `    execute() {\n` +
          `        console.log("Executing " + this.name);\n` +
          `    }\n}\n\n` +
          `module.exports = ${identifier};\n`
        );
    }
  };

  const handleCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cleanName) {
      setError('Будь ласка, вкажіть назву файлу / класу');
      return;
    }

    const finalFileName = getFullFileName();
    const alreadyExists = currentFiles.some(
      (f) => f.fileName.toLowerCase() === finalFileName.toLowerCase()
    );

    if (alreadyExists) {
      setError(`Файл з іменем "${finalFileName}" вже існує в проекті`);
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
        { id: 'RECORD', label: 'Record (Java 21)', badge: 'R', color: '#59a869' },
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
      const types: { id: PythonType; label: string; badge: string; color: string }[] = [
        { id: 'CLASS', label: 'Class', badge: 'C', color: '#3574f0' },
        { id: 'DATACLASS', label: 'Dataclass', badge: 'D', color: '#59a869' },
        { id: 'MODULE', label: 'Module / Script', badge: 'M', color: '#f5a623' },
        { id: 'TEST', label: 'Pytest Test File', badge: '🧪', color: '#59a869' },
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
        { id: 'TEST', label: 'node:test Suite', badge: '🧪' },
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
      { id: 'TEST', label: 'node:test Suite', badge: '🧪' },
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
          width: '540px',
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
              New {language === 'JAVA' ? 'Java File / Type' : `${language} File`}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#9da0a8', padding: '2px', borderRadius: '4px' }}
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name Field */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '4px' }}>
              Name / Identifier:
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
                placeholder={language === 'JAVA' ? 'e.g. OrderRecord, PaymentService, RoleEnum' : 'e.g. UserService, config'}
                style={{
                  flex: 1,
                  background: '#2b2d30',
                  border: '1px solid #393b40',
                  borderRadius: '4px',
                  padding: '6px 10px',
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

          {/* Java Package Field */}
          {language === 'JAVA' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '4px' }}>
                Package:
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="e.g. ua.pnu.shop.service"
                style={{
                  width: '100%',
                  background: '#2b2d30',
                  border: '1px solid #393b40',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  color: '#dfe1e5',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '4px' }}>
              Kind / Type Template:
            </label>
            {renderTypeSelector()}
          </div>

          {/* Code Preview */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '4px' }}>
              Generated Preview:
            </label>
            <pre
              style={{
                background: '#141517',
                border: '1px solid #2b2d30',
                borderRadius: '4px',
                padding: '8px 10px',
                color: '#9da0a8',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                maxHeight: '120px',
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
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
              Cancel
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
              <span>Create File</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
