import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="Caminho de navegação">
      <Link to="/" className="breadcrumb-item">
        Painel geral
      </Link>
      {items.map((item, idx) => (
        <span key={idx} className="breadcrumb-segment">
          <span className="breadcrumb-sep" aria-hidden="true">
            ›
          </span>
          {item.to ? (
            <Link to={item.to} className="breadcrumb-item">
              {item.label}
            </Link>
          ) : (
            <span className="breadcrumb-item breadcrumb-current" aria-current="page">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
