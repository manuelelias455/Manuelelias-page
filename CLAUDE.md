# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repo contains two independent static web projects with no build system or package manager:

- **`CSS - My Site/`** — A simple personal portfolio page (HTML + CSS only)
- **`invoice-app/`** — A full-featured German-language invoice management SPA

Both projects open directly in a browser; there are no build steps, transpilation, or server-side dependencies.

## Developing and Testing

Since there is no build toolchain, development is done by opening files directly in a browser or serving them locally:

```bash
# Serve the portfolio site
python3 -m http.server 8080 --directory "CSS - My Site"

# Serve the invoice app
python3 -m http.server 8081 --directory invoice-app
```

There are no lint tools, test suites, or CI pipelines configured in this repository.

## Architecture: Invoice App (`invoice-app/index.html`)

The entire invoice app lives in a single HTML file. All CSS, HTML markup, and JavaScript are co-located — there are no external `.js` or `.css` files loaded from disk.

### Data Layer

The `DB` object (line ~1352) is the central data abstraction. It stores data in `localStorage` namespaced per user (`{username}__{collection}`) and automatically writes through to Firestore whenever a cloud connection is active:

```js
DB.set('invoices', data)  // writes localStorage + triggers cloudSet()
DB.get('invoices')        // reads from localStorage
```

The five collections are: `customers`, `invoices`, `quotes`, `positions`, `settings`.

### Authentication

Auth is a hybrid of local credentials and Firebase Auth:

1. Passwords are hashed with `sha256()` (Web Crypto API) and stored in `localStorage` under `__users__`.
2. On login, the local hash is checked first; if not found locally, the account is fetched from the Firestore `__accounts__` collection.
3. Firebase Auth (`auth.signInWithEmailAndPassword`) is used as the authoritative fallback.
4. The active session is stored in `sessionStorage` as `__session__`.
5. `currentUser` is a global string holding the logged-in username, used to namespace all data keys.

### Firebase / Cloud Sync

- Firebase compat SDK v10.12.0 is loaded from CDN (`firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`).
- `getFirebaseConfig()` returns user-overridden credentials from `localStorage.__fbcfg__`, falling back to a hardcoded default project (`rechnungsverwaltung-9c32d`).
- Firestore data path: `users/{username}/{collection}/data` — each collection is stored as a single document with a JSON-stringified `v` field.
- `pushAllToCloud()` / `pullFromCloud()` do bulk sync; `cloudSet()` is called automatically on every `DB.set()`.

### Navigation & SPA Routing

`navigate(page)` swaps the visible `.page` div and updates the active state of both the desktop sidebar and mobile bottom nav. There is no URL-based routing — all state is in memory and the DOM. Pages: `dashboard`, `invoices`, `quotes`, `customers`, `positions`, `settings`.

### Invoice/Quote Modal

Invoices and quotes share the same modal (`modal-invoice`). `_setModalForMode('invoice'|'quote')` toggles labels and status options. `invoiceLines` is a module-level array holding the current line items; `renderInvoiceLines()` re-renders the editable positions table.

### Print / PDF

`printInvoice()` opens a new browser window, injects the invoice HTML rendered by `buildInvoiceHTML()` using one of four templates (`klassisch`, `modern`, `minimal`, `elegant`), and calls `window.print()`. The template is stored in settings.

### Mobile Layout

At `max-width: 768px` the sidebar is hidden and replaced by an iOS-style bottom tab bar (`#mobile-nav`). Modals become bottom sheets. The "Belege" tab reveals a submenu for switching between Invoices and Quotes.

## Architecture: Portfolio Site (`CSS - My Site/`)

A static personal page. Fonts are loaded from Google Fonts (Merriweather, Montserrat, Sacramento). Images are in `images/`. No JavaScript.
