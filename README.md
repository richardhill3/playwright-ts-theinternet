# playwright-ts-theinternet

Lightweight Playwright + TypeScript test suite targeting "The Internet" demo site (https://the-internet.herokuapp.com). Includes example test structure, configuration, and common commands for local development and CI.

[![Playwright Tests](https://github.com/richardhill3/playwright-ts-theinternet/actions/workflows/playwright.yml/badge.svg)](https://github.com/richardhill3/playwright-ts-theinternet/actions/workflows/playwright.yml)

## Prerequisites
- Node.js 16+ (LTS recommended)
- npm
- Recommended editor: VS Code

## Install
1. Install dependencies
    ```
    npm ci
    ```
2. Install Playwright browsers
    ```
    npx playwright install --with-deps
    ```

## Running tests

- Type checking, linting and run tests: `npm run test`
- Test only Headed (UI): `npx playwright test --headed`
- View Report: `npx playwright show-report`
- Debug with Plawyright Inspector: `npx playwright test --debug`

## Project layout (recommended)
- playwright.config.ts — Playwright configuration (projects, timeouts, reporters)
- tests/ — test files
- package.json, tsconfig.json, .eslintrc