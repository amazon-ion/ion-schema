# RFC: Ion Schema Language Versions

<!-- TOC start -->
- [Ion Schema Language Versions](#rfc-ion-schema-language-versions)
  - [Introduction](#introduction)
  - [Definitions/Glossary](#definitionsglossary)
  - [Ion Schema Compatibility/Portability Goal](#ion-schema-compatibilityportability-goal)
  - [Motivation](#motivation)
    - [Incompatibility across implementation versions](#incompatibility-across-implementation-versions)
    - [Lack of portability](#lack-of-portability)
    - [Underspecification of importing across schema versions](#underspecification-of-importing-across-schema-versions)
    - [Backwards Incompatibility caused by Open Content](#backwards-incompatibility-caused-by-open-content)
  - [Solution – Ion Schema Language Versioning](#solution--ion-schema-language-versioning)
    - [What is versioned?](#what-is-versioned)
    - [How is it versioned?](#how-is-it-versioned)
      - [Major Versions](#major-versions)
      - [Minor Versions](#minor-versions)
    - [Examples of different types of changes](#examples-of-different-types-of-changes)
    - [ISL Version Marker Syntax and Implementation](#isl-version-marker-syntax-and-implementation)
      - [Implications for Schema Imports](#implications-for-schema-imports)
      - [Examples – Ion Schema 1.0](#examples--ion-schema-10)
      - [Examples – Ion Schema >=2.0](#examples--ion-schema-20)
  - [Alternatives Considered](#alternatives-considered)
    - [Semantic Versioning](#semantic-versioning)
    - [Only track major versions of ISL](#only-track-major-versions-of-isl)
    - [Calendar Versioning (CalVer)](#calendar-versioning-calver)
    - [Include a promise about semantic equivalence for major version updates](#include-a-promise-about-semantic-equivalence-for-major-version-updates)
  - [Frequently Asked Questions](#frequently-asked-questions)
    - [Does Ion Schema provide any features for versioning of users’ schemas or types?](#does-ion-schema-provide-any-features-for-versioning-of-users-schemas-or-types)
    - [When an implementation adds support for a new ISL major version, must an implementation that follows SemVer also bump its major version?](#when-an-implementation-adds-support-for-a-new-isl-major-version-must-an-implementation-that-follows-semver-also-bump-its-major-version)
<!-- TOC end -->

## Introduction

The purpose of this document is to specify how the Ion Schema Language will be versioned.

*The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).*

## Definitions/Glossary

* **Ion Schema Language (ISL):** the syntax, grammar, and set of constraints for validating Ion data, as well as the rules that govern how an Ion Schema implementation should interpret and apply schemas to Ion data.
* **Ion Schema Language (ISL) version:** a specific version of the Ion Schema Language; synonymous with "Ion Schema version" and "language version"
* **Ion Schema Specification:** the text that describes the Ion Schema Language.
* **Implementation version**: the (release) version of a library that implements the Ion Schema Specification, such as `ion-schema-kotlin` or `ion-schema-rust`
* **Schema Document**: A single stream of ion values that conforms to the Ion Schema Specification. (In IonJava terms, an IonDatagram that conforms to the spec.)
* **Schema Version**: refers to versions of user-defined schemas/types. Schema versions are not in scope for this document, but it is defined here to clearly differentiate it from the other types of "version" that are mentioned.
* **User defined content (UDC)**: optional content that has no meaning to the schema system but may have meaning to the end user

## Ion Schema Compatibility/Portability Goal

A schema document MUST have the same behavior on all equivalently configured Ion Schema implementations. If an implementation does not support all features used in a particular schema document, the implementation MUST error when it attempts to load that schema.

## Motivation

The Ion Schema 1.0 Specification [requires version markers](https://amzn.github.io/ion-schema/docs/spec.html#schema-definitions) at the start of a schema document, but the specification says nothing else about how Ion Schema is to be versioned. Without clear versioning rules, almost any functional change to the Ion Schema specification is a potentially breaking change for our customers.

### Incompatibility across implementation versions

We cannot change the meaning or behavior of any existing language syntax in a backwards compatible way. If the meaning of any syntax is modified, then schemas would no longer portable because they could behave differently in different applications that take a dependency on different releases of a library that implements Ion Schema.

### Lack of portability

Any behavioral change to the Ion Schema specification is not guaranteed to be portable across different libraries that implement Ion Schema. These libraries will not be updated at exactly the same time, and users of Ion Schema will not update their dependencies at exactly the same time (or possibly never update their dependencies). Ion Schema needs a clearly defined versioning strategy that allows users to specify which behavior to use for a given schema document.

### Underspecification of importing across schema versions

For Ion Schema use cases that have a large number of schemas, perhaps owned by multiple teams, we currently provide no guidance regarding whether schemas with different versions can be used together (i.e. can a schema import another schema with a different version?). Users will not be able to safely use multiple ISL versions or gradually upgrade their ISL version if this remains undefined.

### Backwards Incompatibility caused by Open Content

There can be no Ion Schema 1.1—as long as open content is allowed, almost any change is backwards incompatible. ISL 1.0 broadly allows user-defined ("open") content and so any new syntax has the possibility of name-shadowing user-defined content, causing unexpected behavior. However, restricting user defined content would itself be a backwards incompatible change. This backwards incompatible change will require a new major version, but before that can happen, Ion Schema needs a versioning strategy.

## Solution – Ion Schema Language Versioning

*This solution assumes that Ion Schema 2.0 also introduces some rules to prevent open content from colliding with Ion Schema features. See [Ion Schema 2.0 Open Content](open_content.md)*

### What is versioned?

The *Ion Schema Language* SHALL be versioned. The documents that describe the Ion Schema Language (the specification) SHALL NOT have versioned releases.

### How is it versioned?

The Ion Schema Language version SHALL consist of a major and minor version components. The major and minor version components SHALL be non-negative integers.

Within a schema document, the format SHALL be `$ion_schema_<major>_<minor>`. In the specification text and other documentation, it SHALL be `<major>.<minor>`.

Readers may notice that this is similar to [Semantic Versioning](https://semver.org/). However, it differs in two key ways. Semantic Versioning includes patch versions, but Ion Schema Language versioning does not use patch versions. Semantic Versioning is specific that [releases must be immutable](https://semver.org/#spec-item-3), but Ion Schema Language versioning does not provide that guarantee. The Ion Schema Language may be modified without changing the version number when the modification is an unsubstantive clarification or bugfix.

#### Major Versions

A new major version MAY contain any sort of changes, including backwards incompatible changes. Upon creating a new major version, the minor version component SHALL be reset to `0`.

#### Minor Versions

Each new minor version of the Ion Schema Language SHALL allow any Ion Schema document that is valid against any previous minor version of the Ion Schema Language, within the same major version, to be updated to the new Specification version with equivalent semantics. Such an update MUST only require changing the ISL version marker to the new minor version. For example, a valid Ion Schema 2.2 document, upon changing its ISL version marker to `$ion_schema_2_3`, SHALL be a valid Ion Schema 2.3 document, semantically equivalent to the original Ion Schema 2.2 document. New minor versions of the Ion Schema Specification MUST be written to ensure this form of backward compatibility. 

The guarantee of backwards compatibility is the objective standard by which we differentiate a major and minor version. Without some sort of objective standard, all we have are good intentions in order to decide whether a change requires a new major or minor version.

A change that qualifies as a minor version update MAY be released as a major version update as a way to signal to users that it is a particularly large or significant change.

### Examples of different types of changes

Any change that is not backwards compatible must be released as a new major version. In other words, given the latest released version N, if we create version N+1, and there are any possible schemas for version N that are not valid and semantically equivalent by simply changing the ISL version marker to N+1, then a new major version is required. Examples of this include placing new restrictions on user-defined content, removing functionality, or changing the ISL versioning rules.

Any backwards compatible behavior or syntax change can be released as a new minor version. Examples of this include adding new behavior with new syntax to an existing constraint (such as a new modifier), adding a new constraint (assuming open content is appropriately limited), or adding syntactical sugar.

Some behavior clarifications may be released as an update to an existing minor version. Examples include reclassifying `occurs` to not be a constraint ([ion-schema#48](https://github.com/amzn/ion-schema/pull/48)) and clarifying the interactions between number ranges and special float values ([ion-schema#56](https://github.com/amzn/ion-schema/pull/56)).

Changes to the Ion Schema Specification that do not affect the Ion Schema Language are out of scope for Ion Schema Language versioning—for example, spelling and grammar changes, adding examples, or renumbering sections of the specification.

### ISL Version Marker Syntax and Implementation

The ISL version marker in a schema document will only specify the major and minor version. The patch version is not included in the ISL version marker because patch versions do not change the behavior of the schema, so they have no relevance in a schema document.

The Ion Schema specification [requires ISL version markers](https://amzn.github.io/ion-schema/docs/spec.html#schema-definitions), but the `ion-schema-kotlin` implementation [does not enforce that requirement](https://github.com/amzn/ion-schema-kotlin/blob/master/src/com/amazon/ionschema/internal/SchemaImpl.kt#L78). Starting with Ion Schema 2.0, a version marker must be required, but to avoid breaking existing schemas, we must continue to interpret the absence of an ISL version marker as an implied `$ion_schema_1_0`. (*Refer to [Backwards Incompatibility caused by Open Content](#backwards-incompatibility-caused-by-open-content)* *for why we must go directly to Ion Schema 2.0.*)

* **The keyspace reserved for ISL version markers SHALL be the set of symbols that matches the regular expression `^\$ion_schema_\d.*$`.** Any top-level symbol matching this regular expression must be interpreted as an ISL version marker (regardless of whether it refers to a valid ISL version).
  *Why?* We want to avoid any ambiguity or potential confusion for human readers when they see a value that looks like an ISL version marker.(Note that the Ion spec already reserves the `$ion` prefix for Ion and related applications.)
* **A *valid* ISL version marker SHALL match the regular expression `^\$ion_schema_[1-9]\d*_(0|[1-9]\d*)$`.**
  *Why?* A valid ISL version marker must contain a major and minor version indicator. No leading zeros are allowed.
* **The first value in the schema SHOULD be an ISL Version Marker.**
  *Why?* This is the version-independent convention for signaling the ISL version.
* **If a top-level ISL value is encountered before encountering an ISL version marker, implementations MUST assume `$ion_schema_1_0`.**
  *Why?* This behavior is required for backwards compatibility, since the ISL version marker is not enforced for ISL 1.0
* **An ISL Version Marker in the form `$ion_schema_X_Y` SHALL indicate that X and Y are the major and minor version respectively.**
  *Why?* This is the version-independent convention for signaling the ISL version.
* **If any ISL Version Marker is not a valid/supported version marker, implementations MUST raise an error.**
  *Why?* Implementations must raise an error to meet [the portability/compatibility goal](#ion-schema-compatibilityportability-goal).
* **If more than one Ion Schema version marker is found in the value stream of a single Ion Schema, the implementation MUST raise an error.**
  *Why?* Because when there are multiple version markers, we cannot determine which version to use if those versions are different. *Caveat—the Ion Schema Specification does not define how to find the boundaries of a schema document in an Ion stream. Ion Schema Authorities MAY choose to support a means of having more than one schema document contained in a stream of Ion Values, but an Authority MUST return at most 1 schema for a given schema id.*
* **If an implementation supports ISL version `X.Y`, then it MUST also support ISL version `X.Y-1`** **(recursively down to `X.0`)**.
  *Why?* Easier for customers to move between minor versions of their schemas. Helps us to guarantee that minor versions are import compatible with each other. It also simplifies the `ion-tests` repository because we can organize and run tests by major version instead of having to re-run them for every minor version—which also helps validate that minor version updates are indeed backwards compatible.

#### Implications for Schema Imports

From [Minor Versions](#minor-versions):

> Each new minor version of the Ion Schema Specification SHALL allow any Ion Schema document that is valid against any previous minor version of the Specification, within the same major version, to be updated to the new Specification version with equivalent semantics. Such an update MUST only require changing the ISL version marker to the new minor version.

Under this condition, any schema that uses imports must remain semantically equivalent, without requiring anything of the imported schema, so by implication, Ion Schema must allow importing schemas that are still on prior minor versions.

Because ISL supports cycles in schema dependency graphs, we can infer that **a schema SHALL be allowed to import another schema that uses *any* other minor version in the same major version**. For example, given a dependency of A → B → A, where both A and B are using Ion Schema 2.0, when A is updated to 2.1, A must be allowed to import B and B must be allowed to import A.

(In other words, any schema using Ion Schema `X.a` MUST be able to import any other schema using Ion Schema `X.b`, both minor versions are supported by the Ion Schema implementation. Since an Ion Schema implementation must always provide support for all prior minor versions for a given major version, it is always possible to import a schema with any different minor version, *up to the highest minor version supported by that implementation*.)

The Ion Schema Specification does not restrict the possible changes that are allowed in a new major version, so **any new major version of Ion Schema SHALL define its own rules regarding the ability to import schemas from prior major versions of Ion Schema**. A new major version SHOULD allow importing from the most recent prior major version unless there is a technical reason why it is not possible.

#### Examples – Ion Schema 1.0

```
// The first value is not an ISL version marker, so it is implicitly ISL 1.0

$foo_service_interface_version_1 // Open content

$ion_schema_1_0 // Ion Schema 1.0 allows out-of-place version markers 
                // because in Ion Schema 1.0 this is open content.

$ion_schema_2_0 // Ion Schema 1.0 does not allow version 
                // markers that are for a different version

schema_header::{}

// ... other content ...

schema_footer::{}
```

```
$ion_schema_1_0  // Explicit version marker
 
$ion_schema_1_0 // Ion Schema 1.0 allows out-of-place version markers 
                // because in Ion Schema 1.0 this is open content.

schema_header::{}

// ... other content ...

schema_footer::{}
```

#### Examples – Ion Schema >=2.0

```
$ion_schema_2_4           // <-- isl version marker

$foo_service_interface_version_1  // <-- allowed open content

$ion_schema_2_4           // <-- ion schema version marker in wrong position
$ion_schema_1_foo         // <-- not allowed as open content

schema_header::{
  imports: [
    { id: fruit, type: apple },
  ]
}

type::{
  name: ion_schema_version_marker,
  type symbol,
  valid_values: [ 
    $ion_schema_1_0,     // <-- all valid; 
    $ion_schema_2_0,     // <   not isl version markers because 
    $ion_schema_2_1,     // <   they are not a top level values.
    $ion_schema_cat_dog, // <
  ]
}

schema_footer::{}
```

## Alternatives Considered

#### Semantic Versioning

Using [Semantic Versioning](https://semver.org/) (SemVer) would require patch versions. The chosen solution has no use for patch versions, so we would need to find something to do with patch versions. We could either leave the patch version to always be `0` or we could use patch versions to version non-behavioural changes in the documentation. If we always keep the patch version at `0`, then we have no benefit of using SemVer. If we use patch versions for documentation changes, then we are imposing an unnecessary process on ourselves and future maintainers of the project, and adding complexity that will probably confuse Ion Schema users with no obvious benefit to those users.

#### Only track major versions of ISL

While this is possible, it does not benefit our customers as much as tracking minor versions. By tracking minor versions, we get the following benefits over tracking only major versions:

* Ability to define easy/intuitive rules about backwards compatibility for implementations
* Ability to define straightforward rules about importing schemas of mixed versions
* Minor versions are a signal for customers to know how much effort it is for them to upgrade the ISL version of their schemas

#### Calendar Versioning (CalVer)

"[CalVer](https://calver.org/) is a versioning convention based on the project's release calendar, instead of arbitrary numbers." It can be used in conjunction with (modified) SemVer or on its own. For example, one could choose to use the year as the major version while following SemVer for the minor and patch versions.

CalVer has the benefit (for developers/maintainers) that you do not need to determine backwards compatibility to decide whether a release should be a new major version—instead you release a new major version with all the feature changes on a pre-determined schedule. However, if we use a calendar-based major version, then we cannot provide consistent guarantees about the compatibility between different versions of the Ion Schema Language, which is not as good for Ion Schema users.

CalVer also has the (general) benefit of making it easy to tie releases to a particular support schedule. This may be useful for a specific *software application*, but it seems to be irrelevant for a *specification*.

If we use CalVer, it seems like there would be an implied expectation of a specific release schedule. We do not want the spec to be updated on a specific schedule because we want to be able to react to business needs (for example, release a new major version without having to wait for the next calendar year). On the other hand, we do not want to be making releases solely because it is the predetermined time for a release—we expect the frequency of Ion Schema Specification releases to decrease over time as the specification matures.

Finally, this is a minor consideration, but the Ion Schema 1.0 Specification is already implied to use a versioning scheme (though none is defined) that is not calendar based, so precedent would suggest that we stick to non-calendar-based versioning.

#### Include a promise about semantic equivalence for major version updates

We could include the following:

>Given a valid schema document for a particular major version, when the ISL version marker is changed to the next major version, the schema document SHALL either be (1) a semantically equivalent schema document or (2) not a valid schema document.

In other words:

>Changing only the ISL version marker MUST NOT result in a valid but semantically different schema document, even when changing major versions.

This would make it safer for customers to upgrade their schemas because when they update the ISL version marker, it eliminates the possibility of having a valid but semantically different schema document. In addition, it simplifies the implementation of Ion Schema because there would be no need for implementations to push any versioning concerns to the constraint implementations.

However, the implication is that a major version update *cannot change the meaning of any existing syntax*—it can only remove features from ISL. (Though in the case of a constraint, for example, the constraint may be re-introduced with altered functionality under a different name.) This could add a disproportionately large amount of friction for seemingly small changes that result in a change of meaning, such as changing whether `+/-inf` are inside the `max/min` range bounds.

We decided not to do this because upgrading major versions should be an infrequent occurrence. If a change is significant enough to require a new major version, then it will probably be non-trivial for users to update their schemas to a new version. Since it would be non-trivial, we would provide a tool to help Ion Schema users upgrade to the latest version. Furthermore, this promise would make it more difficult for us to introduce changes to ISL.

## Frequently Asked Questions

#### Does Ion Schema provide any features for versioning of users’ schemas or types?

ISL 1.0 does not provide any special functionality for schema versions. That is up to the discretion of the end user. However, the Ion Schema cookbook should provide suggestions.

Why does ISL not have schema versioning? Customers have asked about schema versioning, but they have described multiple different versioning strategies, and Ion Schema is not at a point right now where we can choose one to be the blessed way of versioning schemas/types.

However, Ion Schema will need to choose a versioning strategy for Ion Schema Schemas, because there will need to be multiple versions of the schema schemas. This will be a forcing function for Ion Schema to document schema versioning approaches for the Ion Schema cookbook.

#### When an implementation adds support for a new ISL major version, must an implementation that follows SemVer also bump its major version?

No. Adding support for a new ISL version never *requires* the implementation to increase its major version because it is strictly adding functionality. However, if an implementation (that follows SemVer) ever *drops* support for an older version of ISL, that would require a new major version under the SemVer rules.
