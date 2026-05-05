import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  name: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <span className="breadcrumb-sep" aria-hidden="true">›</span>
          {item.path && i < items.length - 1 ? (
            <Link to={item.path}>{item.name}</Link>
          ) : (
            <span className="breadcrumb-current" aria-current={i === items.length - 1 ? 'page' : undefined}>
              {item.name}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
