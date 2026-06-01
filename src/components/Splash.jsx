import React from 'react';

export default function Splash({ phase = 'enter' }) {
  return (
    <div 
      className={`splash splash-${phase}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--primary)',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div 
          className="splash-logo"
          style={{
            width: '180px',
            height: '180px',
            margin: '0 auto 20px',
            backgroundImage: 'url(/logo.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '86%',
            opacity: phase === 'exit' ? 0 : 1,
            animation: phase === 'enter' ? 'splashPulse 1.2s ease-in-out' : 'splashExit 0.8s ease-out',
          }}
        />
        <div style={{
          fontSize: '24px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          marginTop: '20px',
          letterSpacing: '0.05em',
        }}>
          NCF Blockchain Grade System
        </div>
      </div>
    </div>
  );
}
