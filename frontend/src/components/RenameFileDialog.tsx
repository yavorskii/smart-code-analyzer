import React, { useState, useEffect, useRef } from 'react';
import { X, Edit2, AlertCircle } from 'lucide-react';
import type { CodeFile } from '../types/analysis';

interface RenameFileDialogProps {
  isOpen: boolean;
  currentFileName: string;
  currentFiles: CodeFile[];
  onClose: () => void;
  onRename: (oldName: string, newName: string) => void;
}

export const RenameFileDialog: React.FC<RenameFileDialogProps> = ({
  isOpen,
  currentFileName,
  currentFiles,
  onClose,
  onRename,
}) => {
  const [newName, setNewName] = useState(currentFileName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentFileName);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentFileName]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Ім\'я файлу не може бути порожнім');
      return;
    }

    if (trimmed === currentFileName) {
      onClose();
      return;
    }

    const exists = currentFiles.some(
      (f) => f.fileName.toLowerCase() === trimmed.toLowerCase() && f.fileName !== currentFileName
    );

    if (exists) {
      setError(`Файл з назвою "${trimmed}" вже існує в проекті`);
      return;
    }

    onRename(currentFileName, trimmed);
    onClose();
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
          width: '420px',
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
            <Edit2 size={14} color="#3574f0" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#dfe1e5' }}>
              Rename File
            </span>
          </div>
          <button onClick={onClose} style={{ color: '#9da0a8', padding: '2px' }} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9da0a8', marginBottom: '4px' }}>
              New file name:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(null);
              }}
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
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '6px 16px',
                background: '#3574f0',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
