# RFC: Ion Schema 2.0

<!-- TOC start -->
- [RFC: Ion Schema 2.0](#rfc-ion-schema-20)
  - [Summary](#summary)
  - [Motivation](#motivation)
  - [Description of Changes](#description-of-changes)
  - [Compatibility with Ion Schema 1.0](#compatibility-with-ion-schema-10)
  - [Appendix — Below the Line/Out of Scope for Ion Schema 2.0](#appendix--below-the-lineout-of-scope-for-ion-schema-20)
    - [Schema/Type versioning](#schematype-versioning)
    - [User-Defined Constraints](#user-defined-constraints)
    - [Other Language Features](#other-language-features)
    - [Code Generation](#code-generation)
<!-- TOC end -->

## Summary

This RFC proposes a new major version of the Ion Schema Language: **Ion Schema 2.0**.

Ion Schema 2.0 will be fully interoperable with Ion Schema 1.0.

Ion Schema 2.0 introduces the following changes:

* [Ion Schema Language Versions](language_versions.md)
* [Ion Schema 2.0 Open Content](open_content.md)
* [ion-schema #18](https://github.com/amzn/ion-schema/issues/18#issuecomment-1092130146) – Add `ieee754_float` constraint
* [ion-schema #27](https://github.com/amzn/ion-schema/issues/27) – Replace `scale` constraint with `exponent`
* [ion-schema #38](https://github.com/amzn/ion-schema/issues/38#issuecomment-1119833602) – Replace `nullable::` modifier with `$null_or::`
* [ion-schema #43](https://github.com/amzn/ion-schema/issues/43) – Add a way to require that containers have no duplicate elements
* [ion-schema #44](https://github.com/amzn/ion-schema/issues/44#issuecomment-1097296761) – Allow field names to be constrained without exact field names being specified
* [ion-schema #47](https://github.com/amzn/ion-schema/issues/47) – Replace `content: closed` with `closed::` modifier for `fields` constraint
* [ion-schema #51](https://github.com/amzn/ion-schema/issues/51#issuecomment-1105688979) – Improve modeling of annotations in Ion Schema
* [ion-schema #54](https://github.com/amzn/ion-schema/issues/54) – Add support for more ECMA 262 regex features
* [ion-schema #58](https://github.com/amzn/ion-schema/issues/58) – Change the default type from `any` to `$any`
* [ion-schema #72](https://github.com/amzn/ion-schema/issues/72) – Allow timestamp ranges to have endpoints with unknown offsets

## Motivation

[Ion Schema Language](https://amzn.github.io/ion-schema/docs/spec.html) (ISL) is a grammar and constraints for narrowing the universe of Ion values. A schema consists of zero or more types, and a type is a collection of zero or more constraints over the Ion data model.

Ion Schema Language is declarative and is intended to be portable across platforms and programming environments. Therefore, a schema document must have the same behavior on all equivalently configured Ion Schema implementations. If an implementation does not support all features used in a particular schema document, the implementation must error when it attempts to load that schema.

As Ion Schema has been used by customers, customers have asked for some new functionality to address feature gaps, and we identified some misfeatures and points of ambiguity that needed to be addressed. However, we realized that it is impossible to evolve the Ion Schema Language in a way that preserves the portability/compatibility goal. This is because:

* No specification about what requires a major or minor version change.
* There is no way to tell the difference between open/user content and an unknown feature, so it is impossible to raise an error for an unsupported feature.
* Every new constraint is a potentially breaking change because it could interfere with someone’s open content.
* No specification about whether schemas with different ISL versions can import each other

## Description of Changes

* **Versioning Rules for the Ion Schema Language**  
Ion Schema will use a major and minor version numbers. (This was implied in Ion Schema 1.0, but not well-defined.) Any backwards-incompatible change requires a new major version. Any other change to the Ion Schema Language requires a new minor version. Edits to the specification for spelling, grammar, or clarity (i.e. any changes that do not affect the ISL syntax or semantics) do not require a new version of Ion Schema. See [Ion Schema Language Versions](language_versions.md) for full details.
* **Open Content in Ion Schema 2.0**   
Ion Schema 2.0 defines a set of symbols that are reserved for use by future versions of Ion Schema. A user may use a reserved symbol for open content if and only if that field is explicitly declared as user content in the schema header. See [Ion Schema 2.0 Open Content](open_content.md).
* **Add `ieee754_float` constraint**  
If a user wants to model [binary32](https://en.wikipedia.org/wiki/Single-precision_floating-point_format) or [binary16](https://en.wikipedia.org/wiki/Half-precision_floating-point_format) ranges in Ion Schema 1.0, it cannot be done due to precision/scale aspects of binary floating-point. The `ieee754_float` constraint allows us to constraint float values to be only those values that are precisely representable by a specific IEEE 754 binary encoding. See [ion-schema #18](https://github.com/amzn/ion-schema/issues/18#issuecomment-1092130146). 
* **Replace `scale` constraint with `exponent` constraint**  
The `scale` constraint has some unexpected behavior and is at odds with the Ion Decimal data model. Ion Schema 2.0 replaces `scale` with `exponent`, which closely aligns with the Ion `decimal` data model. See [ion-schema #27](https://github.com/amzn/ion-schema/issues/27). 
* **Replace `nullable::` with `$null_or::`**  
The `nullable::` annotation is underspecified and behaves in unintuitive ways. A complete solution to correctly identify the allowed types of null is not practical to solve, so `nullable::` will be replaced with `$null_or::` which will be syntactical sugar for a union of `null` (equivalently `null.null`) and the annotated type. See [ion-schema #38](https://github.com/amzn/ion-schema/issues/38#issuecomment-1119833602). 
* **Add support for modeling a set**  
Ion Schema 1.0 provides no way to model a set. Ion Schema 2.0 introduces the modifier `distinct::` for the `element` constraint which validates that no two elements in a container may be equivalent Ion values. See [ion-schema #43](https://github.com/amzn/ion-schema/issues/43). 
* **Add `field_names` constraint**  
Ion Schema 1.0 provides no way to validate field names except by listing out explicitly which names are allowed in the `fields` constraint. The `field_names` constraint will allow the text of all field name symbols of a struct to be validated according to a specified type. See [ion-schema #44](https://github.com/amzn/ion-schema/issues/44#issuecomment-1097296761). 
* **Replace `content: closed` with `closed::` modifier for `fields` constraint.**  
The `content: closed` (pseudo) constraint only *modifies* the `fields` constraint and is confusing when composing types. It will be removed in Ion Schema 2.0 and replaced with a `closed::` modifier for the `fields` constraint. See [ion-schema #47](https://github.com/amzn/ion-schema/issues/47).
* **Improve `annotations` constraint**  
In Ion Schema 1.0, the `annotations` constraint has some unexpected and useless behaviors, and it is not possible to model rules such as "1 of N annotations" or "any lowercase annotation". Ion Schema 2.0 eliminates the specific configurations that have confusing behavior, and adds syntax to allow annotations to be validated as if they are a `list` of `symbol`. See [ion-schema #51](https://github.com/amzn/ion-schema/issues/51#issuecomment-1105688979). 
* **Add additional regex support**  
Ion Schema 2.0 adds support for backslash-escaped character sets inside character classes to the subset of supported ECMA regex features. See [ion-schema #54](https://github.com/amzn/ion-schema/issues/54).
* **Change implicit `type: any` to `type: $any`**  
In Ion Schema 1.0, the default `type` is `any` rather than the top type, `$any`. This leads to some unintuitive behavior when handling null values. Ion Schema 2.0 changes the default `type` of a type definition from `any` to `$any`. See [ion-schema #58](https://github.com/amzn/ion-schema/issues/58).
* **Allow timestamp ranges to have endpoints with unknown offsets**  
Ion Schema 1.0 prohibits using timestamps with unknown offsets as the upper or lower bound of a timestamp range, which leads to an awkward user experience in some cases. Ion Schema 2.0 allows timestamp ranges to have boundaries with unknown offset. See [ion-schema #72](https://github.com/amzn/ion-schema/issues/72).

## Compatibility with Ion Schema 1.0

*The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this section are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).*

Ion Schema 2.0 will be fully interoperable with Ion Schema 1.0.

* Any Ion Schema implementation with support for Ion Schema 2.0 MUST also support reading Ion Schema 1.0.
* Ion Schema 2.0 SHALL allow importing schemas written in Ion Schema 1.0.
* Any implementation of ISL 1.0 that also implements ISL 2.0 MUST allow types from an ISL 2.0 schema to be imported by an ISL 1.0 schema.
* The interoperability requirements stated here SHALL NOT apply to Ion Schema 3.0 or any future major version unless that major version explicitly restates them. (i.e., Ion Schema 3.0 is allowed to say that implementations must also support Ion Schema 2.0 but are not required to support Ion Schema 1.0.)

## Appendix — Below the Line/Out of Scope for Ion Schema 2.0

### Schema/Type versioning

Some users have asked about schema versioning, but they have described multiple different versioning strategies. Based on the use cases that we have learned about, there does not appear to be a one-size-fits-all solution for schema versioning. Ion Schema will need to have its own versioning strategy for `ion-schema-schemas`, and we believe that it is possible via name mangling or a custom authority implementation. (One user had already indicated that name mangling is sufficient for their use case.)

We plan to add documentation and examples to suggest some methods for managing multiple versions of schemas, but we do not plan to add any features to Ion Schema 2.0 specifically to support versioned schemas and/or types.

See [ion-schema #66](https://github.com/amzn/ion-schema/issues/66).

### User-Defined Constraints

We considered adding support for user-defined constraints. In Ion Schema 1.0, it is only possible to add a user-defined constraint by creating a custom Ion Schema implementation. In Ion Schema 2.0, this remains possible. Any user-defined constraint would be treated as open content by an implementation that does not support that user-defined constraint.

However, it would be possible to introduce a feature in Ion Schema Language that would allow users to indicate that certain open content fields are actually a user-defined constraint.

Ultimately, we chose to defer this because we are not sure if it is the right thing to do, and we believe we can safely introduce it in a new _minor_ version of the Ion Schema Language by extending the open-content mechanism proposed in [Open Content](open_content.md).

See [ion-schema #68](https://github.com/amzn/ion-schema/issues/68) for spec support for user-defined constraints and [ion-schema-kotlin #33](https://github.com/amzn/ion-schema-kotlin/issues/33) for API support of user-defined constraints.

### Other Language Features

There are several features that we thought of, but they were ultimately excluded because no one has actually asked for the feature (yet). All of these features could safely be introduced in a later *minor* version of Ion Schema, so excluding them is not a one-way door.

* Add a way to indicate that a particular type cannot be imported by any other schema. See [ion-schema #67](https://github.com/amzn/ion-schema/issues/67).
* Add a way to configure whether number-related constraints should be strict about the Ion type of the number or whether they should use a numerical/mathematical equivalence. See [ion-schema #65](https://github.com/amzn/ion-schema/issues/65).
* Add a default type for schema document so that users don’t need to make seemingly redundant calls to `getType()` in (for example) `loadSchema("foo.isl").getType("foo").validate(ionValue)`.  See [ion-schema #15](https://github.com/amzn/ion-schema/issues/15).
* Add a constraint for timestamps that allows for constraining individual fields of the timestamp (e.g. minutes must be a multiple of 5). See [ion-schema #46](https://github.com/amzn/ion-schema/issues/46).
* Add syntax and support for repeated subsequences in the `ordered_elements` constraint. See [ion-schema #41](https://github.com/amzn/ion-schema/issues/41).

### Code Generation

We would like to create tools for generating code from an Ion Schema, but we concluded it is an orthogonal concern that does not belong in the Ion Schema Language specification. You can comment on code generation for JVM in [ion-schema-kotlin #146](https://github.com/amzn/ion-schema-kotlin/issues/146) or C/C++ code generation in [ion-schema #49](https://github.com/amzn/ion-schema/issues/49), or [open a new issue](https://github.com/amzn/ion-schema/issues/new) for a new code generation target.
