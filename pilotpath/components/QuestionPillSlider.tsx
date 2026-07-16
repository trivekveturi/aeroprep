'use client';
import { useRef, useEffect } from 'react';

type PillStatus = 'unanswered' | 'current' | 'answered' | 'wrong' | 'flagged';

interface QuestionPillSliderProps {
  total: number;
  current: number;
  getStatus: (idx: number) => PillStatus;
  onSelect: (idx: number) => void;
}

export default function QuestionPillSlider({
  total, current, getStatus, onSelect
}: QuestionPillSliderProps) {
  const rowRef    = useRef<HTMLDivElement>(null);
  const pillRefs  = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-scroll so the current pill is always visible
  useEffect(() => {
    const pill = pillRefs.current[current];
    const row  = rowRef.current;
    if (!pill || !row) return;
    const pillLeft  = pill.offsetLeft;
    const pillRight = pillLeft + pill.offsetWidth;
    const rowLeft   = row.scrollLeft;
    const rowRight  = rowLeft + row.offsetWidth;
    if (pillLeft < rowLeft + 40)        row.scrollLeft = pillLeft - 40;
    else if (pillRight > rowRight - 40) row.scrollLeft = pillRight - row.offsetWidth + 40;
  }, [current]);

  function scrollBy(delta: number) {
    if (rowRef.current) rowRef.current.scrollLeft += delta;
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      background: 'var(--navy-mid)', borderBottom: '1px solid var(--border)',
      padding: '8px 0', userSelect: 'none',
    }}>
      {/* Prev arrow */}
      <button
        onClick={() => scrollBy(-200)}
        aria-label="Scroll left"
        style={{
          flexShrink: 0, width: 32, height: 36,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          borderRight: '1px solid var(--border)',
        }}
      >‹</button>

      {/* Scrollable pill row */}
      <div
        ref={rowRef}
        style={{
          flex: 1, display: 'flex', gap: 4,
          overflowX: 'auto', scrollBehavior: 'smooth',
          padding: '0 8px', scrollbarWidth: 'none',
        }}
      >
        {Array.from({ length: total }, (_, idx) => {
          const status = getStatus(idx);
          return (
            <button
              key={idx}
              ref={el => { pillRefs.current[idx] = el; }}
              onClick={() => onSelect(idx)}
              aria-label={`Question ${idx + 1}`}
              aria-current={idx === current ? 'true' : undefined}
              style={{
                flexShrink: 0,
                width: 30, height: 30,
                borderRadius: 6,
                border: '1px solid transparent',
                fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.12s',
                ...pillStyle(status),
              }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Next arrow */}
      <button
        onClick={() => scrollBy(200)}
        aria-label="Scroll right"
        style={{
          flexShrink: 0, width: 32, height: 36,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          borderLeft: '1px solid var(--border)',
        }}
      >›</button>
    </div>
  );
}

function pillStyle(status: PillStatus): React.CSSProperties {
  switch (status) {
    case 'current':
      return {
        background: '#1B6CA8', color: '#fff',
        borderColor: '#1B6CA8',
        boxShadow: '0 0 10px rgba(27,108,168,0.5)',
      };
    case 'answered':
      return {
        background: 'rgba(0,212,170,0.15)', color: '#00D4AA',
        borderColor: 'rgba(0,212,170,0.4)',
      };
    case 'wrong':
      return {
        background: 'rgba(255,77,106,0.15)', color: '#FF4D6A',
        borderColor: 'rgba(255,77,106,0.35)',
      };
    case 'flagged':
      return {
        background: 'rgba(245,166,35,0.15)', color: '#F5A623',
        borderColor: 'rgba(245,166,35,0.35)',
      };
    default: // unanswered
      return {
        background: 'var(--navy-card)', color: 'var(--muted)',
        borderColor: 'var(--border)',
      };
  }
}
