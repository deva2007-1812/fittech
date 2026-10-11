import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '../../utils/helpers';

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  isUser = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'markdown-content text-sm leading-relaxed break-words',
        isUser ? 'text-white' : 'text-neutral-800 dark:text-neutral-100',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong
              className={cn(
                'font-bold',
                isUser ? 'text-white font-extrabold' : 'text-neutral-900 dark:text-neutral-50'
              )}
            >
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => (
            <h1 className="text-base font-bold mt-3 mb-1.5 first:mt-0 text-emerald-800 dark:text-emerald-300">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold mt-2.5 mb-1 first:mt-0 text-emerald-700 dark:text-emerald-400">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0 text-emerald-600 dark:text-emerald-400">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 mb-2 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 mb-2 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          hr: () => (
            <hr
              className={cn(
                'my-2.5',
                isUser
                  ? 'border-white/20'
                  : 'border-neutral-200 dark:border-neutral-700'
              )}
            />
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                'border-l-2 pl-3 my-2 italic text-xs leading-relaxed',
                isUser
                  ? 'border-white/50 text-white/90'
                  : 'border-emerald-500 text-neutral-600 dark:text-neutral-300'
              )}
            >
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-mono font-medium',
                    isUser
                      ? 'bg-emerald-700/60 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400'
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-2.5 my-2 rounded-lg bg-neutral-900 text-neutral-100 text-xs font-mono overflow-x-auto">
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded border border-neutral-200 dark:border-neutral-700">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-2.5 py-1.5 text-left font-semibold bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-1.5 border-t border-neutral-100 dark:border-neutral-800">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'underline hover:opacity-80 transition-opacity',
                isUser ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
