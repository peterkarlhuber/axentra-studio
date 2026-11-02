import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { InitialLoad } from '@/components/layout/FullPageMessage';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RootLayout } from './RootLayout';
import { HomeRedirect, ModuleGate, ProductScope, RequireAuth } from './guards';
import { AppShell } from './shell/AppShell';
import { HelpLayout } from '@/help/HelpLayout';
import { AcceptInvitationAlias } from '@/features/tenants/AcceptInvitationAlias';

/* Feature pages are code-split per route. */
const lazyPage =
  <K extends string>(loader: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  async () => ({ Component: (await loader())[name] });

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    HydrateFallback: InitialLoad,
    children: [
      { path: 'setup', lazy: lazyPage(() => import('@/features/auth/SetupPage'), 'SetupPage') },
      { path: 'login', lazy: lazyPage(() => import('@/features/auth/LoginPage'), 'LoginPage') },
      // Public: the path of Axentra's default invitation link; forwards to /invitations/accept.
      { path: 'accept-invitation', element: <AcceptInvitationAlias /> },
      {
        // Public: readable before sign-in (inside the Studio shell when signed in).
        path: 'help',
        element: <HelpLayout />,
        errorElement: <RouteErrorBoundary />,
        handle: { crumb: 'help' },
        children: [
          { index: true, lazy: lazyPage(() => import('@/help/HelpHomePage'), 'HelpHomePage') },
          {
            path: ':articleId',
            lazy: lazyPage(() => import('@/help/HelpArticlePage'), 'HelpArticlePage'),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            errorElement: <RouteErrorBoundary />,
            children: [
              { index: true, element: <HomeRedirect /> },
              {
                path: 'products',
                handle: { crumb: 'products' },
                children: [
                  {
                    index: true,
                    lazy: lazyPage(
                      () => import('@/features/products/ProductsPage'),
                      'ProductsPage',
                    ),
                  },
                  {
                    path: ':productId',
                    handle: { crumbParam: 'productId' },
                    lazy: lazyPage(
                      () => import('@/features/products/ProductDetailPage'),
                      'ProductDetailPage',
                    ),
                  },
                ],
              },
              {
                path: 'audit',
                handle: { crumb: 'audit' },
                element: <ModuleGate module="audit" titleKey="audit" />,
                children: [
                  {
                    index: true,
                    lazy: lazyPage(() => import('@/features/audit/AuditPage'), 'AuditPage'),
                  },
                ],
              },
              {
                path: 'health',
                handle: { crumb: 'health' },
                lazy: lazyPage(() => import('@/features/system/HealthPage'), 'HealthPage'),
              },
              // ---- monitoring area ----
              {
                path: 'monitoring',
                handle: { crumb: 'monitoring' },
                lazy: lazyPage(
                  () => import('@/features/monitoring/MonitoringPage'),
                  'MonitoringPage',
                ),
              },
              {
                path: 'settings',
                handle: { crumb: 'settings' },
                lazy: lazyPage(() => import('@/features/system/SettingsPage'), 'SettingsPage'),
              },
              {
                path: 'profile',
                handle: { crumb: 'profile' },
                lazy: lazyPage(() => import('@/features/profile/ProfilePage'), 'ProfilePage'),
              },
              {
                path: 'invitations/accept',
                handle: { crumb: 'acceptInvitation' },
                lazy: lazyPage(
                  () => import('@/features/tenants/AcceptInvitationPage'),
                  'AcceptInvitationPage',
                ),
              },
              {
                path: 'p/:productId',
                element: <ProductScope />,
                children: [
                  { index: true, element: <Navigate to="dashboard" replace /> },
                  {
                    path: 'dashboard',
                    handle: { crumb: 'dashboard' },
                    lazy: lazyPage(
                      () => import('@/features/dashboard/DashboardPage'),
                      'DashboardPage',
                    ),
                  },
                  {
                    path: 'tenants',
                    handle: { crumb: 'tenants' },
                    element: <ModuleGate module="tenants" titleKey="tenants" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/tenants/TenantsPage'),
                          'TenantsPage',
                        ),
                      },
                      {
                        path: ':tenantId',
                        handle: { crumbParam: 'tenantId' },
                        lazy: lazyPage(
                          () => import('@/features/tenants/TenantDetailPage'),
                          'TenantDetailPage',
                        ),
                      },
                    ],
                  },
                  {
                    path: 'users',
                    handle: { crumb: 'users' },
                    element: <ModuleGate module="users" titleKey="users" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/users/UsersPage'), 'UsersPage'),
                      },
                      {
                        path: ':userId',
                        handle: { crumbParam: 'userId' },
                        lazy: lazyPage(
                          () => import('@/features/users/UserDetailPage'),
                          'UserDetailPage',
                        ),
                      },
                    ],
                  },
                  {
                    path: 'invitations',
                    handle: { crumb: 'invitations' },
                    element: <ModuleGate module="tenants" titleKey="invitations" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/tenants/InvitationsPage'),
                          'InvitationsPage',
                        ),
                      },
                    ],
                  },
                  {
                    path: 'roles',
                    handle: { crumb: 'roles' },
                    element: <ModuleGate module="access" titleKey="roles" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/access/RolesPage'), 'RolesPage'),
                      },
                    ],
                  },
                  {
                    path: 'permissions',
                    handle: { crumb: 'permissions' },
                    element: <ModuleGate module="access" titleKey="permissions" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/access/PermissionsPage'),
                          'PermissionsPage',
                        ),
                      },
                    ],
                  },
                  {
                    path: 'api-keys',
                    handle: { crumb: 'apiKeys' },
                    element: <ModuleGate module="access" titleKey="apiKeys" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/access/ApiKeysPage'),
                          'ApiKeysPage',
                        ),
                      },
                    ],
                  },
                  {
                    path: 'records',
                    handle: { crumb: 'records' },
                    element: <ModuleGate module="records" titleKey="records" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/records/RecordsPage'),
                          'RecordsPage',
                        ),
                      },
                    ],
                  },
                  // ---- Data & Storage ----
                  {
                    path: 'data',
                    handle: { crumb: 'dataOverview' },
                    element: <ModuleGate module="records" titleKey="dataOverview" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/storage/DataOverviewPage'),
                          'DataOverviewPage',
                        ),
                      },
                    ],
                  },
                  {
                    path: 'files',
                    handle: { crumb: 'files' },
                    element: <ModuleGate module="files" titleKey="files" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/storage/FilesPage'), 'FilesPage'),
                      },
                    ],
                  },
                  // ---- end Data & Storage ----
                  // ---- Events & Jobs (module `events`) ----
                  {
                    path: 'jobs',
                    handle: { crumb: 'jobs' },
                    element: <ModuleGate module="jobs" titleKey="jobs" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/events/JobsPage'), 'JobsPage'),
                      },
                      {
                        path: ':jobId',
                        handle: { crumbParam: 'jobId' },
                        lazy: lazyPage(
                          () => import('@/features/events/JobDetailPage'),
                          'JobDetailPage',
                        ),
                      },
                    ],
                  },
                  {
                    path: 'schedules',
                    handle: { crumb: 'schedules' },
                    element: <ModuleGate module="schedules" titleKey="schedules" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/events/SchedulesPage'),
                          'SchedulesPage',
                        ),
                      },
                    ],
                  },
                  {
                    path: 'events',
                    handle: { crumb: 'events' },
                    element: <ModuleGate module="events" titleKey="events" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/events/EventsPage'), 'EventsPage'),
                      },
                    ],
                  },
                  {
                    path: 'webhooks',
                    handle: { crumb: 'webhooks' },
                    element: <ModuleGate module="webhooks" titleKey="webhooks" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/events/WebhooksPage'),
                          'WebhooksPage',
                        ),
                      },
                      {
                        path: ':webhookId',
                        handle: { crumbParam: 'webhookId' },
                        lazy: lazyPage(
                          () => import('@/features/events/WebhookDetailPage'),
                          'WebhookDetailPage',
                        ),
                      },
                    ],
                  },
                  // ---- end Events & Jobs ----
                  /* ---- Usage & Billing (studio-billing) ---- */
                  {
                    path: 'usage',
                    handle: { crumb: 'usage' },
                    element: <ModuleGate module="usage" titleKey="usage" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/usage/UsagePage'), 'UsagePage'),
                      },
                    ],
                  },
                  {
                    path: 'plans',
                    handle: { crumb: 'plans' },
                    element: <ModuleGate module="billing" titleKey="plans" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/billing/PlansPage'), 'PlansPage'),
                      },
                    ],
                  },
                  {
                    path: 'subscriptions',
                    handle: { crumb: 'subscriptions' },
                    element: <ModuleGate module="billing" titleKey="subscriptions" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/billing/SubscriptionsPage'),
                          'SubscriptionsPage',
                        ),
                      },
                      {
                        path: ':tenantId',
                        handle: { crumbParam: 'tenantId' },
                        lazy: lazyPage(
                          () => import('@/features/billing/TenantBillingPage'),
                          'TenantBillingPage',
                        ),
                      },
                    ],
                  },
                  /* ---- end Usage & Billing ---- */
                  // ---- notify area ----
                  {
                    path: 'notifications',
                    handle: { crumb: 'notifications' },
                    element: <ModuleGate module="notifications" titleKey="notifications" />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(
                          () => import('@/features/notify/NotificationsPage'),
                          'NotificationsPage',
                        ),
                      },
                      {
                        path: 'templates/new',
                        handle: { crumb: 'notifyNewTemplate' },
                        lazy: lazyPage(
                          () => import('@/features/notify/TemplateEditorPage'),
                          'TemplateEditorPage',
                        ),
                      },
                      {
                        path: 'templates/:templateKey',
                        handle: { crumbParam: 'templateKey' },
                        lazy: lazyPage(
                          () => import('@/features/notify/TemplateEditorPage'),
                          'TemplateEditorPage',
                        ),
                      },
                    ],
                  },
                ],
              },
              {
                path: '*',
                lazy: lazyPage(() => import('@/features/system/NotFoundPage'), 'NotFoundPage'),
              },
            ],
          },
        ],
      },
    ],
  },
];

export function createRouter() {
  return createBrowserRouter(routes);
}
