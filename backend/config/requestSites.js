const env = require('./env');

const requestSites = {
  warrnambool: {
    siteKey: 'warrnambool',
    displayName: 'Warrnambool',
    websiteUrl: '/warrnambool',
    backgroundImage: '/request-assets/images/warrnambool-bg.jpg',
    backgroundVideo: '/request-assets/videos/warrnambool-bg.mp4',
    logo: '/request-assets/images/warrnambool-logo.png',
    headerLogoMode: 'text',
    requestEmailRecipient: env.MANAGER_EMAIL || 'warrnambool@example.com',
  },
  yarrawonga: {
    siteKey: 'yarrawonga',
    displayName: 'Yarrawonga Mulwala',
    websiteUrl: 'https://www.platypus360.com/Yarrawonga',
    backgroundImage: '/request-assets/images/yarrawonga-bg.jpg',
    backgroundVideo: '/request-assets/videos/yarrawonga-bg.mp4',
    logo: '/request-assets/images/yarrawonga-mulwala-logo.png',
    headerLogoMode: 'image',
    requestEmailRecipient: 'teresa@johnbatman.com.au, jryan@yarrawongamulwala.com.au, sicily@johnbatman.com.au',
  },
};

const defaultSiteKey = 'warrnambool';

function normalizeSiteKey(siteKey) {
  return String(siteKey || '').trim().toLowerCase();
}

function getRequestSite(siteKey) {
  const normalizedKey = normalizeSiteKey(siteKey);
  return requestSites[normalizedKey] || requestSites[defaultSiteKey];
}

module.exports = {
  requestSites,
  defaultSiteKey,
  normalizeSiteKey,
  getRequestSite,
};
