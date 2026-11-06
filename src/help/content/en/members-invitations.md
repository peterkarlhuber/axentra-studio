---
title: Members and invitations
summary: Give people access to a tenant by adding them as members or inviting them by email, and understand the role ceiling that limits which roles you can assign.
keywords: member, membership, invite, invitation, invitation link, invitation token, accept invitation, role ceiling, owner, add user, onboarding, team
related: tenants, users, roles-permissions, products, tutorial-onboard-customer, notifications
---

A **member** is a user with a role in one tenant, for example **Owner**, **Admin**, **Member** or
**Viewer**. The role decides what the person can do in that tenant. You give someone access in one
of two ways:

- **Add** an existing account directly, when you can already see that account.
- **Invite** a person by email. They accept the invitation after signing in and become a member
  with the role you chose.

Operators of a whole product are managed on the product and can be invited to its team in the
same way, see [product team invitations](#product-team).

> [!IMPORTANT]
> Seeing a tenant's **Members** and **Invitations** tabs needs `members:read` in the tenant;
> adding, inviting, changing roles, removing and revoking needs `members:manage`. Tenant owners and
> admins hold both; **Support** operators hold `members:manage` but can assign only roles within
> their own permissions (see [role ceiling](#role-ceiling)). Both screens need the tenants module.

## Built-in tenant roles {#tenant-roles}

| Role                       | Can do                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Owner** (`tenant_owner`) | Everything in the tenant, including making other people owners.                                                          |
| **Admin** (`tenant_admin`) | The same permissions as Owner, but cannot assign, change or remove owners.                                               |
| **Member** (`member`)      | Works with the data: reads and writes records and files, publishes events, records usage, sends notifications, searches. |
| **Viewer** (`viewer`)      | Reads the tenant, its members, records, files, usage and billing, and searches.                                          |

Custom tenant roles of your product appear in the same lists, with their key in brackets. See
[roles and permissions](help:roles-permissions).

## Add an existing user {#add}

1. Open the tenant from [Tenants](app:tenants) and select the **Members** tab.
2. Choose **Add member**.
3. Enter the **Email address** and choose a **Role**.
4. Choose **Add member**.

This works only for accounts you can see: platform administrators see every account; users with
`product_users:read` (product owners, admins, support and viewers) see everyone who already
belongs to the product; everyone else sees only the tenant's own members. For any other address
the dialog shows **User not found** and offers **Send invitation instead**, which creates an
invitation with the same email and role.

> [!NOTE]
> Axentra answers "not found" in the same way whether an account does not exist or is merely not
> visible to you. This protects the list of accounts on the server from being probed.

## Change a role or remove a member {#change-role}

- To change a role, pick a new one in the member's **Role** column. The change applies
  immediately.
- To remove a member, choose the trash icon in the row and confirm **Remove member?**. The person
  loses all access granted by this membership. Their account and their other memberships stay.

A tenant always keeps at least one **Owner**: the last owner cannot be removed or given another
role. Make someone else owner first.

## Invite someone by email {#invite}

1. Open the tenant and select the **Invitations** tab, or open [Invitations](app:invitations)
   and pick the tenant.
2. Choose **Invite member**.
3. Enter the **Email address** and choose a **Role**. Studio preselects **Member**, or the first
   role you may assign.
4. Choose **Send invitation**.

The dialog **Invitation created** then shows the **Invitation link** (when available) and the
**Invitation token**.

> [!CAUTION]
> The link and the token are shown only once. Axentra stores only a hash of the token, so
> nobody can display it again. Anyone who has the token and signs in with the invited address can
> join the tenant. Share it only with the invited person. If it is lost, revoke the invitation and
> create a new one.

### How the invitation reaches the person {#delivery}

- **Notifications module enabled:** Axentra queues an invitation email to the address with the
  accept link, and Studio shows the same link so you can also send it yourself. The link uses the
  product setting `invitation_accept_url` if set (see [product settings](help:products#settings)),
  otherwise the server setting `notify.invitation_accept_url` (see
  [server configuration](help:server-configuration#user-visible-settings)), otherwise
  `/accept-invitation` on the server's public URL. Studio serves `/accept-invitation` and forwards
  it to its **Accept invitation** page, so the default works when Studio runs on the API's address.
  When Studio has its own address (for example `https://studio.example.com` next to
  `https://api.example.com`), the default points to the API: set `notify.invitation_accept_url`
  (or the product setting) to `https://<your Studio address>/invitations/accept`.
- **Notifications module disabled:** no email is sent and there is no link. Share the
  **Invitation token**; the person enters it on Studio's **Accept invitation** page.

### Invitation lifetime and status {#expiry}

| Status       | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Pending**  | Open and valid; can be accepted or revoked.                      |
| **Accepted** | Used; the person is a member.                                    |
| **Revoked**  | Cancelled with **Revoke invitation**; the token no longer works. |
| **Expired**  | Not accepted within **7 days** of creation.                      |

The 7-day lifetime is fixed. To extend it, revoke the invitation (if still pending) and invite
again. Only one open invitation per email address and tenant can exist at a time.

### Revoke an invitation {#revoke}

Choose the trash icon next to a **Pending** invitation and confirm **Revoke invitation?**. The
link and token stop working immediately.

## Invite operators to a product team {#product-team}

Operators (users with a product role, see [products](help:products#members)) can be invited by
email as well. Open the product from [Products](app:products) and select the **Invitations** tab, or
choose **Send invitation instead** when **Add member** on the **Members** tab does not find the
address. Studio preselects **Product viewer**, or the first product role you may assign.

- The tab needs `product_members:read`; inviting and revoking needs `product_members:manage`.
- The link, the token, delivery, the 7-day lifetime and revoking work as for tenant invitations.
  The token starts with `axpinv_`, and the **Accept invitation** page recognizes it.
- After accepting, the person has the product role in every tenant of the product. A product role
  the person already holds stays unchanged.
- Nobody can join the team of an archived product. The invitation stays unused until the product
  is restored.

## Accept an invitation {#accept}

This is what the invited person does:

1. Open the invitation link. If you are not signed in, **Sign in** says that you are signing in
   for an invitation and brings you back to it afterwards, also after single sign-on.
2. Sign in with the account whose email address is the invited address. No account yet? If the
   sign-in page offers single sign-on, sign in there with the invited address: the server creates
   your account because an invitation is open for it. There is no sign-up with a password; ask the
   person who invited you or an administrator.
3. Check the account shown under **Signed in as** and choose **Accept invitation**. After a password
   sign-in, nothing happens before you confirm. Studio takes the token out of the address bar as
   soon as the page has read it, so it does not stay in the browser history; the **Invitation
   token** field is filled in. If you only have the token, open **Accept invitation** at
   `/invitations/accept` and paste it.

With single sign-on, the server accepts the invitation as soon as you are signed in. Studio checks
that you are now a member of the tenant and shows **Invitation accepted** right away, without a
second confirmation. If the server could not accept it (for example because you signed in with
another address), the page asks for your confirmation as in step 3 and explains what went wrong.

**Invitation accepted** names the tenant, the product and your role; **Open the tenant** takes you
there. If you were already a member of the tenant, your existing role stays unchanged.

> [!IMPORTANT]
> An invitation can be accepted only by a signed-in user whose account has exactly the invited
> email address (letter case does not matter). Users without an email address cannot accept
> invitations; add them directly instead.

## Role ceiling: which roles you can assign {#role-ceiling}

Holding `members:manage` does not let you hand out more than you have yourself. The server
enforces these rules, and Studio shows them in advance:

1. **Permissions.** You can assign a role (add, invite or change to it) only if you hold every
   permission of that role in the same tenant. You can change or remove a member only if their
   _current_ role is also within your permissions.
2. **Owner rank.** The **Owner** role can be assigned, changed or removed only by an owner of the
   tenant, by a product operator, by a product-wide API key, or by a platform administrator.
3. **Last owner.** The last owner of a tenant (and the last **Product owner** of a product) cannot
   be removed or demoted.

| You are                           | You can assign                         | You cannot                                       |
| --------------------------------- | -------------------------------------- | ------------------------------------------------ |
| Platform administrator            | Every role                             | Nothing is limited                               |
| Product owner or product admin    | Every tenant role, including **Owner** | (Product admins cannot manage product operators) |
| **Support** operator              | **Viewer**                             | **Member**, **Admin**, **Owner**                 |
| Tenant **Owner**                  | Every role of the tenant               | Remove the last owner                            |
| Tenant **Admin**                  | **Admin**, **Member**, **Viewer**      | Assign, demote or remove an **Owner**            |
| Custom role with `members:manage` | Roles whose permissions it holds       | Stronger roles                                   |

In Studio, roles you cannot assign appear as **“… (above your permissions)”** and are disabled,
and members you cannot change show **Above your own role**, without a role picker or remove
button.

> [!NOTE]
> Studio can compute the ceiling only when you can read the product's roles (`roles:read`).
> Without it, the role is a free-text field and the server explains a refusal with **Not
> permitted**.

## Troubleshooting {#troubleshooting}

**User not found.** The account does not exist, or you are not allowed to see it. Use **Send
invitation instead**.

**Conflict: "an open invitation for this email exists".** A pending invitation for this address
already exists in the tenant. Use it, or revoke it and invite again.

**Not permitted: "you cannot assign the role …: it has permissions you do not hold".** The role is
above your level. Choose a weaker role or ask an owner. See [role ceiling](#role-ceiling).

**Not permitted: "only owners can assign the role tenant_owner".** Only owners, product operators
and platform administrators can manage owners.

**Conflict: "the tenant needs at least one owner".** You tried to remove or demote the last owner.

**Please check your input: "unknown tenant role …".** The role key does not exist in this
product (for example a typo in the free-text role field), or it is a product role.

**When accepting: This invitation cannot be used.** The server gives the same answer for an
invitation that has expired (after 7 days), was already accepted or was revoked, and for a link or
token that is incomplete or mistyped, so that nobody can probe invitations. Ask the person who
invited you for a new invitation.

**When accepting: Invitation for another email address.** You are signed in with an account for a
different address. Choose **Sign out and use the invited address**: after you sign in with the
invited address, Studio brings you back to the invitation. Or ask for an invitation to your own
address.

**When accepting: Your account has no email address.** Such accounts cannot accept invitations.
Sign in with the invited address, or ask the person who invited you to add your account to the
tenant directly.

**When accepting: The tenant is not active.** The tenant you were invited to, or its product, is
suspended or closed, so nobody can join it now. The invitation stays unused. Once the tenant is
active again, open the link again. The server refuses with "the invitation cannot be accepted: the
tenant is not active".

**When accepting: The invitation is no longer valid.** The person who invited you can no longer
grant the role, for example because their own role or membership changed after they sent the
invitation. Ask them or another administrator of the tenant for a new invitation. The server
refuses with "the invitation is no longer valid: its sender can no longer grant this role".

**When accepting: The server could not be reached.** Nothing was changed. Check your connection and
choose **Try again**.

**The invitation link opens "page not found" or a page of the API.** The link points to an address
where Studio does not run. Set the server setting `notify.invitation_accept_url` (or the product
setting `invitation_accept_url`) to Studio's accept page, see [delivery](#delivery). Until then,
send the token and have the person paste it under `/invitations/accept`.

**The invited person cannot sign in.** They have no account yet. Studio cannot create accounts and
there is no password sign-up. An invited person gets an account by signing in through single
sign-on with the invited, verified email address; without single sign-on, ask a platform
administrator. See [signing in](help:signing-in).

**The invitation dialog shows only a token.** The notifications module is disabled, so no link was
generated. Share the token.
