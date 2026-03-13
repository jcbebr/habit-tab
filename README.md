# Habit Tab

`Habit Tab` is a Chrome/Edge new-tab extension for:

- daily gym exercise check-ins
- personal daily notes
- calendar-based history review
- line/bar progress charts for the last 7 days, 1 month, 3 months, 6 months, or 1 year

All data is stored locally in the browser with `chrome.storage.local`.

## Features

- Replaces the browser new tab page with a polished workout + notes dashboard.
- Lets you build a reusable exercise list and check items off each day.
- Creates a fresh checklist every day while preserving previous days as history.
- Stores one note per day.
- Lets you select a date in the calendar to review what was done on that day.
- Shows progress trends with a selectable chart range and chart style.

## Tech stack

- React
- TypeScript
- Vite
- Mantine UI
- Mantine Dates / Charts
- Chrome Extension Manifest V3

## Local development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build the extension:

```bash
npm run build
```

The production-ready extension files are written to `dist/`.

## Load in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Turn on `Developer mode`.
4. Click `Load unpacked`.
5. Select the `dist` folder.

## Load in Edge

1. Run `npm run build`.
2. Open `edge://extensions`.
3. Turn on `Developer mode`.
4. Click `Load unpacked`.
5. Select the `dist` folder.

## Startup behavior

This extension overrides the new tab page.

If your browser is already configured to open the new tab page on startup, this dashboard will also appear when the browser launches.

## Privacy

- Data is stored locally on the current browser profile.
- No backend, sync service, or external account is used.
- Nothing is sent to a remote server.
