/* ============================================================
   CustomModal.jsx — Reusable custom modal component
   ============================================================ */
import React from 'react';

export default function CustomModal({
  isOpen = false,
  title = '',
  icon = '',
  children,
  actions = [], // Array of { label, onClick, variant: 'primary'|'secondary'|'danger' }
  onClose,
  size = 'medium', // 'small' | 'medium' | 'large'
}) {
  if (!isOpen) return null;

  const sizeClass = {
    small: 'modal-small',
    medium: 'modal-medium',
    large: 'modal-large',
  }[size] || 'modal-medium';

  return (
    <div className="modal-bg open">
      <div className={`modal ${sizeClass}`}>
        <div className="modal-hdr">
          <h3>
            {icon && <i className={`ti ${icon}`} style={{ marginRight: 8 }} />}
            {title}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {actions.length > 0 && (
          <div className="modal-actions">
            {actions.map((action, i) => {
              const variantClass = {
                primary: 'btn pri',
                secondary: 'btn',
                danger: 'btn danger',
              }[action.variant] || 'btn';

              return (
                <button
                  key={i}
                  className={variantClass}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon && <i className={`ti ${action.icon}`} style={{ marginRight: 6 }} />}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
