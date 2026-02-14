export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-bg-surface border border-border-medium p-4 overflow-x-auto text-sm text-text-secondary my-4">
      <code>{children}</code>
    </pre>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-bg-surface px-1.5 py-0.5 text-sm font-mono text-brand-purple-light">
      {children}
    </code>
  );
}
