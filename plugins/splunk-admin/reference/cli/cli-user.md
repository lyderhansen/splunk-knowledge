# splunk user | login | logout | hash-passwd | validate-passwd

Manage **Splunk authentication accounts** (native authentication) and related credential utilities from the shell.

**Runs on:** Instances using **Splunk native authentication** (typically **search heads**, **standalone**, or any node hosting REST auth—**not** applicable when SAML/LDAP exclusively manages passwords).

**Splunk Cloud:** Admin password flows are primarily **Splunk Web**–driven; CLI parity is limited vs Enterprise—confirm your Cloud role docs.

**Authoritative flags:** Splunk adds/changes flags between releases—always verify with:

```bash
./splunk help add user
./splunk help edit user
./splunk help remove user
./splunk help list user
```

---

## splunk add user

Creates a native Splunk user.

### Syntax

```bash
./splunk add user <username> [-parameter value] ...
```

### Options

Common flags (exact spellings/availability per `./splunk help add user`):

| Flag | Description | Default |
|------|-------------|---------|
| `-password <pwd>` | Initial password | Prompt / required |
| `-role <role>` | Assign Splunk role(s); repeatable or comma-separated per help | Must align to authorize.conf |
| `-email <email>` | Contact email when supported | Empty |
| `-realname <string>` | Display name when supported | Empty |
| `-force-change-pass <bool>` | Require password change at next login when supported | Per server defaults |
| `-auth <user>:<pass>` | Admin credentials if not cached via `login` | Prompt |
| `-uri ...` | Remote management target | Local |

### Example

```bash
./splunk add user analyst01 -password 'ChangeMe!!' -role user -auth admin:'yourAdminPass'
```

### Notes

- Prefer **`user-seed.conf`** / **`HASHED_PASSWORD`** flows for **bootstrap** installs (see Security docs).

---

## splunk edit user

Updates user attributes including password and roles.

### Syntax

```bash
./splunk edit user <username> [-parameter value] ...
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-password <pwd>` | New password | No change if omitted |
| `-role <role>` | Updated roles per help semantics | No change |
| `-email`, `-realname`, `-force-change-pass` | When supported | Per help |
| `-auth <admin>:<pass>` | Acting administrator credentials | Prompt |

### Example

```bash
./splunk edit user admin -auth admin:changeme -password 'new$StrongPass'
```

### Notes

- Official Splunk guidance documents password changes via **`splunk edit user ... -password`**—there is **no separate `change-password` command** in current manuals.
- Quote passwords that contain shell metacharacters (`$`, `!`, spaces).

---

## splunk remove user

Deletes a native user account.

### Syntax

```bash
./splunk remove user <username> [-auth user:pass]
```

### Notes

- Cannot remove users required by currently running services—plan maintenance.

---

## splunk list user

Lists configured users and attributes visible to your credential context.

### Syntax

```bash
./splunk list user [-auth user:pass]
```

---

## splunk login | splunk logout

Caches credentials locally for subsequent CLI commands (`login`), or clears them (`logout`).

### Syntax

```bash
./splunk login -auth <username>:<password>
./splunk logout
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-auth` | Inline credentials | Prompt |

### Notes

- Cached credentials are convenience features—protect shell history and shared accounts.

---

## splunk hash-passwd

Produces a password hash suitable for **`user-seed.conf`** automation.

### Syntax

```bash
./splunk hash-passwd <plaintext_password>
```

### Notes

- Plaintext appears in **process listings** and **shell history**—follow Splunk security warnings.
- Typical `user-seed.conf` usage:

```ini
[user_info]
USERNAME = admin
HASHED_PASSWORD = $6$...
```

---

## splunk validate-passwd

Checks a candidate password against Splunk password complexity rules.

### Syntax

```bash
./splunk validate-passwd <password>
cat passwd.txt | ./splunk validate-passwd -
```

### Notes

- Emits explicit requirement failures (length/complexity).

---

## splunk cmd splunkd rest --noauth (bootstrap / emergency)

Low-level REST bootstrap commands referenced in Splunk Security manual—**not** `splunk add user`, but critical for locked-out installs.

### Syntax

```bash
./splunk cmd splunkd rest --noauth POST /services/authentication/users \
  "name=admin&password=<pwd>&roles=admin"
```

Password reset example:

```bash
./splunk cmd splunkd rest --noauth POST /services/admin/users/admin "password=<pwd>"
```

### Notes

- Requires **`splunk restart`** afterward per Splunk docs.
- **Clear shell history**—plaintext secrets appear in history/`ps`.

---

**Documentation:** [Create secure administrator credentials](https://docs.splunk.com/Documentation/Splunk/latest/Security/Secureyouradminaccount), [Change a user password](https://docs.splunk.com/Documentation/Splunk/latest/Security/Changeapassword), [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands).
