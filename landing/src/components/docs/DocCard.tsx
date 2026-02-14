import { Link } from "react-router-dom";

type DocCardProps = {
  title: string;
  href: string;
  children: React.ReactNode;
  icon?: string;
};

export function DocCard({ title, href, children, icon }: DocCardProps) {
  return (
    <Link
      to={href}
      className="block rounded-xl border border-border-medium bg-bg-surface p-5 hover:border-brand-purple/50 hover:bg-bg-elevated transition-all group"
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className="text-2xl opacity-80 group-hover:text-brand-purple-light transition-colors">
            {icon}
          </span>
        )}
        <div>
          <h3 className="font-semibold text-white group-hover:text-brand-purple-light transition-colors">
            {title}
          </h3>
          <p className="text-sm text-text-secondary mt-1">{children}</p>
        </div>
      </div>
    </Link>
  );
}

type DocCardGroupProps = {
  children: React.ReactNode;
  cols?: 2 | 3;
};

export function DocCardGroup({ children, cols = 2 }: DocCardGroupProps) {
  return (
    <div
      className={
        cols === 3
          ? "grid gap-4 grid-cols-1 md:grid-cols-3"
          : "grid gap-4 grid-cols-1 md:grid-cols-2"
      }
    >
      {children}
    </div>
  );
}
