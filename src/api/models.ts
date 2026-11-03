/**
 * Domain models used by the Studio, as aliases of the generated OpenAPI types
 * (`schema.d.ts`, produced by `npm run api:sync` from `api/openapi.json`).
 *
 * Nothing else in the app imports `schema.d.ts` directly, so a contract change shows up as
 * type errors where the affected fields are used.
 */
import type { components } from './schema';

type Schemas = components['schemas'];

/** Cursor-paginated list envelope (API_CONVENTIONS "Requests and responses"). */
export interface Page<T> {
  items: T[];
  next_cursor?: string | null;
}

export type ApiVersion = Schemas['ApiVersion'];
/** The contract reports `{major, minor}`; a "1.3" string is accepted defensively. */
export type ApiVersionValue = ApiVersion | string;

export type Meta = Schemas['Meta'];
export type OidcProvider = Schemas['OidcProviderInfo'];

/** The browser session (`GET /v1/auth/session`), carrying the CSRF token. */
export type AuthSession = Schemas['SessionInfo'];
/** One entry of a session list (`GET /v1/auth/sessions`, `GET /v1/users/{id}/sessions`). */
export type UserSession = Schemas['Session'];

export type User = Schemas['User'];
export type UserStatus = User['status'];
export type Me = Schemas['Me'];
export type ProductAccess = Schemas['ProductAccess'];
export type TenantAccess = Schemas['TenantAccess'];

export type Product = Schemas['Product'];
export type ProductOverview = Schemas['ProductOverview'];
export type ProductMember = Schemas['ProductMember'];
export type TenantMember = Schemas['Membership'];
export type Tenant = Schemas['Tenant'];
export type Invitation = Schemas['Invitation'];
export type NewInvitation = Schemas['NewInvitation'];

export type Permission = Schemas['PermissionInfo'];
export type Role = Schemas['Role'];
export type ApiKey = Schemas['ApiKey'];
export type NewApiKey = Schemas['NewApiKey'];

export type CollectionStats = Schemas['CollectionStats'];
export type DataRecord = Schemas['Record'];
export type AuditEvent = Schemas['AuditEvent'];
export type Health = Schemas['Health'];
export type ServerSettings = Schemas['EffectiveSettings'];
export type RevokeResult = Schemas['RevokeResult'];

// Request bodies
export type SetupInput = Schemas['SetupRequest'];
export type PasswordLoginInput = Schemas['PasswordLogin'];
export type OidcStartInput = Schemas['OidcStartRequest'];
export type OidcStartAnswer = Schemas['OidcStartAnswer'];
export type MePatch = Schemas['MeUpdate'];
export type PasswordChangeInput = Schemas['PasswordChange'];
export type ProductInput = Schemas['ProductCreate'];
export type ProductPatch = Schemas['ProductUpdate'];
export type TenantInput = Schemas['TenantCreate'];
export type TenantPatch = Schemas['TenantUpdate'];
export type MemberInput = Schemas['MemberSet'];
export type InvitationInput = Schemas['InvitationCreate'];
export type RoleInput = Schemas['RoleCreate'];
export type RolePatch = Schemas['RoleUpdate'];
export type ApiKeyInput = Schemas['ApiKeyCreate'];
export type UserPatch = Schemas['UserUpdate'];

/** Shape shared by product and tenant members, used by the generic members table. */
export interface MemberLike {
  user_id: string;
  /** `null` for users without an email address (external identity only). */
  email: string | null;
  name: string;
  role: string;
  created_at: string;
}

export type UserPreferences = { theme?: 'light' | 'dark' | 'system'; [key: string]: unknown };

// ---- Notifications (notify module) ----------------------------------------------------
export type NotifyTemplate = Schemas['Template'];
export type NotifyTemplateVariant = Schemas['TemplateVariant'];
export type NotifyTemplateInput = Schemas['TemplateCreate'];
export type NotifyTemplatePatch = Schemas['TemplateUpdate'];
export type NotifyDraftPreviewInput = Schemas['DraftPreviewRequest'];
export type NotifyPreviewInput = Schemas['PreviewRequest'];
export type NotifyRendered = Schemas['RenderedContent'];
export type NotifySendInput = Schemas['SendRequest'];
export type NotifyMessage = Schemas['Message'];
export type NotifyMessageStatus = NotifyMessage['status'];
export type NotifyMailboxEntry = Schemas['MailboxEntry'];
export type NotifyStats = Schemas['DeliveryStats'];
export type NotifyStatusCounts = Schemas['StatusCounts'];
export type NotifyPreferences = Schemas['Preferences'];

// ---- Events & Jobs (module `events`) ---------------------------------------------------
export type Job = Schemas['Job'];
export type JobStatus = Job['status'];
export type JobStats = Schemas['JobStats'];
export type JobKindStats = Schemas['KindStats'];
export type JobInput = Schemas['JobCreate'];
export type Schedule = Schemas['Schedule'];
export type ScheduleInput = Schemas['ScheduleCreate'];
export type SchedulePatch = Schemas['ScheduleUpdate'];
export type DomainEvent = Schemas['Event'];
export type EventInput = Schemas['EventCreate'];
export type WebhookEndpoint = Schemas['WebhookEndpoint'];
export type WebhookInput = Schemas['WebhookCreate'];
export type WebhookPatch = Schemas['WebhookUpdate'];
export type NewWebhookSecret = Schemas['NewWebhookSecret'];
export type WebhookDelivery = Schemas['Delivery'];
export type WebhookDeliveryStatus = WebhookDelivery['status'];

// ---- Data & Storage (storage module, record writes) ------------------------------------
export type FileInfo = Schemas['FileInfo'];
export type FilePatch = Schemas['FileUpdate'];
export type DownloadUrl = Schemas['DownloadUrl'];
export type TenantStorageUsage = Schemas['TenantStorageUsage'];
export type ProductStorageUsage = Schemas['ProductStorageUsage'];
export type QuotaInput = Schemas['axentra__api__routes__storage__QuotaSet'];
export type StoragePolicy = Schemas['StoragePolicy'];
export type StoragePolicyInput = Schemas['StoragePolicySet'];

// ---- Search (module `search`) -----------------------------------------------------------
export type SearchHit = Schemas['SearchHit'];
export type SearchDocument = Schemas['SearchDocument'];

// ---- Usage & Billing (studio-billing) ----------------------------------------------------
export type Meter = Schemas['Meter'];
export type MeterInput = Schemas['MeterCreate'];
export type MeterPatch = Schemas['MeterUpdate'];
export type MeterUsage = Schemas['MeterUsage'];
export type TenantMeterTotal = Schemas['TenantMeterTotal'];
export type TimeSeries = Schemas['TimeSeries'];
export type TimePoint = Schemas['TimePoint'];
export type UsageEvent = Schemas['UsageEvent'];
export type UsageRecordInput = Schemas['UsageRecord'];
export type UsageRecordResult = Schemas['RecordResult'];
export type QuotaStatus = Schemas['QuotaStatus'];
export type EffectiveLimit = Schemas['EffectiveLimit'];
export type UsageQuotaInput = Schemas['axentra__api__routes__usage__QuotaSet'];
export type Reservation = Schemas['Reservation'];
export type ReservationCommitInput = Schemas['ReservationCommit'];
export type Plan = Schemas['Plan'];
export type PlanInput = Schemas['PlanCreate'];
export type PlanPatch = Schemas['PlanUpdate'];
export type Price = Schemas['Price'];
export type PriceInput = Schemas['PriceIn'];
export type Subscription = Schemas['Subscription'];
export type SubscriptionStatus = NonNullable<Schemas['Entitlements']['subscription_status']>;
export type Entitlements = Schemas['Entitlements'];
export type CheckoutInput = Schemas['CheckoutCreate'];
export type CheckoutSession = Schemas['CheckoutSession'];
