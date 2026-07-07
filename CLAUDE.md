# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GIMS (Government Inventory Management System) — a Philippine government agency inventory application built on **Laravel 13 + Inertia v3 + React 19 + Tailwind v4**. Implements supplies/property management, requisition & issuance (RIS), receiving reports, property assignment, and an internal helpdesk with role-based access control.

Package manager: **pnpm** (see `pnpm-workspace.yaml`). Database: **SQLite** by default. Auth: **Laravel Fortify v1** (email + 2FA + passkeys via `@laravel/passkeys`).

## Common Commands

### Development
```bash
# All-in-one dev (server + queue + vite, colored)
composer run dev

# Individual
php artisan serve
php artisan queue:listen --tries=1
npm run dev
```

### Setup
```bash
composer run setup      # install deps, copy .env, key:generate, migrate, npm install, vite build
php artisan db:seed --class=DemoDataSeeder   # load demo inventory/requisitions (keeps users/roles)
```

### Testing
```bash
php artisan test --compact                          # run all tests (Feature + Unit)
php artisan test --compact tests/Feature/GimsRbacTest.php
php artisan test --compact --filter=testName       # run a single test
composer test                                        # lint:check + types:check + test
```

### Code Quality
```bash
# PHP
vendor/bin/pint --format agent          # fix PHP formatting (Pint)
composer run lint:check                 # test PHP formatting
composer run types:check                # PHPStan level 7 via Larastan

# Frontend
npm run lint                            # ESLint --fix
npm run lint:check                      # ESLint (no fix)
npm run format                          # Prettier --write
npm run format:check                    # Prettier --check
npm run types:check                     # tsc --noEmit
composer run ci:check                   # all frontend checks + tests
```

### Database
```bash
php artisan migrate
php artisan migrate:fresh --seed       # reset + seed
php artisan route:list --except-vendor  # see app routes
```

## Architecture

### Domain Areas
The app is a single Laravel project but its real domain is **inventory management**, organized around the GIMS data model:

- **Foundation** (`offices`, `departments`, `employees`, `suppliers`, `categories`, `units`, `warehouses`, `locations`) — `database/migrations/2026_06_28_000001_create_gims_foundation_tables.php`
- **Inventory** (`items`, `stock_transactions`) — moving-average cost method (see `app/Services/Valuation/ValuationService.php`)
- **Procurement** (`purchase_requests`, `purchase_orders`, `receiving_reports`, `receiving_report_items`)
- **Requisitions / Warehouse** (`requisitions`, `requisition_items`, `issuances`, `issuance_items`) — the RIS (Requisition Issue Slip) workflow
- **Property** (`properties`, `property_assignments`, `property_transfers`, `disposals`) — PPE lifecycle
- **RBAC** (`permissions`, `roles`, `model_has_roles`, `role_has_permissions`, `model_has_permissions`)
- **Audit** (`audit_logs`, `password_histories`)
- **Helpdesk** (`tickets`)

### RBAC / Authorization
- Custom RBAC in `app/Models/HasPermissions.php` (trait used on `User`). Methods: `hasPermissionTo()`, `hasRole()`, `assignRole()`, `givePermissionTo()`.
- Permission keys are dot-namespaced strings (e.g., `inventory.view`, `request.approve`, `warehouse.issue`, `users.manage`, `roles.manage`, `dashboard.view`).
- Controllers call `Gate::authorize('<permission>')` at the top of every action. Failure throws 403.
- Some controllers also apply **data scoping** based on the user's role/permissions (see `RequisitionController::index` — supply officers see all, dept heads see their department, employees see their own).
- A **super admin (User id 1)** is protected from role removal and deactivation in `AdminController`.

### Inventory Costing
- `Item::current_stock` is a computed attribute — it sums `stock_transactions.quantity` (positive for `in`, negative for `out`).
- `ValuationService` handles stock-in (recalculates **moving average unit cost** on the Item) and stock-out (records the current average cost on the IssuanceItem).
- All stock-affecting operations should go through `ValuationService` to keep the average cost and the transaction log consistent.

### Audit Logging
- `App\Services\Audit\AuditLogger::log($action, $model, $oldValues, $newValues, $module, $permission)` — call this from any controller that mutates inventory/admin data.
- `AuditLogger::logUnauthorized($permission)` — for denied access attempts.
- Module is auto-resolved from the model class name (e.g., `Requisition` → `warehouse`, `Item` → `inventory`).
- The protected User (id 1) is the super admin and is excluded from deactivation in `AdminController`.

### Authentication Flow & Middleware
- `bootstrap/app.php` (not shown) registers middleware including `EnsureTwoFactorEnabled` and `EnsurePasswordChanged`.
- `EnsureTwoFactorEnabled` redirects to `security.edit` if `TWO_FACTOR_ENFORCED=true` and user lacks 2FA. Tests can bypass with `?enforce_2fa=1` or `X-Enforce-2FA` header.
- `EnsurePasswordChanged` enforces password rotation: redirects if `password_change_required` is true, or if `password_changed_at` is older than 60 days (warns at 53 days).
- Password history is tracked in `password_histories` via the `User::saved` boot hook — no reuse allowed.
- Passkeys (Laravel Passkeys) and TOTP 2FA are both available.

### Frontend (Inertia v3 + React 19)
- Pages live in `resources/js/pages/` (NOT `resources/views/`). Use `Inertia::render()` server-side.
- Page mirroring: `resources/js/pages/inventory/{section}/index.tsx` ↔ `app/Http/Controllers/Inventory/{Section}Controller.php`.
- **Layouts** (`resources/js/app.tsx`):
  - `auth/*` → `AuthLayout`
  - `settings/*` → `[AppLayout, SettingsLayout]`
  - `welcome`, `inventory/requisitions/print` → no layout (print-friendly)
  - everything else → `AppLayout`
- UI components: shadcn/ui (new-york style) under `resources/js/components/ui/`. Icons: `lucide-react`. Notifications: `sonner` (Toaster mounted in `app.tsx`).
- **Wayfinder** is used for type-safe route/controller access on the frontend. Import from `@/actions/` or `@/routes/`. Generated by `@laravel/vite-plugin-wayfinder` (see `vite.config.ts`).
- `@inertiajs/vite` plugin is enabled — SSR works automatically in `npm run dev`. React Compiler is enabled via `babel-plugin-react-compiler`.

### Routes & Inertia v3 Notes
- All inventory routes require `auth` + `verified` middleware (see `routes/web.php`).
- `Route::inertia('/', 'welcome')` is the landing page.
- Inertia v3 specifics: `useHttp` for standalone requests, optimistic updates with rollback, `useLayoutProps`, deferred/merge/optional props, instant visits. **No Axios** — use the built-in XHR client.

### Tests
- Pest v4 with `RefreshDatabase` on Feature tests (see `tests/Pest.php`). Database is `:memory:` SQLite.
- `tests/Feature/GimsRbacTest.php` covers RBAC and the protected-super-admin rule.
- `tests/Feature/GimsBusinessLogicTest.php` and `GimsRequisitionPrintTest.php` cover core inventory flows.
- The dev database has the demo data from `DemoDataSeeder`; tests seed their own via factories.

## Conventions & Gotchas

- **PHP**: typed properties and explicit return types required. Use constructor property promotion (no empty zero-arg `__construct`). Use `array<string, mixed>` shape PHPDoc on arrays. Use TitleCase for Enum keys.
- **Code style**: Run `vendor/bin/pint --format agent` after any PHP edit. Run `npm run lint && npm run format` after TS/TSX edits.
- **Naming**: descriptive method names (`isRegisteredForDiscounts` not `discount()`). Check sibling files for existing patterns before creating new ones.
- **Auditing**: anything that creates, updates, or deletes inventory/admin data should call `AuditLogger::log(...)`.
- **Permission checks**: every controller action starts with `Gate::authorize('...')`. When adding a new action, also wire the permission into the `permissions` table (see `DatabaseSeeder` for the permission list and the role mappings).
- **Stock-affecting operations** must go through `ValuationService` — do not write to `stock_transactions` directly.
- **Requisition workflow status flow**: `pending_dept_head` → `pending_supply` (after dept head approves) → `issued` / `partially_issued` (after supply officer issues). A user cannot approve their own requisition (`RequisitionController::approve`).
- **Frontend dev**: if changes aren't visible in the UI, ask the user to run `npm run dev` or `composer run dev` — Vite HMR or a fresh build may be required.
- **Documentation files**: only create new `.md` files when explicitly requested.
- **No verification scripts** (e.g., `php artisan tinker` one-offs) when tests cover the behavior — write a Pest test instead.

## Key Files Map

| Purpose | Location |
|---|---|
| RBAC trait | `app/Models/HasPermissions.php` |
| Audit logger | `app/Services/Audit/AuditLogger.php` |
| Inventory costing | `app/Services/Valuation/ValuationService.php` |
| Item model + computed stock | `app/Models/Item.php` |
| All inventory controllers | `app/Http/Controllers/Inventory/` |
| Frontend inventory pages | `resources/js/pages/inventory/` |
| Routes | `routes/web.php` |
| All migrations | `database/migrations/2026_06_28_*` (GIMS tables) |
| Demo data seeder | `database/seeders/DemoDataSeeder.php` (preserves users/roles) |
| App middleware wiring | `bootstrap/app.php` |
| Pest config | `tests/Pest.php` |
| PHPStan config | `phpstan.neon` (level 7) |
| Vite config (Wayfinder, React, Inertia, Tailwind) | `vite.config.ts` |
