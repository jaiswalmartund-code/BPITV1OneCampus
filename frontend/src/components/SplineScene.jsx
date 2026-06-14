import React, { useEffect, useRef, useState } from 'react';

const SplineScene = ({ url = "https://prod.spline.design/1RYNa4tK0YWd7b7C/scene.splinecode" }) => {
  const viewerRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay mounting the spline-viewer by 2500ms.
    // This allows the loading screen progress bar to animate smoothly for the 
    // first half of the loading sequence before shader compilation starts.
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 2500);

    return () => clearTimeout(mountTimer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Inject spline script if it doesn't exist yet
    if (!document.querySelector('script[src*="spline-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://cdn.jsdelivr.net/npm/@splinetool/viewer@1.0.28/build/spline-viewer.js';
      script.defer = true;
      document.head.appendChild(script);
    }

    const injectSplineStyles = () => {
      const viewer = viewerRef.current;
      if (viewer && viewer.shadowRoot) {
        if (viewer.shadowRoot.querySelector('#custom-spline-override')) {
          return true;
        }
        const style = document.createElement('style');
        style.id = 'custom-spline-override';
        style.textContent = `
          #logo, #loader, #hint, .hand, [id*="logo"], [id*="hint"], [id*="loader"] {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `;
        viewer.shadowRoot.appendChild(style);
        console.log("OneCampus: Successfully injected style override into Spline Shadow DOM.");
        return true;
      }
      return false;
    };

    // Poll to inject styles when the Shadow Root is ready
    const injectTimer = setInterval(() => {
      if (injectSplineStyles()) {
        clearInterval(injectTimer);
      }
    }, 100);

    const preventScrollZoom = (e) => {
      if (!e.ctrlKey) {
        // Allow page scrolling, prevent 3D zoom unless CTRL is held
        return true;
      }
    };

    const viewer = viewerRef.current;
    if (viewer) {
      viewer.addEventListener('wheel', preventScrollZoom, { passive: true });
    }

    return () => {
      clearInterval(injectTimer);
      if (viewer) {
        viewer.removeEventListener('wheel', preventScrollZoom);
      }
    };
  }, [mounted]);

  return (
    <div className="spline-container">
      {mounted && (
        <spline-viewer
          ref={viewerRef}
          url={url}
          hint="hidden"
          unload-hint="true"
          unload-loader="true"
          aria-hidden="true"
          tabIndex="-1"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      )}
    </div>
  );
};

export default SplineScene;
