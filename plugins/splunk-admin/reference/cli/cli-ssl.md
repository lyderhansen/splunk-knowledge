# splunk createssl | web SSL enablement

Generate Splunk-managed **TLS materials** and toggle Splunk Web TLS listeners via CLI-adjacent workflows.

**Runs on:** Any Splunk Enterprise instance needing local certs (typically **search heads** / **standalone** for Splunk Web).

**Splunk Cloud:** Customer-managed components only—Cloud UI/stack TLS is Splunk-operated.

**Restart:** Replacing certificates or toggling SSL nearly always requires **`splunk restart`** (and sometimes OS firewall updates).

---

## splunk createssl

Creates Splunk-generated certificates for component bootstrap/testing.

### Syntax

```bash
./splunk createssl <subcommand> [options]
```

Common subcommands (confirm with `./splunk help createssl` on your version):

| Subcommand | Typical purpose |
|------------|-----------------|
| `server-cert` | Server TLS key/cert pairs for splunkd-forwarded protocols |
| `web-cert` | Splunk Web HTTPS certificate material |
| Root / CA helpers | Building signing chains for lab deployments |

### Frequently used flags (examples—verify via help)

| Flag | Description | Default |
|------|-------------|---------|
| `-d <directory>` | Output directory under `$SPLUNK_HOME/etc/auth` tree | Varies |
| `-n <name>` | Certificate naming / CN-related selector | Required contexts |
| `-c <string>` | Additional distinguished name components per help | Optional |
| `-l <bits>` | RSA key length (e.g., `2048`, `4096`) | Product default |

### Example patterns

```bash
./splunk createssl web-cert -n myhost.example.com -l 2048
./splunk createssl server-cert -d $SPLUNK_HOME/etc/auth/mycerts -n splunkd -c splunk-indexer
```

### Notes

- Modern browsers require **SAN extensions**—pure legacy CN-only certs may warn or fail validation.
- Prefer **enterprise PKI** or public CA certificates for production rather than long-lived self-signed materials.

---

## splunk enable web-ssl | splunk disable web-ssl

Toggles whether Splunk Web listens over HTTPS vs HTTP—pairs with `web.conf` and certificate paths.

### Syntax

```bash
./splunk enable web-ssl
./splunk disable web-ssl
```

### Notes

- Certificate paths and cipher suites remain configured in **`web.conf`** / **`server.conf`** depending on release—CLI toggles high-level enablement only.

---

## “splunk show ssl” / renewal workflows

Splunk does **not** ship a single canonical **`splunk renew ssl`** command documented alongside `createssl` in the Administrative CLI matrix—renewal is typically:

1. Obtain renewed PEM/key from your CA.
2. Replace files referenced by `web.conf` (`privKeyPath`, `serverCert`, CA chain paths).
3. **`splunk restart`**.

Use `./splunk cmd openssl ...` helpers where documented for inspection:

```bash
./splunk cmd openssl x509 -in $SPLUNK_HOME/etc/auth/splunkweb/cert.pem -noout -text
```

---

**Documentation:** [How to create and sign your own TLS certificates](https://docs.splunk.com/Documentation/Splunk/latest/Security/Howtoself-signcertificates), Splunk **Securing Splunk** manuals, `./splunk help createssl`.
