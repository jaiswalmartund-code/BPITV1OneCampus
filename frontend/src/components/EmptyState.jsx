import React from 'react';

/**
 * EmptyState — shown when there's no data or an error occurred.
 * Uses the cute 404-owl image.
 *
 * Props:
 *   title   — headline text  (default: "Nothing here yet")
 *   message — subtext        (optional)
 *   compact — smaller sizing (optional bool)
 */
const EmptyState = ({ title = 'Nothing here yet', message = '', compact = false }) => {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        compact ? '32px 16px' : '64px 24px',
      textAlign:      'center',
      width:          '100%',
    }}>
      <img
        src="/empty-owl.png"
        alt="No data"
        style={{
          width:        compact ? '100px' : '160px',
          height:       'auto',
          marginBottom: compact ? '12px' : '20px',
          opacity:      0.92,
          filter:       'drop-shadow(0 8px 24px rgba(0,0,0,0.18))',
          animation:    'owlFloat 3s ease-in-out infinite',
        }}
        draggable={false}
      />
      <p style={{
        fontSize:     compact ? '14px' : '16px',
        fontWeight:   700,
        color:        'var(--text-primary, #fff)',
        margin:       '0 0 6px 0',
        letterSpacing: '-0.2px',
      }}>
        {title}
      </p>
      {message && (
        <p style={{
          fontSize: compact ? '12px' : '13px',
          color:    'var(--text-secondary, rgba(255,255,255,0.5))',
          margin:   0,
          maxWidth: '280px',
          lineHeight: 1.5,
        }}>
          {message}
        </p>
      )}

      {/* Floating animation keyframes injected once */}
      <style>{`
        @keyframes owlFloat {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-10px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
};

export default EmptyState;
