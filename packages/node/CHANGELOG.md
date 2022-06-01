# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

All logs must start with the format: [x.y.z] - yyyy-mm-dd

## [Unreleased]

## [1.1.1] - 2022-06-01
### Fixed
- Fix disabling historical (#1085)
- Fix benchmark logging (#1083)

## [1.1.0] - 2022-05-31
### Fixed
- Move POI logic under option check (#1064)
### Added
- Add api to query file based mmr (#968)
- Experimental feature: Support query by block number (#992)
### Changed
Remove `contract-processors` to [subquery/datasource-processors](https://github.com/subquery/datasource-processors), types improvements and support for datasource processors v1.0.0 (#1012)

## [1.0.0] - 2022-05-11
- Major release

## [0.35.2] - 2022-05-10
Priority: High. Fixes events being handled multiple times, issue was introduced in 0.34.0

### Fixed
- Events being handled multiple times (#994)

## [0.35.1] - 2022-05-06
### Changed
- Bump with `@subql/utils`

## [0.35.0] - 2022-05-02
### Added
- Add utils package (#928)
### Fixed
- Handle undefined filters (#929)
### Changed
- Update polkadot 8.2.1 (#910)

## [0.6.1] - 2022-04-27
### Fixed
- Running projects without templates (#924)

## [0.6.0] - 2022-04-27
### Added
- Support for Terra dynamic datasources (#899)

## [0.5.3] - 2022-04-26
### Fixed
- Handle being fully synced with terra (#904)

## [0.5.2] - 2022-04-19
### Fixed
- Dictionary queries, invalid response (#893)
- Fix injecting wrong api object to sandbox (#896)
- Parse TxInfo from mantlemint (#897)

## [0.5.1] - 2022-04-13
### Changed
- Renamed `mantlemint` cli flag to `network-mantlemint` and fix overwriting project endpoint (#889)

## [0.5.0] - 2022-04-12
### Added
- Support for mantlemint endpoint (#885)
- Configuring a timeout for terra node requests (#885)
- Keep Terra node connections alive (#886)

## [0.4.0] - 2022-04-06
### Added
- Add support for handle manifest 1.0.0 (#845)
- Support use custom ipfs gateway (#881)

## [0.3.0] - 2022-04-04
### Changed
- Update to use `vm2`(#869)

## [0.2.0] - 2022-03-22
### Added
- Add contract handling for terra (#848)

## [0.1.2] - 2022-03-15
### Fixed
- Fix unable able fetch with small batch size issue (#847)

## [0.1.1] - 2022-03-10
### Fixed
- Fix enum sort order (#844)

## [0.1.0] - 2022-03-01
### Added
- init commit

[Unreleased]: https://github.com/subquery/subql/compare/node-terra/0.2.0...HEAD
[0.2.0]: https://github.com/subquery/subql/compare/node/0.1.1...node/0.2.0
[0.1.2]: https://github.com/subquery/subql/compare/node/0.1.1...node/0.1.2
[0.1.1]: https://github.com/subquery/subql/compare/node/0.1.0...node/0.1.1
