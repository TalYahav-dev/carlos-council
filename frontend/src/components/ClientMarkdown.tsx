'use client';

import { useMemo } from 'react';
import { micromark } from 'micromark';

interface ClientMarkdownProps {
  text: string;
}

export default function ClientMarkdown({ text }: ClientMarkdownProps) {
  const safeText = typeof text === 'string' ? text : String(text ?? '');
  const html = useMemo(() => micromark(safeText), [safeText]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
