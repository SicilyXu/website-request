const { requestSites, defaultSiteKey, normalizeSiteKey, getRequestSite } = require('../config/requestSites');

function getSiteKeyFromPathname(pathname) {
  const [firstSegment] = String(pathname || '')
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .filter(Boolean);

  const normalizedKey = normalizeSiteKey(firstSegment);
  return requestSites[normalizedKey] ? normalizedKey : null;
}

function getSiteKeyFromHostname(hostname) {
  const [subdomain] = String(hostname || '').split('.');
  const normalizedKey = normalizeSiteKey(subdomain);
  return requestSites[normalizedKey] ? normalizedKey : null;
}

function resolveSiteKey({ pathname, hostname, siteKey } = {}) {
  const explicitSiteKey = normalizeSiteKey(siteKey);
  if (requestSites[explicitSiteKey]) {
    return explicitSiteKey;
  }

  const routeSiteKey = getSiteKeyFromPathname(pathname);
  if (routeSiteKey) {
    return routeSiteKey;
  }

  const hostSiteKey = getSiteKeyFromHostname(hostname);
  if (hostSiteKey) {
    return hostSiteKey;
  }

  return defaultSiteKey;
}

function resolveSite(input) {
  return getRequestSite(resolveSiteKey(input));
}

module.exports = {
  getSiteKeyFromPathname,
  getSiteKeyFromHostname,
  resolveSiteKey,
  resolveSite,
};
