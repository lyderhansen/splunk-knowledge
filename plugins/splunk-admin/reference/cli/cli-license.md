# splunk licenser | licenses

Administrative CLI surface for **Splunk licensing**—stacks, pools, peers, and license files.

**Runs on:** **License manager** / **standalone license master** contexts; **license peers** expose subset operations.

**Splunk Cloud:** Licensing is subscription-managed—this CLI category targets **Splunk Enterprise** on-premises stacks.

**Restart:** Adding/removing licenses sometimes requires **restart** or `splunk reload` behaviors—follow `./splunk help` output warnings.

---

## splunk add licenses

Adds a license file or license payload to the license stack.

### Syntax

```bash
./splunk add licenses <path_or_descriptor> [options]
```

### Options

See `./splunk help add licenses` for `-auth`, `-uri`, and overwrite semantics.

### Example

```bash
./splunk add licenses /opt/splunk/etc/licenses/enterprise.lic
```

---

## splunk remove licenses

Removes license objects per CLI/help identifiers.

### Syntax

```bash
./splunk remove licenses <identifier> [options]
```

---

## splunk list licenses

Lists installed licenses across stacks.

### Syntax

```bash
./splunk list licenses
```

---

## splunk add licenser-pools | remove licenser-pools | list licenser-* 

Advanced license pool management (`licenser-pools`, `licenser-stacks`, messages, peers, groups, localpeer per Administrative CLI matrix).

### Syntax examples

```bash
./splunk list licenser-pools
./splunk list licenser-peers
./splunk list licenser-groups
./splunk list licenser-stacks
./splunk list licenser-messages
./splunk add licenser-pools ...
./splunk remove licenser-pools ...
```

### Notes

- Mirror REST endpoints documented under **Licenser** in REST Reference Manual.

---

## splunk edit licenser-groups | licenser-localpeer

Tune license allocation parameters.

### Syntax

```bash
./splunk edit licenser-groups ...
./splunk edit licenser-localpeer ...
```

---

**Documentation:** Splunk **Administrator Manual** licensing chapters, [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands).
