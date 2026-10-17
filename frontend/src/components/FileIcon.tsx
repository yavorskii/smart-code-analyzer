import React from 'react';

interface FileIconProps {
  fileName: string;
  content?: string;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({ fileName, content, size = 14 }) => {
  const lower = fileName.toLowerCase();

  // Test Files across languages
  if (
    lower.endsWith('test.java') ||
    lower.endsWith('tests.java') ||
    lower.startsWith('test_') ||
    lower.endsWith('_test.py') ||
    lower.endsWith('.test.ts') ||
    lower.endsWith('.spec.ts') ||
    lower.endsWith('.test.js')
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="16" height="16" rx="3" fill="#2d4835" />
        <path
          d="M5 8.5L7 10.5L11.5 5.5"
          stroke="#59a869"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Java Files (with smart detection of Record, Interface, Enum, Class)
  if (lower.endsWith('.java')) {
    if (content) {
      if (/\brecord\s+[A-Za-z0-9_]+/.test(content)) {
        // Java 21 Record Badge (R)
        return (
          <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="8" r="7" fill="#295f48" stroke="#368c68" strokeWidth="1" />
            <text
              x="8"
              y="11.2"
              textAnchor="middle"
              fill="#83d9b0"
              fontSize="9"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              R
            </text>
          </svg>
        );
      }
      if (/\binterface\s+[A-Za-z0-9_]+/.test(content)) {
        // Java Interface Badge (I)
        return (
          <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="8" r="7" fill="#1b4d3e" stroke="#2a8264" strokeWidth="1" />
            <text
              x="8"
              y="11.2"
              textAnchor="middle"
              fill="#6ee7b7"
              fontSize="9"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              I
            </text>
          </svg>
        );
      }
      if (/\benum\s+[A-Za-z0-9_]+/.test(content)) {
        // Java Enum Badge (E)
        return (
          <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="8" r="7" fill="#593a17" stroke="#925c23" strokeWidth="1" />
            <text
              x="8"
              y="11.2"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="9"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              E
            </text>
          </svg>
        );
      }
      if (/@interface\s+[A-Za-z0-9_]+/.test(content)) {
        // Java Annotation Badge (@)
        return (
          <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="8" r="7" fill="#4d3e1b" stroke="#82682a" strokeWidth="1" />
            <text
              x="8"
              y="11.2"
              textAnchor="middle"
              fill="#fcd34d"
              fontSize="9"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              @
            </text>
          </svg>
        );
      }
    }

    // Default Java Class Icon (C in blue circle or classic cup)
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" fill="#1e3a5f" stroke="#3574f0" strokeWidth="1" />
        <text
          x="8"
          y="11.2"
          textAnchor="middle"
          fill="#70a5f9"
          fontSize="9"
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
        >
          C
        </text>
      </svg>
    );
  }

  // Python Icon
  if (lower.endsWith('.py')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M7.9 1C5.2 1 5.3 2.2 5.3 2.2V3.4H8V3.8H3.3S1.6 3.6 1.6 6.3c0 2.7 1.5 2.6 1.5 2.6H4.2V7.7c0-1.4 1.2-1.4 1.2-1.4h2.7s1.2 0 1.2-1.2V2.3S9.5 1 7.9 1zM6.5 2c.3 0 .5.2.5.5s-.2.5-.5.5-.5-.2-.5-.5.2-.5.5-.5z"
          fill="#387eb8"
        />
        <path
          d="M8.1 15c2.7 0 2.6-1.2 2.6-1.2v-1.2H8v-.4h4.7s1.7.2 1.7-2.5c0-2.7-1.5-2.6-1.5-2.6h-1.1v1.2c0 1.4-1.2 1.4-1.2 1.4H7.9s-1.2 0-1.2 1.2v2.8s-.2 1.3 1.4 1.3zm1.4-1c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z"
          fill="#ffe052"
        />
      </svg>
    );
  }

  // TypeScript Icon
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="16" height="16" rx="2.5" fill="#3178c6" />
        <text
          x="8"
          y="11.2"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5px"
        >
          TS
        </text>
      </svg>
    );
  }

  // JavaScript Icon
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="16" height="16" rx="2.5" fill="#f7df1e" />
        <text
          x="8"
          y="11.2"
          textAnchor="middle"
          fill="#000000"
          fontSize="8"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5px"
        >
          JS
        </text>
      </svg>
    );
  }

  // Default File Icon
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="#868a91"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M3 2h7l4 4v8H3V2z" />
      <path d="M10 2v4h4" />
    </svg>
  );
};
