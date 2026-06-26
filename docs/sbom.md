# Software Bill of Materials (SBOM)

Every release of Salem Tailors ships with a machine-readable SBOM so we can
prove exactly which dependency versions were in production at any point in
time, and quickly answer "are we affected by CVE-X?".

## What gets generated

The `.github/workflows/sbom.yml` workflow runs on:

- every published GitHub Release
- every pushed tag matching `v*`
- manual `workflow_dispatch`

It produces three artifacts per release, in `sbom/`:

| File                                           | Format          | Purpose                                |
| ---------------------------------------------- | --------------- | -------------------------------------- |
| `salem-tailors-<version>.cdx.json`             | CycloneDX 1.5   | Primary SBOM (security tooling)        |
| `salem-tailors-<version>.cdx.xml`              | CycloneDX 1.5   | XML variant for legacy ingestion       |
| `salem-tailors-<version>.spdx.json`            | SPDX 2.3        | Compliance / license review            |
| `manifest.json`                                | Custom          | Version + commit + timestamp metadata  |
| `SHA256SUMS.txt`                               | Plain text      | Integrity check for the above          |

Generators:

- **CycloneDX**: `@cyclonedx/cyclonedx-npm` (transitive deps from the installed
  `node_modules` tree, with `--omit dev` so only runtime deps ship)
- **SPDX**: Anchore Syft (`anchore/sbom-action`)

## Where to find an SBOM

1. **GitHub Releases** — attached as release assets on every published release.
2. **Workflow artifacts** — available for 90 days under the
   "Generate SBOM" workflow run for the corresponding tag.

## Verifying integrity

```sh
cd sbom
sha256sum -c SHA256SUMS.txt
```

## Reproducing locally

```sh
bun install --frozen-lockfile
npx @cyclonedx/cyclonedx-npm --output-format JSON \
  --output-file sbom.cdx.json --spec-version 1.5 --omit dev
```

## Responding to a CVE

1. Download the SBOM for the affected release tag.
2. Grep for the vulnerable `purl` or package name:
   ```sh
   jq '.components[] | select(.name=="ws") | {name,version,purl}' sbom.cdx.json
   ```
3. If present, cut a patch release and re-run the workflow to publish a fresh SBOM.
