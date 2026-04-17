/**
 * Dark Mode Toggle
 * Saves preference to localStorage
 * Respects system preference if no saved preference
 */

(function() {
  const DARK_MODE_KEY = 'akari-dark-mode';
  const DARK_CLASS = 'dark';

  // Get saved preference or default to 'auto'
  function getPreference() {
    return localStorage.getItem(DARK_MODE_KEY) || 'auto';
  }

  // Check if system prefers dark mode
  function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Apply dark mode based on preference
  function applyDarkMode() {
    const preference = getPreference();
    const isDark = preference === 'dark' || (preference === 'auto' && systemPrefersDark());

    if (isDark) {
      document.documentElement.classList.add(DARK_CLASS);
    } else {
      document.documentElement.classList.remove(DARK_CLASS);
    }
  }

  // Apply immediately on load (prevents flash)
  applyDarkMode();

  // Setup toggle button when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('dark-mode-toggle');

    if (toggleButton) {
      toggleButton.addEventListener('click', function() {
        const currentPreference = getPreference();
        const isCurrentlyDark = document.documentElement.classList.contains(DARK_CLASS);

        // Toggle preference
        if (isCurrentlyDark) {
          localStorage.setItem(DARK_MODE_KEY, 'light');
        } else {
          localStorage.setItem(DARK_MODE_KEY, 'dark');
        }

        applyDarkMode();
      });
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (getPreference() === 'auto') {
        applyDarkMode();
      }
    });
  });
})();
