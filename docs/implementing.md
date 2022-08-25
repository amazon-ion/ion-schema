---
title:  Implementation Considerations
---
# {{ page.title }}

This is a collection of thoughts and learnings that were gathered over the course of creating and maintaining `ion-schema-kotlin` and `ion-schema-rust`.
They have been collected here in the hope that they will be useful for anyone creating a new implementation of Ion Schema or considering writing a related tool or library.
This document is not an authoritative document, and implementers are not required to follow any of the suggestions presented here.

## General Notes

- When a value is not valid for a particular type, it is generally helpful to surface all the reasons the value isn't valid, rather than just the first reason.
- Runtime resolution of a schema over a network presents availability and security risks, and should therefore be avoided.
- Consider when warnings should be issued instead of errors (e.g., if a schema authority is configured to reference a URL, or a type is defined such that there are no valid values for it).
- As ISL itself allows for open content, consider providing an API to make that content available to callers.

## Modeling the Ion Schema Language

The only model that is required by the specification is the Ion Schema Language itself.
The original Kotlin implementation of Ion Schema only operated on the ISL Ion.
Consequently, the parsing and evaluation of a schema were tightly coupled, making it more difficult to support multiple versions of ISL.
Furthermore, programmatic manipulation of schemas was difficult because clients of the library had to manipulate the Ion DOM (or even Ion text) in order to construct or modify a schema.
Therefore, it is highly recommended to implement at least one of ISL Data Objects or an internal AST.

### ISL Data Objects

* Should be idiomatic for the language in which it is written.
* Should not be modeled using an Ion DOM or require Ion DOM values for construction, except for constraints such as `valid_values` and `contains`, where the constraint is a check for a match between Ion values.
* Support for open content is optional, but recommended. Open content can be modeled using the Ion DOM.
* Ideally, anything you can build using ISL data objects should be valid ISL.
* Does not need to have total fidelity with ISL Ion, but must have semantic fidelity. (For example, it’s okay if it loses the difference between `occurs: required`, `occurs: 1` , and `occurs: [exclusive::0, 1]`.)
* May function as a type-safe DSL for programmatic construction of ISL types/schemas.
* May have syntactic sugar for areas where total fidelity is not preserved so that it appears to be closer to ISL Ion. (E.g. a static function `Occurs.required()` that builds a data object representing `occurs: [1, 1]`.)
* Does not necessarily need to support every version of ISL *syntax*.
* Consider the difference between a concrete syntax tree and an abstract syntax tree. You probably want this to be more like an abstract syntax tree so that you can enforce a canonical representation of certain things that can be represented more than one way. Also, an abstract syntax tree makes it easier to support multiple versions of ISL in a single model.

### Internal Representation

* Can be whatever you want.
* Must have semantic fidelity with ISL Ion.
* Should not be exported or publicly exposed.
* Useful for storing optimized forms of schemas (e.g. compiled regex instead of a regex string or resolved, numbered references instead of named type references).

## Built-in types

It may be advantageous to hard-code only the most minimal set of types possible, and allow the remaining built-in types to be defined using ISL. (One potentially useful strategy is to have an `IonSchemaCoreTypesAuthority` where the schema id is the Ion Schema Version Marker. That way, if the built-in types ever change, it’s easy for an implementation to correctly load the right core types.)

As of Ion Schema 1.0 and 2.0, the hard coded types must be `document` and all of the Ion types (`$null`, `$bool`, `$int`, `$float`, `$decimal`, `$string`, `$symbol`, `$blob`, `$clob`, `$timestamp`, `$list`, `$sexp`, and `$struct`.)

The remaining built-in types can be defined as follows:
```
// The top type
type::{
  name: $any,
}

// The bottom type
type::{
  name: nothing,
  valid_values: [],
}

// Non-null variants of the Ion types; repeat similarly for each type
type::{
  name: bool,
  type: $bool,
  not: { valid_values: [null.bool] }
}

// Union types; repeat similarly for lob, $text, text, $number, number, any
type::{
  name: $lob,
  one_of: [ $blob, $clob ],
}
```

## Caching Imports

It is possible to have an import graph like this (imports are *down*, so A imports B, etc.)

```
             A
            / \
           B   C
          / \ / 
         D   E
             |
             F
            /|\
           G H I
```

Here, we have two paths from A to E and everything that E imports. Therefore, we need to cache a schema by its schemaId when we load it, even it is not loaded directly by the user. If we don’t, then we risk performing double (or more) I/O when there is more than one path to import a given dependency.

## Ranges

Ranges in Ion Schema can be confusing to implement.
While there are many types of ranges that might appear similar, there are fundamentally two distinct types of ranges.

**Discrete Range**

Discrete (or integral) ranges are ranges over integers and integer-like things (such as timestamp precision, which is essentially an integer wrapped by an enum).
These ranges are compared against some _property_ of a value and are used for `scale` (ISL 1.0), `exponent` (ISL 2.0), `precision`, `timestamp_precision`, `timestamp_offset`, `byte_length`, `container_length`, `codepoint_length`, `utf8_byte_length`, and `occurs`.

**Value Range**

Value ranges are ranges over Ion values. These ranges are compared against other Ion values, and are only used with the `valid_values` constraint. They are further subdivided into NumberRange and TimestampRange.

## The top type `$any`

In Ion Schema 2.0, every type implicitly starts out as the top type (i.e. `type: $any`). You should not actually add that in your implementation, since it is identical to a type definition with no constraints.

In other words, do not add a `type: $any` to the internal model of a type definition because that would be redundant.
