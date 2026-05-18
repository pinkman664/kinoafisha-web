import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = 'alert' | 'confirm';

interface ModalOptions {
  message: string;
  type: ModalType;
  title?: string;
  okText?: string;
  cancelText?: string;
  alertType?: 'info' | 'error' | 'success' | 'warning';
  resolve: (value: boolean) => void;
}

interface ModalContextType {
  showAlert: (message: string, alertType?: 'info' | 'error' | 'success' | 'warning', title?: string) => Promise<boolean>;
  showConfirm: (message: string, title?: string, okText?: string, cancelText?: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ModalOptions | null>(null);

  const showAlert = (
    message: string,
    alertType: 'info' | 'error' | 'success' | 'warning' = 'info',
    title?: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        message,
        type: 'alert',
        title: title || (alertType === 'error' ? 'Ошибка' : alertType === 'success' ? 'Успешно' : 'Внимание'),
        alertType,
        okText: 'ОК',
        resolve,
      });
    });
  };

  const showConfirm = (
    message: string,
    title = 'Подтверждение',
    okText = 'Да',
    cancelText = 'Нет'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        message,
        type: 'confirm',
        title,
        okText,
        cancelText,
        resolve,
      });
    });
  };

  const handleOk = () => {
    if (modal) {
      modal.resolve(true);
      setModal(null);
    }
  };

  const handleCancel = () => {
    if (modal) {
      modal.resolve(false);
      setModal(null);
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal && (
        <div style={backdropStyle}>
          <div style={modalStyle}>
             
            <div style={headerStyle}>
              <span style={iconStyle(modal.alertType || 'warning')}>
                {modal.alertType === 'success' ? '✅' : modal.alertType === 'error' ? '❌' : modal.type === 'confirm' ? '❓' : '⚠️'}
              </span>
              <h3 style={titleStyle}>{modal.title}</h3>
            </div>
             
            <div style={messageStyle}>
              {modal.message}
            </div>
             
            <div style={footerStyle}>
              {modal.type === 'confirm' && (
                <button className="btn btn--outline" style={{ minWidth: '100px' }} onClick={handleCancel}>
                  {modal.cancelText}
                </button>
              )}
              <button className="btn" style={{ minWidth: '100px' }} onClick={handleOk}>
                {modal.okText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

// Styles
const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(3, 7, 18, 0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 99999,
  animation: 'fadeIn 0.25s ease-out forwards',
};

const modalStyle: React.CSSProperties = {
  width: 'calc(100% - 40px)',
  maxWidth: '440px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  borderRadius: '24px',
  padding: '32px',
  color: 'var(--text-main)',
  fontFamily: 'var(--font-main)',
  animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '20px',
};

const iconStyle = (alertType: string): React.CSSProperties => ({
  fontSize: '1.8rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '14px',
  background: alertType === 'success' 
    ? 'rgba(16, 185, 129, 0.1)' 
    : alertType === 'error' 
      ? 'rgba(244, 63, 94, 0.1)' 
      : 'rgba(251, 191, 36, 0.1)',
  border: `1px solid ${alertType === 'success' 
    ? 'rgba(16, 185, 129, 0.2)' 
    : alertType === 'error' 
      ? 'rgba(244, 63, 94, 0.2)' 
      : 'rgba(251, 191, 36, 0.2)'}`,
});

const titleStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  fontWeight: 700,
  fontFamily: 'var(--font-title)',
  color: '#fff',
};

const messageStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  lineHeight: 1.6,
  color: 'var(--text-muted)',
  marginBottom: '28px',
  whiteSpace: 'pre-wrap',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
};
