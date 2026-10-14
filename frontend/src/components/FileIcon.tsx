import React from 'react';

interface FileIconProps {
  fileName: string;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({ fileName, size = 14 }) => {
  const lower = fileName.toLowerCase();

  // Java Coffee Cup Icon
  if (lower.endsWith('.java')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Steam */}
        <path
          d="M5.5 1.5C5 2.5 6 3.2 5.5 4.5"
          stroke="#f59e0b"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M8.5 1C8 2.2 9 3 8.5 4.2"
          stroke="#f59e0b"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M11.5 1.5C11 2.5 12 3.2 11.5 4.5"
          stroke="#f59e0b"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        {/* Cup Body */}
        <path
          d="M3 5.5H12V10.5C12 12.2 10.7 13.5 9 13.5H6C4.3 13.5 3 12.2 3 10.5V5.5Z"
          fill="#e65100"
        />
        {/* Cup Inner shading */}
        <path
          d="M3.5 6H11.5V9.5C11.5 11 10.3 12.2 8.8 12.2H6.2C4.7 12.2 3.5 11 3.5 9.5V6Z"
          fill="#ff6d00"
        />
        {/* Handle */}
        <path
          d="M12 7H13.2C14 7 14.7 7.7 14.7 8.5C14.7 9.3 14 10 13.2 10H12"
          stroke="#ff6d00"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Saucer */}
        <path
          d="M2 14.5C2 14 3.5 14 8 14C12.5 14 14 14 14 14.5C14 15 12.5 15.5 8 15.5C3.5 15.5 2 15 2 14.5Z"
          fill="#d84315"
        />
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
