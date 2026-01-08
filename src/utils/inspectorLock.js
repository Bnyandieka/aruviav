/**
 * Inspector Lock Utility
 * Disables developer tools access similar to Facebook and Instagram
 */

export const initInspectorLock = () => {
  // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+Shift+K
  document.addEventListener('keydown', (e) => {
    // F12 - Developer Tools
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I - Inspect Element
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+C - Inspect Element (Alternative)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+J - Developer Console
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+K - Developer Console (Alternative)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 75) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+M - Responsive Design Mode
    if (e.ctrlKey && e.shiftKey && e.keyCode === 77) {
      e.preventDefault();
      return false;
    }
  });

  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Detect if DevTools is open via console timing
  let devtools = { open: false, orientation: null };
  const threshold = 160;

  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        handleDevToolsOpen();
      }
    } else {
      devtools.open = false;
    }
  }, 500);

  // Alternative detection method using console.log
  const originalLog = console.log;
  console.log = function (...args) {
    handleDevToolsOpen();
    return originalLog.apply(console, args);
  };

  // Disable console methods
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};

  // Override debugger
  setInterval(() => {
    debugger;
  }, 100);
};

function handleDevToolsOpen() {
  // Option 1: Redirect to home
  // window.location.href = '/';

  // Option 2: Show warning (uncomment if needed)
  // alert('Developer tools are not allowed on this page.');

  // Option 3: Disable input (uncomment if needed)
  // document.body.style.pointerEvents = 'none';

  // Option 4: Just log (silent mode - recommended for production)
  // console.warn('Developer tools detected');
}

export default initInspectorLock;
