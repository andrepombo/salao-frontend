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
    console.log(`Analytics: Tracking event - ${category} / ${action} / ${label}`);
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track appointment events
export const trackAppointment = (action, appointmentData) => {
  const clientName = appointmentData.client_name || 'Unknown';
  const services = appointmentData.services_list || 'No services';
  const value = parseFloat(appointmentData.total_price || 0);
  
  trackEvent('Appointment', action, `${clientName} - ${services}`, value);
};

// Track client events
export const trackClient = (action, clientData) => {
  const clientName = clientData.name || 'Unknown';
  trackEvent('Client', action, clientName);
};

// Track team member events
export const trackTeamMember = (action, teamMemberData) => {
  const memberName = teamMemberData.name || 'Unknown';
  const specialtiesCount = teamMemberData.specialties ? teamMemberData.specialties.length : 0;
  trackEvent('Team', action, `${memberName} (${specialtiesCount} especialidades)`);
};

// Track service selection
export const trackServiceSelection = (serviceName, price) => {
  trackEvent('Service', 'Selected', serviceName, price);
};
