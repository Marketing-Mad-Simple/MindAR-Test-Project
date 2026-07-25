window.XR_CONFIG = {
  brand: {
    name:         'DLF',
    tagline:      'Luxury Residences',
    primaryColor: '#1f1a17',
    accentColor:  '#c9a84c',
  },

  model: {
    path:  '../models/Building.glb',
    scale: 0.05,
  },

  // Virtual billboard dimensions (world units ≈ metres).
  // yCenter = height of the billboard's centre above the floor.
  billboard: {
    width:   0.55,
    height:  0.78,   // ~1.42 aspect (portrait)
    yCenter: 0.39,   // bottom sits at y = 0 (floor level)
  },

  website: {
    // Swap back to the real site URL once the client provides an embeddable page.
    // Most production sites block iframes via X-Frame-Options — Wikipedia is used
    // here to verify the panel itself works before chasing the embedding issue.
    url: 'https://en.m.wikipedia.org/wiki/DLF_Limited',
  },

  enquiry: {
    phone:            '+91 9999999999',
    whatsapp:         '+91 9999999999',
    whatsappMessage:  'Hi, I would like to know more about DLF properties.',
  },
};
