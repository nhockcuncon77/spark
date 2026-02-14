type DocCalloutProps = {
  type?: "info" | "warning" | "success";
  emoji?: string;
  children: React.ReactNode;
};

const styles = {
  info: "border-[var(--info)] bg-[color:var(--info)]/10 text-text-secondary",
  warning: "border-[var(--warning)] bg-[color:var(--warning)]/10 text-text-secondary",
  success: "border-[var(--success)] bg-[color:var(--success)]/10 text-text-secondary",
};

export const DocCallout = ({
  type = "info",
  emoji,
  children,
}: DocCalloutProps) => (
  <div
    className={`rounded-lg border px-4 py-3 my-4 ${styles[type]}`}
  >
    <div className="flex gap-3">
      {emoji && <span className="text-lg">{emoji}</span>}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);
