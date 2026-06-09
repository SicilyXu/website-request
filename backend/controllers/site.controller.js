const { resolveSiteKey } = require('../utils/siteResolver');
const { getRequestSite } = require('../config/requestSites');

function createPublicSiteConfig(site) {
  return {
    siteKey: site.siteKey,
    displayName: site.displayName,
    websiteUrl: site.websiteUrl,
    backgroundImage: site.backgroundImage,
    backgroundVideo: site.backgroundVideo || '',
    logo: site.logo,
    headerLogoMode: site.headerLogoMode || 'text',
  };
}

function getSiteConfig(req, res) {
  const requestedSiteKey = req.params.siteKey || req.query.siteKey;
  const resolvedSiteKey = resolveSiteKey({
    pathname: requestedSiteKey ? `/${requestedSiteKey}` : req.query.pathname,
    hostname: req.hostname,
    siteKey: requestedSiteKey,
  });
  const site = getRequestSite(resolvedSiteKey);
  const fallback = Boolean(requestedSiteKey) && resolvedSiteKey !== String(requestedSiteKey).trim().toLowerCase();

  res.json({
    site: createPublicSiteConfig(site),
    fallback,
    requestedSiteKey: requestedSiteKey || null,
    message: fallback ? 'Unknown Site Configuration' : null,
  });
}

module.exports = {
  getSiteConfig,
  createPublicSiteConfig,
};
