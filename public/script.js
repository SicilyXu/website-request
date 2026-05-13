'use strict';

let currentStep = 1;
const totalSteps = 3;

// ── Validation ────────────────────────────────────────────────────────────────

function showError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + '-error');
  if (input) input.classList.add('error');
  if (error) error.textContent = message;
}

function clearError(fieldId) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + '-error');
  if (input) input.classList.remove('error');
  if (error) error.textContent = '';
}

function validateStep(step) {
  let valid = true;

  if (step === 1) {
    const val = document.getElementById('businessName').value.trim();
    clearError('businessName');
    if (!val) { showError('businessName', 'Please enter your business name.'); valid = false; }
    else if (val.length > 200) { showError('businessName', 'Business name is too long.'); valid = false; }
  }

  if (step === 2) {
    const first = document.getElementById('firstName').value.trim();
    const last  = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    clearError('firstName'); clearError('lastName'); clearError('phone'); clearError('email');

    if (!first) { showError('firstName', 'Please enter a first name.'); valid = false; }
    if (!last)  { showError('lastName',  'Please enter a last name.');  valid = false; }
    if (!phone) {
      showError('phone', 'Please enter a phone number.'); valid = false;
    } else if (!/^[\d\s\+\-\(\)]{6,20}$/.test(phone)) {
      showError('phone', 'Please enter a valid phone number.'); valid = false;
    }
    if (!email) {
      showError('email', 'Please enter an email address.'); valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('email', 'Please enter a valid email address.'); valid = false;
    }
  }

  if (step === 3) {
    const checked = document.querySelectorAll('input[name="services"]:checked');
    const err = document.getElementById('services-error');
    if (checked.length === 0) {
      err.textContent = 'Please select at least one service.';
      valid = false;
    } else {
      err.textContent = '';
    }
  }

  return valid;
}

// ── Step navigation ───────────────────────────────────────────────────────────

function goToStep(n) {
  document.getElementById('step-' + currentStep).classList.add('hidden');
  document.getElementById('step-' + n).classList.remove('hidden');

  // Update step indicators
  for (let i = 1; i <= totalSteps; i++) {
    const indicator = document.getElementById('step-' + i + '-indicator');
    indicator.classList.remove('active', 'done');
    if (i < n) indicator.classList.add('done');
    else if (i === n) indicator.classList.add('active');
  }

  currentStep = n;
  window.scrollTo({ top: document.querySelector('.card').offsetTop - 20, behavior: 'smooth' });
}

function nextStep(from) {
  if (!validateStep(from)) return;
  if (from < totalSteps) goToStep(from + 1);
}

function prevStep(from) {
  if (from > 1) goToStep(from - 1);
}

// ── Live validation (clear error on change) ───────────────────────────────────

['businessName', 'firstName', 'lastName', 'phone', 'email'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      if (el.value.trim()) clearError(id);
    });
  }
});

// ── Phone: only allow digits, spaces, +, -, (, ) ─────────────────────────────
const phoneEl = document.getElementById('phone');
if (phoneEl) {
  phoneEl.addEventListener('input', () => {
    const cursor = phoneEl.selectionStart;
    const cleaned = phoneEl.value.replace(/[^\d\s\+\-\(\)]/g, '');
    if (phoneEl.value !== cleaned) {
      phoneEl.value = cleaned;
      phoneEl.setSelectionRange(cursor - 1, cursor - 1);
    }
    if (cleaned.trim()) clearError('phone');
  });
}

// ── Email: only allow valid email characters ──────────────────────────────────
const emailEl = document.getElementById('email');
if (emailEl) {
  emailEl.addEventListener('input', () => {
    const cursor = emailEl.selectionStart;
    const cleaned = emailEl.value.replace(/[^\w._%+\-@]/g, '');
    if (emailEl.value !== cleaned) {
      emailEl.value = cleaned;
      emailEl.setSelectionRange(cursor - 1, cursor - 1);
    }
    if (cleaned.trim()) clearError('email');
  });
}

// Auto-capitalise first letter for name fields
['firstName', 'lastName'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      const val = el.value;
      if (val.length > 0) {
        el.value = val.charAt(0).toUpperCase() + val.slice(1);
      }
    });
  }
});

document.querySelectorAll('input[name="services"]').forEach(cb => {
  cb.addEventListener('change', () => {
    const checked = document.querySelectorAll('input[name="services"]:checked');
    if (checked.length > 0) document.getElementById('services-error').textContent = '';
  });
});

// ── Form submission ───────────────────────────────────────────────────────────

document.getElementById('requestForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(3)) return;

  const submitBtn = document.getElementById('submitBtn');
  const btnText   = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  const btnArrow  = submitBtn.querySelector('.btn-arrow');

  // Loading state
  submitBtn.disabled = true;
  btnText.textContent = 'Sending…';
  btnLoader.classList.remove('hidden');
  btnArrow.classList.add('hidden');

  const services = Array.from(document.querySelectorAll('input[name="services"]:checked'))
    .map(cb => cb.value);

  const payload = {
    businessName: document.getElementById('businessName').value.trim(),
    firstName:    document.getElementById('firstName').value.trim(),
    lastName:     document.getElementById('lastName').value.trim(),
    phone:        document.getElementById('phone').value.trim(),
    email:        document.getElementById('email').value.trim(),
    services,
  };

  try {
    const res = await fetch('/api/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.success) {
      showSuccess(payload);
    } else {
      const msg = data.errors
        ? data.errors.map(e => e.msg).join(' ')
        : (data.message || 'Something went wrong. Please try again.');
      showSubmitError(msg);
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

// ── Success state ─────────────────────────────────────────────────────────────

const serviceLabels = {
  printedCompendium:  'Printed Compendium',
  digitalCompendium:  'Digital Compendium',
  visitTouchscreen:   'Touchscreen',
};

function showSubmitError(msg) {
  const el = document.getElementById('submit-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccess(data) {
  document.getElementById('submit-error').classList.add('hidden');
  document.querySelector('.steps').classList.add('hidden');
  document.getElementById('requestForm').classList.add('hidden');

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
  const serviceList = data.services.map(s => serviceLabels[s]).join(', ');

  document.getElementById('successDetails').innerHTML = `
    <div><strong>Business:</strong> ${escapeHtml(data.businessName)}</div>
    <div><strong>Contact:</strong> ${escapeHtml(fullName)}</div>
    <div><strong>Phone:</strong> ${escapeHtml(data.phone)}</div>
    <div><strong>Email:</strong> ${escapeHtml(data.email)}</div>
    <div><strong>Services:</strong> ${escapeHtml(serviceList)}</div>
  `;

  document.getElementById('successState').classList.remove('hidden');

  // Mark all steps as done
  for (let i = 1; i <= totalSteps; i++) {
    const indicator = document.getElementById('step-' + i + '-indicator');
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

  // Clear all errors
  ['businessName', 'firstName', 'lastName', 'phone', 'email'].forEach(clearError);
  document.getElementById('services-error').textContent = '';

  currentStep = 1;
  for (let i = 1; i <= totalSteps; i++) {
    document.getElementById('step-' + i).classList.add('hidden');
    const indicator = document.getElementById('step-' + i + '-indicator');
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
