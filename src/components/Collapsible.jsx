import { useState } from 'react';

const STORAGE_KEY = 'gfm_collapsed';

function getCollapsed() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function Collapsible({ id, title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(() => {
    const saved = getCollapsed();
    return id in saved ? saved[id] : defaultOpen;
  });

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      const saved = getCollapsed();
      saved[id] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      return next;
    });
  };

  return (
    <div className={`collapsible ${open ? 'open' : 'closed'}`}>
      <button className="collapsible-header" onClick={toggle} type="button">
        <span className="collapsible-title">{title}</span>
        <svg
          className="collapsible-chevron"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}
