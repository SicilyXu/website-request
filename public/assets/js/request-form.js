'use strict';

let currentStep = 1;
const totalSteps = 3;
const runtimeConfig = window.REQUEST_PORTAL_CONFIG || {};
const API_BASE = String(runtimeConfig.apiBaseUrl || '').replace(/\/+$/, '') ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://apis.platypus360.com');

const siteDefaults = {
  warrnambool: {
    siteKey: 'warrnambool',
    displayName: 'Warrnambool',
    websiteUrl: '/warrnambool',
    backgroundImage: '/assets/images/warrnambool-bg.jpg',
    backgroundVideo: '/assets/videos/warrnambool-bg.mp4',
    logo: '/assets/images/warrnambool-logo.png',
    headerLogoMode: 'text',
  },
  yarrawonga: {
    siteKey: 'yarrawonga',
    displayName: 'Yarrawonga Mulwala',
    websiteUrl: 'https://www.platypus360.com/Yarrawonga',
    backgroundImage: '/assets/images/yarrawonga-bg.jpg',
    backgroundVideo: '/assets/videos/yarrawonga-bg.mp4',
    logo: '/assets/images/yarrawonga-mulwala-logo.png',
    headerLogoMode: 'image',
  },
};

let currentSite = siteDefaults.warrnambool;

function getSiteFromRoute() {
  const [firstSegment] = window.location.pathname.split('/').filter(Boolean);
  if (firstSegment) {
    return firstSegment;
  }

  const [subdomain] = window.location.hostname.split('.');
  if (subdomain && !['www', 'localhost', '127', '0'].includes(subdomain)) {
    return subdomain;
  }

  return currentSite.siteKey;
}

function getInitialSiteFromRoute() {
  const siteKey = String(getSiteFromRoute() || '').toLowerCase();
  return siteDefaults[siteKey] || siteDefaults.warrnambool;
}

async function loadSiteConfig() {
  const requestedSiteKey = getSiteFromRoute();

  try {
    const response = await fetch(`${API_BASE}/api/site-config/${encodeURIComponent(requestedSiteKey)}`);
    const data = await response.json();
    currentSite = data.site || currentSite;
    applySiteConfig(currentSite);

    if (data.fallback) {
      showSiteWarning(data.message || 'Unknown Site Configuration');
    }
  } catch {
    applySiteConfig(currentSite);
    showSiteWarning('Unknown Site Configuration');
  }
}

function applySiteConfig(site) {
  document.title = `${site.displayName} Business Request Form`;

  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute(
      'content',
      `Register your business or store to join our services in the ${site.displayName} region.`
    );
  }

  document.documentElement.style.setProperty('--hero-image', `url(${site.backgroundImage})`);
  applyBackgroundVideo(site);

  const displayNameEl = document.getElementById('siteDisplayName');
  const headerLogoEl = document.getElementById('siteHeaderLogo');
  const useImageLogo = site.headerLogoMode === 'image' && site.logo;

  if (displayNameEl) {
    displayNameEl.textContent = site.displayName;
    displayNameEl.classList.toggle('hidden', useImageLogo);
  }

  if (headerLogoEl) {
    if (useImageLogo) {
      headerLogoEl.src = site.logo;
      headerLogoEl.alt = site.displayName;
      headerLogoEl.classList.remove('hidden');
    } else {
      headerLogoEl.removeAttribute('src');
      headerLogoEl.alt = '';
      headerLogoEl.classList.add('hidden');
    }
  }

  const regionLabelEl = document.getElementById('siteRegionLabel');
  if (regionLabelEl) {
    regionLabelEl.textContent = site.displayName;
  }

  const footerEl = document.getElementById('footerText');
  if (footerEl) {
    footerEl.textContent = `© 2026 ${site.displayName} Region. All rights reserved.`;
  }
}

function applyBackgroundVideo(site) {
  const bgVideoEl = document.getElementById('bgVideo');
  if (!bgVideoEl) return;

  const videoSrc = site.backgroundVideo || '';
  if (!videoSrc) {
    document.body.dataset.hasVideo = 'false';
    bgVideoEl.pause();
    bgVideoEl.removeAttribute('src');
    bgVideoEl.load();
    bgVideoEl.classList.add('hidden');
    return;
  }

  if (bgVideoEl.getAttribute('src') !== videoSrc) {
    bgVideoEl.src = videoSrc;
    bgVideoEl.load();
  }

  bgVideoEl.muted = true;
  bgVideoEl.defaultMuted = true;
  bgVideoEl.volume = 0;
  document.body.dataset.hasVideo = 'true';
  bgVideoEl.classList.remove('hidden');
  bgVideoEl.play().catch(() => {});
}

function showSiteWarning(message) {
  const warningEl = document.getElementById('siteWarning');
  if (!warningEl) return;

  warningEl.textContent = `${message}. Showing ${currentSite.displayName}.`;
  warningEl.classList.remove('hidden');
}

function showError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}-error`);
  if (input) input.classList.add('error');
  if (error) error.textContent = message;
}

function clearError(fieldId) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}-error`);
  if (input) input.classList.remove('error');
  if (error) error.textContent = '';
}

function validateStep(step) {
  let valid = true;

  if (step === 1) {
    const value = document.getElementById('businessName').value.trim();
    clearError('businessName');
    if (!value) {
      showError('businessName', 'Please enter your business name.');
      valid = false;
    } else if (value.length > 200) {
      showError('businessName', 'Business name is too long.');
      valid = false;
    }
  }

  if (step === 2) {
    const first = document.getElementById('firstName').value.trim();
    const last = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    clearError('firstName');
    clearError('lastName');
    clearError('phone');
    clearError('email');

    if (!first) {
      showError('firstName', 'Please enter a first name.');
      valid = false;
    }
    if (!last) {
      showError('lastName', 'Please enter a last name.');
      valid = false;
    }
    if (!phone) {
      showError('phone', 'Please enter a phone number.');
      valid = false;
    } else {
      const digits = phone.replace(/[\s\-\(\)]/g, '');
      const isValid =
        /^\+61[2-9]\d{8}$/.test(digits) ||
        /^0[2-9]\d{8}$/.test(digits) ||
        /^04\d{8}$/.test(digits);
      if (!isValid) {
        showError('phone', 'Please enter a valid Australian phone number (e.g. 03 9000 1234 or 0412 345 678).');
        valid = false;
      }
    }
    if (!email) {
      showError('email', 'Please enter an email address.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('email', 'Please enter a valid email address.');
      valid = false;
    }
  }

  if (step === 3) {
    const checked = document.querySelectorAll('input[name="services"]:checked');
    const error = document.getElementById('services-error');
    if (checked.length === 0) {
      error.textContent = 'Please select at least one service.';
      valid = false;
    } else {
      error.textContent = '';
    }
  }

  return valid;
}

function goToStep(stepNumber) {
  document.getElementById(`step-${currentStep}`).classList.add('hidden');
  document.getElementById(`step-${stepNumber}`).classList.remove('hidden');

  for (let i = 1; i <= totalSteps; i += 1) {
    const indicator = document.getElementById(`step-${i}-indicator`);
    indicator.classList.remove('active', 'done');
    if (i < stepNumber) indicator.classList.add('done');
    else if (i === stepNumber) indicator.classList.add('active');
  }

  currentStep = stepNumber;
  window.scrollTo({ top: document.querySelector('.card').offsetTop - 20, behavior: 'smooth' });
}

function nextStep(from) {
  if (!validateStep(from)) return;
  if (from < totalSteps) goToStep(from + 1);
}

function prevStep(from) {
  if (from > 1) goToStep(from - 1);
}

['businessName', 'firstName', 'lastName', 'phone', 'email'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      if (el.value.trim()) clearError(id);
    });
  }
});

const phoneEl = document.getElementById('phone');
if (phoneEl) {
  phoneEl.addEventListener('input', () => {
    const cursor = phoneEl.selectionStart;
    const cleaned = phoneEl.value.replace(/[^\d\s\+\-\(\)]/g, '');
    if (phoneEl.value !== cleaned) {
      phoneEl.value = cleaned;
      phoneEl.setSelectionRange(Math.max(cursor - 1, 0), Math.max(cursor - 1, 0));
    }
    if (cleaned.trim()) clearError('phone');
  });
}

const emailEl = document.getElementById('email');
if (emailEl) {
  emailEl.addEventListener('input', () => {
    const cursor = emailEl.selectionStart;
    const cleaned = emailEl.value.replace(/[^\w._%+\-@]/g, '');
    if (emailEl.value !== cleaned) {
      emailEl.value = cleaned;
      emailEl.setSelectionRange(Math.max(cursor - 1, 0), Math.max(cursor - 1, 0));
    }
    if (cleaned.trim()) clearError('email');
  });
}

['firstName', 'lastName'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      const value = el.value;
      if (value.length > 0) {
        el.value = value.charAt(0).toUpperCase() + value.slice(1);
      }
    });
  }
});

document.querySelectorAll('input[name="services"]').forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    const checked = document.querySelectorAll('input[name="services"]:checked');
    if (checked.length > 0) {
      document.getElementById('services-error').textContent = '';
    }
  });
});

document.getElementById('requestForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateStep(3)) return;

  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  const btnArrow = submitBtn.querySelector('.btn-arrow');

  submitBtn.disabled = true;
  btnText.textContent = 'Sending...';
  btnLoader.classList.remove('hidden');
  btnArrow.classList.add('hidden');

  const services = Array.from(document.querySelectorAll('input[name="services"]:checked'))
    .map((checkbox) => checkbox.value);

  const payload = {
    siteKey: currentSite.siteKey,
    businessName: document.getElementById('businessName').value.trim(),
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    services,
  };

  try {
    const response = await fetch(`${API_BASE}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (data.success) {
      showSuccess(payload);
    } else {
      const message = data.errors
        ? data.errors.map((error) => error.msg).join(' ')
        : (data.message || 'Something went wrong. Please try again.');
      showSubmitError(message);
    }
  } catch {
    showSubmitError('Network error. Please check your connection and try again.');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Submit Request';
    btnLoader.classList.add('hidden');
    btnArrow.classList.remove('hidden');
  }
});

const serviceLabels = {
  printedCompendium: 'Printed Compendium',
  digitalCompendium: 'Digital Compendium',
  visitTouchscreen: 'Touchscreen',
};

function showSubmitError(message) {
  const el = document.getElementById('submit-error');
  el.textContent = message;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccess(data) {
  document.getElementById('submit-error').classList.add('hidden');
  document.querySelector('.steps').classList.add('hidden');
  document.getElementById('requestForm').classList.add('hidden');

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
  const serviceList = data.services.map((service) => serviceLabels[service]).join(', ');

  document.getElementById('successDetails').innerHTML = `
    <div class="success-detail-row">
      <span class="success-detail-label">Site:</span>
      <span class="success-detail-value">${escapeHtml(currentSite.displayName)}</span>
    </div>
    <div class="success-detail-row">
      <span class="success-detail-label">Business:</span>
      <span class="success-detail-value">${escapeHtml(data.businessName)}</span>
    </div>
    <div class="success-detail-row">
      <span class="success-detail-label">Contact:</span>
      <span class="success-detail-value">${escapeHtml(fullName)}</span>
    </div>
    <div class="success-detail-row">
      <span class="success-detail-label">Phone:</span>
      <span class="success-detail-value">${escapeHtml(data.phone)}</span>
    </div>
    <div class="success-detail-row">
      <span class="success-detail-label">Email:</span>
      <span class="success-detail-value">${escapeHtml(data.email)}</span>
    </div>
    <div class="success-detail-row">
      <span class="success-detail-label">Services:</span>
      <span class="success-detail-value">${escapeHtml(serviceList)}</span>
    </div>
  `;

  document.getElementById('successState').classList.remove('hidden');

  for (let i = 1; i <= totalSteps; i += 1) {
    const indicator = document.getElementById(`step-${i}-indicator`);
    indicator.classList.remove('active');
    indicator.classList.add('done');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  document.getElementById('requestForm').reset();
  document.getElementById('requestForm').classList.remove('hidden');
  document.getElementById('successState').classList.add('hidden');
  document.querySelector('.steps').classList.remove('hidden');
  document.getElementById('submit-error').classList.add('hidden');

  ['businessName', 'firstName', 'lastName', 'phone', 'email'].forEach(clearError);
  document.getElementById('services-error').textContent = '';

  currentStep = 1;
  for (let i = 1; i <= totalSteps; i += 1) {
    document.getElementById(`step-${i}`).classList.add('hidden');
    const indicator = document.getElementById(`step-${i}-indicator`);
    indicator.classList.remove('active', 'done');
  }
  document.getElementById('step-1').classList.remove('hidden');
  document.getElementById('step-1-indicator').classList.add('active');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

currentSite = getInitialSiteFromRoute();
applySiteConfig(currentSite);
loadSiteConfig();
