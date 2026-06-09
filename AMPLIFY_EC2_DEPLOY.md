# Amplify + EC2 Deployment

## Architecture

- `Amplify` hosts the static frontend from `public/`
- `EC2` runs the Express API from `backend/app.js`
- Frontend API requests go to `https://request-api.platypus360.com`

## 1. Configure EC2

Set these values in the EC2 `.env`:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM_NAME=Warrnambool Business Portal
MANAGER_EMAIL=sicily@johnbatman.com.au
STAFF_EMAIL=
ALLOWED_ORIGINS=https://www.platypus360.com,https://platypus360.com
PORT=3001
```

Then restart the backend:

```bash
cd /home/ubuntu/website-request
pm2 restart warrnambool-request
```

## 2. Create a new Amplify app

Connect this repo and deploy only the static frontend from `public/`.

Use this build spec:

```yaml
version: 1
frontend:
  phases:
    build:
      commands:
        - mkdir -p dist/request-assets
        - cp public/index.html dist/
        - cp public/request-config.js dist/
        - cp -r public/assets/* dist/request-assets/
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
```

## 3. Add Amplify rewrites

Add these rewrite rules:

- Source: `/warrnambool`
  Target: `/index.html`
  Type: `200 (Rewrite)`

- Source: `/Yarrawonga`
  Target: `/index.html`
  Type: `200 (Rewrite)`

- Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|jpeg|js|png|svg|txt|webp|mp4)$)([^.]+$)/>`
  Target: `/index.html`
  Type: `200 (Rewrite)`

## 4. Frontend API configuration

The frontend reads the API base URL from `public/request-config.js`.

Default:

```js
window.REQUEST_PORTAL_CONFIG = {
  apiBaseUrl: 'https://request-api.platypus360.com',
};
```

If you need a different backend later, update that file and redeploy Amplify.

## 5. Safe path-based cutover on the existing website

To preserve the existing URLs without colliding with the old site's `/assets`,
the request app uses:

- `/request-assets/*`
- `/request-config.js`

That allows the existing website to add only new rewrite rules for:

- `/warrnambool`
- `/Yarrawonga`
- `/request-assets/*`
- `/request-config.js`
