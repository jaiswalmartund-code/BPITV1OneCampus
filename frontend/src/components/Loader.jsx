import React, { useEffect, useState } from 'react';

const Loader = ({ duration = 5000, onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fading out 1000ms before duration ends
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, Math.max(0, duration - 1000));

    // Fully remove after duration ends
    const removeTimer = setTimeout(() => {
      setVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onComplete]);

  if (!visible) return null;

  return (
    <div id="loader-wrapper" className={isFading ? 'loader-hidden' : ''}>
      <div className="loader-container">
        <p className="loader-text">OneCampus</p>
        <div className="line-loader">
          <div className="line-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
