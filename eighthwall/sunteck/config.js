window.XR_CONFIG = {
  brand: {
    name:         'Sunteck Realty',
    tagline:      'Luxury Residences · Mumbai',
    primaryColor: '#0d0d0d',
    accentColor:  '#e7932a',
  },

  model: {
    path:  '../models/Building.glb',
    scale: 0.05,
  },

  // Virtual billboard dimensions (world units ≈ metres).
  // yCenter = height of the billboard's centre above the floor.
  billboard: {
    width:   0.8,
    height:  1.2,
    yCenter: 0.6,
  },

  website: {
    url: 'https://www.sunteckindia.com/',
  },

  brochure: {
    path:  'brochures/Sunteck-Brochure.pdf',
    // Page scale relative to panel width.
    // 1.0 = fill panel width exactly (page fits without scrolling if portrait).
    // Increase (e.g. 1.4) to zoom in — page becomes scrollable vertically.
    scale: 1.4,
  },

  enquiry: {
    phone:            '+91 9999999999',
    whatsapp:         '+91 9999999999',
    whatsappMessage:  'Hi, I would like to know more about Sunteck Realty properties.',
  },
};
