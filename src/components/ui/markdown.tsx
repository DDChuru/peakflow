import React from 'react';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  // Parse markdown to HTML
  const parseMarkdown = (text: string): string => {
    let html = text;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-3 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-4 mb-3">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // Lists with emojis
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4">$2</li>');

    // Wrap lists
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-none space-y-1 my-2">$1</ul>');

    // Checkboxes
    html = html.replace(/✅/g, '<span class="text-green-600">✅</span>');
    html = html.replace(/❌/g, '<span class="text-red-600">❌</span>');
    html = html.replace(/💡/g, '<span class="text-yellow-600">💡</span>');

    // Line breaks
    html = html.replace(/\n\n/g, '<br/><br/>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  };

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
