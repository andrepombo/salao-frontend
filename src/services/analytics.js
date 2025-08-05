// Google Analytics service for tracking website visits
export const initializeAnalytics = () => {
  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=G-H0X01F0GPW`;
  document.head.appendChild(script);

  // Initialize Google Analytics
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', 'G-H0X01F0GPW');
};

// Track page views
export const trackPageView = (path) => {
  if (window.gtag) {
    window.gtag('config', 'G-H0X01F0GPW', {
      page_path: path,
    });
  }
};

// Track events (e.g., button clicks, form submissions)
export const trackEvent = (category, action, label = null, value = null) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
