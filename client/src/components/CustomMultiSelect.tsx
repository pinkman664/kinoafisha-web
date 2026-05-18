import React, { useState, useEffect } from 'react';

interface Option {
  value: number;
  label: string;
}

interface CustomMultiSelectProps {
  selectedValues: number[];
  onChange: (values: number[]) => void;
  options: Option[];
  placeholder: string;
  style?: React.CSSProperties;
}

export function CustomMultiSelect({ selectedValues, onChange, options, placeholder, style }: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isOpen]);

  const toggleOption = (val: number) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const displayText = selectedValues.length === 0 
    ? placeholder 
    : `${placeholder} (${selectedValues.length})`;

  return (
    <div style={{ position: 'relative', width: '100%', ...style }} onClick={e => e.stopPropagation()}>
      <div 
        className="input-field" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingRight: '16px'
        }}
      >
        <span style={{ 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          marginRight: '8px',
          flex: 1,
          textAlign: 'left'
        }}>{displayText}</span>
        <span style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
          transition: 'transform 0.2s', 
          fontSize: '0.8rem',
          opacity: 0.7
        }}>▼</span>
      </div>
      {isOpen && (
        <div 
          className="glass" 
          style={{ 
            position: 'absolute', 
            top: 'calc(100% + 8px)', 
            left: 0, 
            width: '100%', 
            minWidth: '220px',
            borderRadius: '16px', 
            padding: '8px', 
            zIndex: 1000,
            boxShadow: 'var(--shadow-premium)',
            display: 'grid',
            gap: '4px',
            background: '#0d1527',
            border: '1px solid var(--glass-border)'
          }}
        >
          {options.map(o => {
            const isSelected = selectedValues.includes(o.value);
            return (
              <div 
                key={o.value} 
                onClick={() => toggleOption(o.value)}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: '#fff',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{o.label}</span>
                {isSelected && <span style={{ fontSize: '0.85rem' }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
