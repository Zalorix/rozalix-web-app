import { Fragment, type ReactNode } from "react";

// Minimal markdown renderer for the CMS preview — supports the subset
// used by legal pages: ## / ### headings, - bullet lists, paragraphs,
// and inline **bold** / _italic_. No external dependency.

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Split on **bold** and _italic_ while keeping delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  parts.forEach((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      nodes.push(<strong key={key}>{part.slice(2, -2)}</strong>);
    } else if (/^_[^_]+_$/.test(part)) {
      nodes.push(<em key={key}>{part.slice(1, -1)}</em>);
    } else if (part) {
      nodes.push(<Fragment key={key}>{part}</Fragment>);
    }
  });
  return nodes;
}

export function renderMarkdown(src: string): ReactNode {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!list.length) return;
    const items = list;
    blocks.push(
      <ul
        key={`ul-${key++}`}
        className="my-3 list-disc space-y-1.5 pl-5 text-[var(--color-slate-700)]"
      >
        {items.map((item, i) => (
          <li key={i}>{inline(item, `li-${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h-${key++}`} className="mt-5 mb-1.5 text-base font-semibold">
          {inline(line.slice(4), `h3-${key}`)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h-${key++}`} className="mt-6 mb-2 text-lg font-semibold">
          {inline(line.slice(3), `h2-${key}`)}
        </h2>,
      );
    } else {
      blocks.push(
        <p key={`p-${key++}`} className="my-2.5 leading-relaxed text-[var(--color-slate-700)]">
          {inline(line, `p-${key}`)}
        </p>,
      );
    }
  }
  flushList();

  return <div>{blocks}</div>;
}
