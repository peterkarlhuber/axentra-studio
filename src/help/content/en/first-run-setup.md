---
title: First-run setup
summary: Create the first platform administrator of a new Axentra server with a one-time setup token.
keywords: setup, install, initial setup, first start, bootstrap, setup token, first admin, platform administrator, onboarding, set up Axentra
related: signing-in, first-steps, concepts, users, security, server-configuration
---

A new Axentra server has no administrator yet. As long as that is the case, the server reports
"setup required" and Studio shows the page **Set up Axentra** instead of the sign-in page. There you
create the first **platform administrator**: the account with full control of the installation.
You need a **setup token** from the person who runs the server.

## Before you start {#before-you-start}

> [!IMPORTANT]
>
> - The Axentra server is running and Studio can reach it.
> - Nobody has completed setup yet. The page is available only until the first platform
>   administrator exists.
> - Someone with shell access to the server can run the `axentra` command.

## Get a setup token {#setup-token}

The setup token proves that you are allowed to claim the new server. It is created on the server
itself, so only someone who controls the server can hand it out.

1. On the server (or in the server's container), run:

   ```bash
   axentra admin setup-token
   ```

2. The command prints a token that starts with `axsetup_`. Copy it.

| Property     | Value                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validity     | 60 minutes by default (operator setting `security.setup_token_ttl_minutes`, at least 5).                                                                   |
| Use          | Once. A used token stops working.                                                                                                                          |
| Availability | Only while no platform administrator exists. If one exists, the command prints "setup is already complete (a platform admin exists)" and creates no token. |

You can create a new token at any time while setup is still open; older unused tokens stay valid
until they expire.

> [!CAUTION]
> The setup token grants full control of the server to whoever uses it first. Hand it only to the
> person who creates the first administrator, over a private channel, and create a fresh one rather
> than forwarding an old one by email.

## Create the first administrator {#create-admin}

1. Open Studio in your browser. **Set up Axentra** appears automatically.
2. Optionally choose your language with the language selector below the form.
3. Fill in the form:

   | Field               | What to enter                                                                         |
   | ------------------- | ------------------------------------------------------------------------------------- |
   | **Setup token**     | The token from the server, for example `axsetup_EXAMPLE…`.                            |
   | **Full name**       | Your name as other administrators will see it.                                        |
   | **Email address**   | The address you will sign in with.                                                    |
   | **Password**        | A long, unique password (see [password rules](help:first-run-setup#password-policy)). |
   | **Repeat password** | The same password again.                                                              |

4. Choose **Create administrator**.

**Expected result:** Studio reports **Setup complete** ("You are now signed in as platform
administrator") and opens Studio. In multi-product mode with no product yet, you land on
**Products** with the hint to create the first product; in single-product mode you land on the
dashboard of the server's one product.

## Password rules {#password-policy}

The server checks the password and refuses it if it breaks one of these rules:

| Rule                  | Default                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| Minimum length        | 12 characters (operator setting `security.password_min_length`, at least 8). |
| Maximum length        | 1024 characters.                                                             |
| Not the email address | The password must not equal the email address (ignoring case).               |
| Not trivial           | At least 4 different characters.                                             |

Passwords are stored as Argon2id hashes; nobody, including the operator, can read them back.

## After setup {#after-setup}

- The setup page is no longer reachable; opening `/setup` leads to the sign-in page.
- Your account holds the **Platform administrator** role. The event `identity.setup.complete` is in
  the [audit log](help:audit).
- Your session works like any other sign-in session (see [signing in](help:signing-in#session-end)).

Next steps:

1. Create your first product and tenant: [first steps](help:first-steps).
2. Give a second trusted person the platform administrator role, so the installation does not depend
   on one account (see [users](help:users)). They need an account first, for example through
   [single sign-on](help:signing-in#sso).
3. If the server should use single sign-on only, the operator can switch off password sign-in later
   (`security.password_login = false`).

## Troubleshooting {#troubleshooting}

| Message                                                                                                                                                                             | Cause                                                                                                      | What to do                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Setup token not accepted**                                                                                                                                                        | The token is mistyped, expired (older than 60 minutes by default) or already used.                         | Create a new token with `axentra admin setup-token` and paste it without spaces.              |
| **Setup is already complete**                                                                                                                                                       | Someone created a platform administrator in the meantime.                                                  | Sign in with that account, or ask its owner for access. Studio leads you to the sign-in page. |
| **The passwords do not match.**                                                                                                                                                     | **Password** and **Repeat password** differ.                                                               | Type both again.                                                                              |
| **Please check your input** with the server message "the password must have at least … characters", "the password must not equal the email address" or "the password is too simple" | The [password rules](help:first-run-setup#password-policy) were not met.                                   | Choose a longer password with more different characters.                                      |
| **Please check your input** with "invalid email address"                                                                                                                            | The email address is not valid.                                                                            | Correct the address.                                                                          |
| **Conflict** with the server message "a user with this email address exists"                                                                                                        | An account with this email address already exists (for example one created by library code).               | Use another address, or ask the operator.                                                     |
| **Too many requests**                                                                                                                                                               | Too many setup attempts from your network within one minute (the sign-in limit, 10 per minute by default). | Wait a minute and try again.                                                                  |
| Studio shows the sign-in page instead of the setup page                                                                                                                             | A platform administrator already exists.                                                                   | Sign in, or ask an existing administrator for an account.                                     |
| **Cannot connect to Axentra**                                                                                                                                                       | Studio cannot reach the server.                                                                            | Check the server and Studio's API address with the operator.                                  |
