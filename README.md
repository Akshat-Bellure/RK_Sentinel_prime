# RK Sentinel Prime - Design System & UI Kit

## Overview
RK Sentinel Prime is a government procurement and tender intelligence platform. This repository contains the design tokens, UI components, and application code adhering to the professional, audit-safe design system.

## Design System
### Colors
- **Primary (Navy)**: `#0B335C` (Headers, Sidebars, Primary Actions)
- **Accent (Teal)**: `#0FA89A` (Verified Status, Highlights, Success)
- **Warning (Amber)**: `#FF9F1C` (Unverified, Attention Needed)
- **Danger (Red)**: `#E64545` (Critical Risks, Legal Blocks)
- **Surface (Light)**: `#F7F9FB` (App Background)
- **Surface 2 (White)**: `#FFFFFF` (Cards, Panels)

### Typography
- **Headings**: Rajdhani (Bold/SemiBold)
- **Body**: Inter (Regular/Medium)
- **Logo**: Times New Roman (Bold) for "RK"

### Accessibility
- All text meets WCAG AA contrast ratio (4.5:1).
- Focus states provided for keyboard navigation.

## Legal Gate Export Flow
To export a compliant Evidence Package:
1. Navigate to **Pre-Bid Studio**.
2. Draft queries/documents.
3. Click "Request Legal Approval".
4. Auditor enters **Signature** and **2FA Token** in the Legal Gate Modal.
5. Upon verification, the "Add to Final Pack" button becomes active.
6. Unsigned exports are strictly blocked.

## Evidence Vault Manifest
See `manifest.json` for the structure of the secure evidence package.

## Components
Reusable components are located in `ui_components/` including:
- `Button.tsx`: Standardized buttons.
- `Input.tsx`: Form inputs with validation states.
- `LegalGateModal.tsx`: The security checkpoint component.

## Icons
SVG icons are provided for critical actions (Check, Exclaim, Lock, Download).
