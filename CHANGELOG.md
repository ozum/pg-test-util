# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.8](https://github.com/ozum/pg-test-util/compare/v2.0.4...v2.0.8) (2020-05-27)


### Bug Fixes

* disconnect when database is copied into new object ([196c557](https://github.com/ozum/pg-test-util/commit/196c5573a01dd9e70071960504920c999f4bc63d))
* export additional types ([058c686](https://github.com/ozum/pg-test-util/commit/058c68630b23b21bacaa20e89e61544697855f3f)), closes [#3](https://github.com/ozum/pg-test-util/issues/3)
* fix db.truncate on empty database ([66ad433](https://github.com/ozum/pg-test-util/commit/66ad433042af0b7ef0bf7a73f48ed7e678907762)), closes [#2](https://github.com/ozum/pg-test-util/issues/2)

### [2.0.7](https://github.com/ozum/pg-test-util/compare/v2.0.4...v2.0.7) (2020-05-26)


### Bug Fixes

* disconnect when database is copied into new object ([196c557](https://github.com/ozum/pg-test-util/commit/196c5573a01dd9e70071960504920c999f4bc63d))
* fix db.truncate on empty database ([66ad433](https://github.com/ozum/pg-test-util/commit/66ad433042af0b7ef0bf7a73f48ed7e678907762)), closes [#2](https://github.com/ozum/pg-test-util/issues/2)

### [2.0.6](https://github.com/ozum/pg-test-util/compare/v2.0.4...v2.0.6) (2020-05-06)


### Bug Fixes

* disconnect when database is copied into new object ([196c557](https://github.com/ozum/pg-test-util/commit/196c5573a01dd9e70071960504920c999f4bc63d))

### [2.0.5](https://github.com/ozum/pg-test-util/compare/v2.0.4...v2.0.5) (2019-10-22)

### 2.0.0 - 2018-02-25

#### Changed

* Completely rewritten using typescript.

#### Added

* Details

### 1.3.3 - 2016-06-27

#### Fixed

* `optional` dependency removed.

### 1.3.0 - 2016-06-06

#### Added

* `options` parameter added to `executeSQLFile` method.
* SQL files can be executed all triggers and foreign key constraints disabled. (disableTriggers option)

#### 1.2.0 - 2015-09-21

#### Added

* connectionDatabase parameter added to constructor for an additional database to connect while creating and dropping
  databases.

### 1.1.0 - 2015-09-17

#### Added

* pg-native support added. (Optional)

### 1.0.0 - 2015-09-16

* Initial version
