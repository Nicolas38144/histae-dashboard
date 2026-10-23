# Third-party licensing review

Reviewed on 2026-10-23.

[Histae's proprietary source-access terms](LICENSE.md) apply only to original Histae
materials. Dependencies, SDKs, fonts, container images and other third-party materials
retain their own licenses and rights, including reuse rights those licenses grant.

## Build dependencies and deployed artifacts

`caniuse-lite` 1.0.30001731 and 1.0.30001815 declare CC-BY-4.0. Preserve applicable
attribution when redistributing its data. Build/test packages and optional platform
packages are included in resolution but are not necessarily shipped to browsers.
Check the final JavaScript output, preserved license comments and container image
separately. Original dashboard code remains proprietary.

## Recorded package metadata

560 package-version entries are recorded in [THIRD_PARTY_LICENSES.json](THIRD_PARTY_LICENSES.json). These counts include build/test and optional packages and may repeat a package across nested tools. They do not describe the contents of a production artifact.

| Declared license expression | Entries |
| --- | ---: |
| `(MIT OR CC0-1.0)` | 2 |
| `Apache-2.0` | 34 |
| `BSD-2-Clause` | 9 |
| `BSD-3-Clause` | 8 |
| `BlueOak-1.0.0` | 3 |
| `CC-BY-4.0` | 2 |
| `CC0-1.0` | 1 |
| `ISC` | 28 |
| `MIT` | 468 |
| `MIT-0` | 4 |
| `Python-2.0` | 1 |

## Release responsibilities and limits

This review records declared licenses, not a complete attribution or license-text bundle.
Keep upstream copyright statements, LICENSE/NOTICE files and required attribution with
distributed components. Meet applicable source-availability and other copyleft requirements;
do not strip existing generated license information or third-party notices from bundles.
An `AND` expression requires satisfying both licenses; an `OR` expression allows a choice
subject to its terms. Unusual or custom expressions need the corresponding upstream text.

Before a release, review the actual dependency versions and shipped platform artifacts,
collect their full required texts and document any modifications. Base-image packages,
external service contracts, model weights and unpinned Python transitive packages have not
received a complete artifact-level review. No compatibility, ownership or legal-compliance
certification is asserted. This report does not revoke any earlier valid license grant.
