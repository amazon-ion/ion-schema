---
title:  Ion Schema Language Versioning
---
# {{ page.title }}

## Introduction

The purpose of this document is to describe how the Ion Schema Language will be versioned. This is a summary of the versioning rules introduced in [RFC: Ion Schema Language Versioning](../../rfcs/ion_schema_2_0/language_versions).

*The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).*

## Glossary

* **Ion Schema Language (ISL):** the syntax, grammar, and set of constraints for validating Ion data, as well as the rules that govern how an Ion Schema implementation should interpret and apply schemas to Ion data.
* **Ion Schema Language (ISL) version:** a specific version of the Ion Schema Language; synonymous with "Ion Schema version" and "language version"
* **Ion Schema Specification:** the text that describes the Ion Schema Language.
* **Schema Document**: A single stream of ion values that conforms to the Ion Schema Specification. (In IonJava terms, an IonDatagram that conforms to the spec.)

## What is versioned?

* The *Ion Schema Language* SHALL be versioned.
* The documents that describe the Ion Schema Language (the _Ion Schema Specification_) SHALL NOT have versioned releases.

## How is it versioned?

* The Ion Schema Language version SHALL consist of a major and minor version components.
* The major and minor version components SHALL be non-negative integers.
* Within a schema document, the format SHALL be `$ion_schema_<major>_<minor>`.
* In the specification text and other documentation, the format SHALL be `<major>.<minor>`.

_While this is similar to [Semantic Versioning](https://semver.org/), there are two significant differences—(1) Semantic Versioning includes patch versions, whereas Ion Schema Language versioning does not; and (2) Semantic Versioning releases are immutable, but the Ion Schema Language may be modified without changing the version number when the modification is an unsubstantive clarification or bugfix._

## Major Versions

* A new major version MAY contain any sort of changes, including backwards incompatible changes.
* Upon creating a new major version, the minor version component SHALL be reset to `0`.

## Minor Versions

* Each new minor version of the Ion Schema Language SHALL allow any Ion Schema document that is valid against any previous minor version of the Ion Schema Language, within the same major version, to be updated to the new Specification version with equivalent semantics.
* Such an update MUST only require changing the ISL version marker to the new minor version. For example, a valid Ion Schema 2.2 document, upon changing its ISL version marker to `$ion_schema_2_3`, SHALL be a valid Ion Schema 2.3 document, semantically equivalent to the original Ion Schema 2.2 document.
* New minor versions of the Ion Schema Specification MUST be written to ensure this form of backward compatibility. 
* A change that qualifies as a minor version update MAY be released as a major version update as a way to signal to users that it is a particularly large or significant change.

## Cross-version Compatibility

* A schema SHALL be allowed to import another schema that uses *any* other minor version in the same major version.
* Any new major version of Ion Schema SHALL define its own rules regarding the ability to import schemas from prior major versions of Ion Schema.
* A new major version SHOULD allow importing from the most recent prior major version unless there is a technical reason why it is not possible.

## Ion Schema Version Markers

* The keyspace reserved for ISL version markers SHALL be the set of symbols that matches the regular expression `^\$ion_schema_\d.*$`.
* A *valid* ISL version marker SHALL match the regular expression `^\$ion_schema_[1-9]\d*_(0|[1-9]\d*)$`.
* An ISL Version Marker in the form `$ion_schema_X_Y` SHALL indicate that X and Y are the major and minor version respectively.
* The first value in the schema SHOULD be an ISL Version Marker; if a top-level ISL value is encountered before encountering an ISL version marker, that schema SHALL use ISL 1.0.

## Requirements for Ion Schema Implementations

* If symbol in the ISL Version Marker reserved keyspace is encountered and that symbol is not a valid ISL Version Marker, implementations MUST raise an error.
* If an ISL Version Marker is encountered and that version marker refers to a version that is unknown to or unsupported by the implementation, that implementation MUST raise an error.
* If more than one ISL Version Marker is found in the value stream of a single Ion Schema, the implementation MUST raise an error.
* If an ISL Version Marker is encountered at any point after the header or a type definition, the implementation MUST raise an error.
* If an implementation supports ISL version `X.Y`, then it MUST support all minor versions from `X.0` to `X.Y`.
