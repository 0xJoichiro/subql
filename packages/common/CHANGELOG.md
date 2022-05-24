# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

All logs must start with the format: [x.y.z] - yyyy-mm-dd

## [Unreleased]

## [1.0.0] - 2022-05-11
- Major release

## [0.23.0] - 2022-05-11
### Fixed
- Fix toDeployment with ds processor assets (#1000)
### Added
- Add method to get path for manifest and schema, in order improve cli codegen (#1001)

## [0.22.0] - 2022-05-02
### Added
- Add utils package (#928)

## [0.4.0] - 2022-04-27
### Added
- Support for Terra dynamic datasources (#899)

## [0.3.0] - 2022-04-12
### Added
- `network.mantlemint` option to manifest to specify a mantlemint endpoint (#885)

## [0.2.0] - 2022-04-06
### Added
- Add manifest 1.0.0 (#845)
### Fixed
- Fix validation for genesisHash or chainId with empty string (#883)

## [0.1.1] - 2022-03-22
### Added
- Add class of `TerraTransactionHandler` and `TerraMessageHandler` in order to support Terra contract handling (#848)

## [0.1.0] - 2022-03-01
### Added
- init commit

[Unreleased]: https://github.com/subquery/subql/compare/common-terra/0.1.0...HEAD
