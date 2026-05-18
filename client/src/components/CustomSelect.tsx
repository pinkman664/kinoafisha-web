import React, { useState, useEffect } from 'react';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  style?: React.CSSProperties;
}

export function CustomSelect({ value, onChange, options, placeholder, style }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isOpen]);

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
        }}>
          {selectedOption ? selectedOption.label : placeholder || 'Выберите'}
        </span>
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
            minWidth: '200px',
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
          {options.map(o => (
            <div 
              key={o.value} 
              onClick={() => { onChange(o.value); setIsOpen(false); }}
              style={{ 
                padding: '10px 16px', 
                borderRadius: '10px', 
                cursor: 'pointer',
                background: value === o.value ? 'var(--primary)' : 'transparent',
                color: '#fff',
                fontWeight: value === o.value ? 700 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                textAlign: 'left',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
              onMouseEnter={(e) => { if (value !== o.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { if (value !== o.value) e.currentTarget.style.background = 'transparent'; }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
