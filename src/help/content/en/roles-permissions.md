---
title: Roles and permissions
summary: Understand permissions and the built-in roles, create custom roles for your product and read the product's permission catalog.
keywords: role, permission, custom role, built-in role, access rights, rights, privileges, scope, product permission, declared permission, retired permission, RBAC
related: permissions-reference, members-invitations, api-keys, users, security
---

A **permission** allows one action, for example `records:write` (create, change and delete
records). A **role** is a named bundle of permissions that you assign to people. Axentra denies
everything by default: a person or API key can do only what a role or the key's permission list
grants explicitly.

Every permission has a **scope**:

| Scope        | Applies to                                                              | Granted by                                                                           |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **platform** | The whole installation, for example `products:create`                   | Platform roles only; never custom roles or API keys                                  |
| **product**  | One product as a whole, for example `tenants:create`, `api_keys:manage` | Product roles and API keys                                                           |
| **tenant**   | Data inside one tenant, for example `records:read`                      | Tenant roles in that tenant; product roles and product-wide API keys in every tenant |

The full list is in the [permissions reference](help:permissions-reference).

> [!IMPORTANT]
> The **Roles** and **Permissions** screens need the access module and `roles:read` (the
> **Permissions** screen also opens with `api_keys:read`). Creating, editing and deleting custom
> roles needs `roles:manage` (product owners and product admins).

## Built-in roles {#built-in-roles}

Built-in roles are provided by Axentra and cannot be changed. Open [Roles](app:roles) and choose
the eye icon to see exactly which permissions a built-in role holds in your product.

| Role               | Scope   | Purpose                                                                                       |
| ------------------ | ------- | --------------------------------------------------------------------------------------------- |
| **Product owner**  | product | Full control of the product, including operators and product permissions                      |
| **Product admin**  | product | Manages tenants, roles, keys and data; cannot manage operators or declare product permissions |
| **Support**        | product | Reads everything; manages tenant members up to its own permissions (in practice: viewers)     |
| **Product viewer** | product | Read-only access to the product and all its tenants                                           |
| **Owner**          | tenant  | Full control of the tenant, including other owners                                            |
| **Admin**          | tenant  | Same permissions as Owner, but without owner rank                                             |
| **Member**         | tenant  | Works with the tenant's data                                                                  |
| **Viewer**         | tenant  | Read-only access to the tenant                                                                |

Two platform roles exist on top: **Platform administrator** and **Platform viewer**. They are
assigned on a user's page, see [users](help:users#platform-role).

## Create a custom role {#create}

Create a custom role when no built-in role fits, for example a support agent who may read records
but not files.

1. Open [Roles](app:roles) and choose **New custom role**.
2. Enter a **Name**.
3. Check the **Key**. Studio derives it from the name.
4. Choose the **Scope**: **Tenant** for roles you give to tenant members, **Product** for roles
   you give to product operators.
5. Optionally enter a **Description**.
6. Select the **Permissions** (see [the permission checklist](#checklist)).
7. Choose **Save changes**.

The role is now offered wherever members of its scope are added or invited.

| Field           | What it does                                                                      | Allowed values / default                                                                                                      |
| --------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Name**        | Display name in role lists.                                                       | 1–100 characters. Can be changed.                                                                                             |
| **Key**         | Stable identifier stored in memberships, for example `support_agent`.             | 2–41 lowercase letters, digits or underscores; unique in the product; not a built-in key such as `member`. Cannot be changed. |
| **Scope**       | **Tenant**: only tenant permissions. **Product**: product and tenant permissions. | Default **Tenant**. Cannot be changed.                                                                                        |
| **Description** | Explains the role to other administrators.                                        | Up to 500 characters.                                                                                                         |
| **Permissions** | What the role allows.                                                             | Up to 100 permissions. Platform permissions are never offered.                                                                |

## Edit a custom role {#edit}

Choose the pencil icon of a custom role, change name, description or permissions and choose
**Save changes**. Key and scope stay fixed.

> [!WARNING]
> Changes apply immediately to everyone who holds the role, in every tenant of the product.

## Delete a custom role {#delete}

1. Choose the trash icon of the role.
2. Type the role's name to confirm and choose **Delete role**.

A role that is still assigned to a member or operator cannot be deleted: the server answers
**Conflict** with the number of assignments. Give those people another role first.

## Use the permission checklist {#checklist}

The checklist appears in the role editor and when you create an API key.

- Permissions are grouped by resource (the part before the colon, for example `records`). The
  group checkbox selects or clears the whole group; the counter shows how many are selected.
- **Filter permissions…** searches names and descriptions.
- Groups marked **Product** hold permissions your product declared itself.
- Each permission shows its description and scope. A tenant role is offered only tenant
  permissions; retired product permissions are never offered.

> [!NOTE]
> A custom role may contain any permission of its scope. The [role
> ceiling](help:members-invitations#role-ceiling) applies when the role is _assigned_: only
> people who hold all of its permissions can give it to someone.

## Product-defined permissions {#product-permissions}

Besides the built-in catalog, a product can declare its own permissions for its own features, for
example `crm.deals:approve`. Their names always contain a dot: `<namespace>.<resource>:<action>`.
Once declared, they can be granted through custom roles and API keys like built-in ones, and your
product code checks them.

Open [Permissions](app:permissions) to see the product's catalog. With `permissions:manage` (product owners) you can also declare permissions there.

| Column              | Meaning                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Permission**      | Name and description.                                                                                                                                                                                  |
| **Scope**           | **product** or **tenant**.                                                                                                                                                                             |
| **Also granted to** | Built-in roles that hold it besides the automatic grants. **Read-only roles** means Support, Product viewer and Platform viewer hold it; **Owners and admins only** means no other built-in role does. |
| **Declared by**     | **Product code** (registered by the product's code at start) or **API** (declared over the HTTP API).                                                                                                  |
| **Status**          | **Active**, or **Retired** with the date. Turn on **Show retired** to list retired ones.                                                                                                               |

Product owners, product admins and platform administrators always hold every active product
permission; tenant owners and admins every tenant-scoped one.

> [!NOTE]
> Choose **Declare permission** to declare one over the API. For permissions declared that way, the
> pencil changes one (or re-activates a retired one) and the bin retires it after you type its name.
> Permissions registered by the product's code are changed in the code; Studio offers no actions for
> them. A product can declare up to 500 permissions.

### Retired permissions {#retired}

A retired permission grants nothing, even where it is still stored in a custom role or API key.
Declaring it again restores its effect for those holders. Saving a custom role in Studio keeps the
retired names it holds (the editor lists them below the checklist) and cannot add new ones, and
rotating an API key drops them from the replacement key.

## Troubleshooting {#troubleshooting}

**Conflict: "a role with this key exists" / "this key belongs to a built-in role".** Choose a
different key.

**Please check your input: "key must be 2-41 lowercase letters, digits or underscores".** Remove
capitals, dashes and spaces from the key.

**Conflict: "the role is assigned N times; reassign those members first".** Change the role of
those members (on the tenants' and the product's **Members** tabs) before deleting it.

**Please check your input: "permissions not allowed for a tenant role".** A tenant role can hold
tenant permissions only.

**The permission catalog could not be loaded.** You lack `roles:read` (or `api_keys:read`), or the
server is unreachable. Reload, or ask a product owner.

**Changed in the meantime.** Someone else saved the role while you were editing it. Close the
editor, reopen the role and repeat your change.

**A permission is missing from the checklist.** It is a platform permission (never grantable
here), a product permission of the other scope, or a retired one.
