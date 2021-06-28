---
title:  Ion Schema Specification 1.0
---
# {{ page.title }}

This specification defines a means to express constraints over the Ion
data model. The universe of values in the Ion data model is narrowed by
defining types with constraints, then determining whether a value is
valid for a particular type. Types are expressed with the Ion Schema
Language (ISL), which is comprised of the syntax, constraints, and grammar
presented in this document. Finally, a set of examples are provided to
illustrate how the various aspects of ISL work together. This document
assumes that readers are familiar with the Ion data model defined in the
[Amazon Ion Specification](https://amzn.github.io/ion-docs/docs/spec.html).

* [Type System](#type-system)
  * [Core Types](#core-types)
  * [Ion Types](#ion-types)
* [Schema Definitions](#schema-definitions)
* [Imports](#imports)
* [Schema Authorities](#schema-authorities)
* [Type Definitions](#type-definitions)
* [Open Content](#open-content)
* [Constraints](#constraints)
  * [General Constraints](#general-constraints)
    * [annotations](#annotations)
    * [type](#type)
    * [valid_values](#valid_values)
  * [Blob/Clob Constraints](#blobclob-constraints)
    * [byte_length](#byte_length)
  * [String/Symbol Constraints](#stringsymbol-constraints)
    * [codepoint_length](#codepoint_length)
    * [regex](#regex)
  * [Decimal Constraints](#decimal-constraints)
    * [precision](#precision)
    * [scale](#scale)
  * [Timestamp Constraints](#timestamp-constraints)
    * [timestamp_offset](#timestamp_offset)
    * [timestamp_precision](#timestamp_precision)
  * [Container Constraints](#container-constraints)
    * [container_length](#container_length)
    * [content](#content)
    * [element](#element)
    * [occurs](#occurs)
  * [List/S-expression/Document Constraints](#lists-expressiondocument-constraints)
    * [contains](#contains)
    * [ordered_elements](#ordered_elements)
  * [Struct Constraints](#struct-constraints)
    * [fields](#fields)
  * [Logic Constraints](#logic-constraints)
    * [all_of](#all_of)
    * [any_of](#any_of)
    * [one_of](#one_of)
    * [not](#not)
* [Type Annotations](#type-annotations)
* [Implementation Considerations](#implementation-considerations)
* [Rationale](#rationale)
* [Grammar](#grammar)
* [Examples](#examples)
  * [customer profile data](#customer-profile-data)
  * [union](#union)
  * [byte_length constraint](#byte_length-constraint)
  * [document](#document)
  * [list&lt;string&gt;](#liststring)
  * [list&lt;bool, string, int+&gt;](#listbool-string-int)
  * [map&lt;string,int&gt; represented as
struct&lt;int&gt;](#mapstringint-represented-as-structint)
  * [map&lt;string,int&gt; represented as
list&lt;pair&lt;string,int&gt;&gt;](#mapstringint-represented-as-listpairstringint)

# Type System

The type system is divided into the following two categories:
  - **core types:** generally recommended and suitable for most use
    cases, the core types do not allow `null` values unless the type name
    is annotated with `nullable`.
  - **Ion types:** corresponds precisely with the types defined by the
    Ion data model. These types are generally suitable for more advanced
    use cases, such as when the distinction between a struct field with
    a `null` value versus the absence of that field is meaningful.

## Core Types

The type system defines the following core types:
  - **scalars:** `blob`, `bool`, `clob`, `decimal`, `float`, `int`, `string`, `symbol`,
    `timestamp`
  - **containers:** `list`, `sexp`, `struct`
  - **others:**
      - `lob`: represents a `blob` or `clob`
      - `number`: represents a `decimal`, `float`, or `int`
      - `text`: represents a `string` or `symbol`
      - `document`: represents a series of top-level values
      - `nothing`: has no valid value (useful for reserving a field name)
      - `any`: represents any of the types listed above as well as types
        derived from those types

If not specified, the default type is `any`.

The core types do not include any of Ion's `null.*` values, but each of the
types may have a weakly- or strongly-typed null value if the type name
is annotated with `nullable`. When a strongly-typed null value is
encountered, its type must agree with one of the core types of the
expected type. For example, if a `any_of: nullable::[int, string,
struct]` is expected, `5`, `"hi"`, `{}`, `null`, `null.null`, `null.int`,
`null.string`, and `null.struct` are all valid values, but `null.decimal` is
not.

## Ion Types

The Ion types are prefixed with `$`, and correspond precisely with
the types defined by the Ion data model, including strongly-typed null
values:
  - **scalars:** `$blob`, `$bool`, `$clob`, `$decimal`, `$float`, `$int`, `$null`,
    `$string`, `$symbol`, `$timestamp`
  - **containers:** `$list`, `$sexp`, `$struct`
  - **others:**
      - `$lob`: represents a `$blob` or `$clob`
      - `$number`: represents a `$decimal`, `$float`, or `$int`
      - `$text`: represents a `$string` or `$symbol`
      - `$any`: represents any of the Ion types as well as types derived
        from those types

# Schema Definitions

A schema consists of a schema version marker `$ion_schema_1_0`
followed by an optional schema header, zero or more type definitions,
and an optional schema footer. The schema header is a struct with an
optional `imports` field for leveraging types from other schemas. While
a header and footer are both optional, a footer is required if a header
is present (and vice-versa). A schema is defined with an Ion document
of the following form:

```
$ion_schema_1_0

schema_header::{         // optional
  imports: [
    { id: "com/example/Insects.isl" },
    { id: "arn:aws::::com/example/autos", type: Truck },
    { id: "https://example.com/pets", type: Feline, as: Cat },
  ],
}

<NAMED_TYPE_DEFINITION>...

schema_footer::{         // optional
}
```

# Imports

An import allows types from other schemas to be used within a schema
definition. An import that only specifies an `id` makes all of the
types from that schema available for use in the current schema.
Specifying a `type` narrows the import to that single type, and a type
may be imported with a different name by specifying: `as: <TYPE_ALIAS>`.
The core types and Ion types are implicitly imported before any specified
imports; specified imports are performed in order, and an import that
cannot be resolved must result in an error. If two types with the same
name are imported, or if a type defined within a schema has the same
name as an imported type, this must result in an error.

# Schema Authorities

The structure of a `id` string (per the example above) is defined by
the schema authority responsible for the schema/type(s) being imported.
Note that runtime resolution of a schema over a network presents
availability and security risks, and should therefore be avoided.

When resolving a schema, authorities may choose to follow well-known
patterns; for example:
  - a filesystem authority might specify that an `id` string
    corresponds to an ISL file relative to some base, e.g.:
    `"{base}/com/example/core/Customer.isl"`
  - a REST authority might specify that an `id` string is a resource
    URL that corresponds to an ISL file, e.g.:
    `"https://{host}:{port}/{base}/com/example/core/Customer"`
    (again, note the inherent availabilty and security risks here)

# Type Definitions

A type consists of a collection of zero or more constraints and an
optional name. Unless otherwise specified, type definitions have an
implicit constraint `type: any`, and thereby represent any non-null
value from the universe of values representable in the Ion data model.
In order for a value to be a valid instance of a type, the value must
not violate any of the type's constraints.

Types are defined with Ion of the following form:

```
type::{
  name: <TYPE_NAME>,
  <CONSTRAINT>...
}
```

When referring to a type, it may be identified by name or alias (if
it was imported with an alias), or a fully-qualified import-style
reference (`{ id: "...", type: ... }`).  Additionally, an unnamed
type may be inlined anywhere a `<TYPE_REFERENCE>` is expected; in such
cases, the `type` annotation is optional.  For example, a list
containing strings of exactly 10 codepoints may be defined with an
inline type as follows:

```
type::{
  type: list,              // type reference
  element: {               // inline type
    type: string,
    codepoint_length: 10,
  },
}
```

# Open Content

The default behavior for containers is to allow additional content
beyond what is explicitly specified for a given type;  this is
referred to as open content.  For a given type that is not
constrained by `content: closed`, the following open content
is considered valid as long as the content doesn't exceed any
specified constraints:
  - structs may contain additional fields
  - lists and S-expressions may contain additional elements

Since annotations are considered to be metadata of a value, specifying
additional annotations on a value is valid independent of whether
a type is constrained by `content: closed`.

ISL itself allows for open content -- additional information
may be specified within a type definition (or schema_header
/ schema_footer), and such additional content is simply ignored.

# Constraints

Constraints narrow the universe of values from the Ion data model.
Constraints below are grouped by the type of data for which they are
applicable. Note that constraints may conflict with each other. For
example, there is no value that can satisfy the following constraints:

```
{
  type: int,
  codepoint_length: 5,
}
```

#### Null Values

Generally speaking, constraints must reject null values as invalid. For
example, the precision and scale constraints must reject a null value,
as `null` doesn’t have a precision or scale to evaluate; the fields
constraint must reject `null.struct`, as `null.struct` doesn't have any
fields.  Similar reasoning applies to the expected handling of null
values by most constraints. The `contains`, `type`, and `valid_values`
constraints are exceptions to this, as these constraints may be defined
such that a null value is valid.

#### Ranges

<code>range::[ <i>&lt;EXCLUSIVITY&gt;&lt;RANGE_TYPE&gt;</i>, <i>&lt;EXCLUSIVITY&gt;&lt;RANGE_TYPE&gt;</i> ]</code><br/>
<code>range::[ min, <i>&lt;EXCLUSIVITY&gt;&lt;RANGE_TYPE&gt;</i> ]</code><br/>
<code>range::[ <i>&lt;EXCLUSIVITY&gt;&lt;RANGE_TYPE&gt;</i>, max ]</code><br/>

Some constraints can be defined by a range. A range is represented by a
list annotated with `range`, and containing two values, in order: the
minimum and maximum ends of the range. The default behavior is for both
ends of the range to be *inclusive*; if *exclusive* behavior is desired,
the minimum or maximum (or both) values shall be annotated with `exclusive`.
If the minimum or maximum end of a range is to be unspecified, this shall
be represented by the symbols `min` or `max`, respectively; the `exclusive`
annotation is not applicable when the symbols `min` or `max` are specified.
A range may not contain both `min` and `max`.

All ranges have a type. The type of the range is the same as that of the minimum and/or maximum values specified
in the range list. If both a minimum and maximum values are specified (i.e. `min` and `max` are not used), then both of 
those values must be of the same type. (For example, `range::[1995-12-06T, 55.4]` mixes values of the timestamp and 
number types, and therefore is not a valid range.)

##### RANGE&lt;NUMBER&gt;

A `number` range includes all values of any numeric type (i.e. `float`, `int`, and `decimal`) that fall within that range mathematically. 
When testing a value for inclusion, the range bounds and the value that is being tested will all be converted to
`decimal` values for the sake of comparison. `number` ranges do not include values of any other type.

##### RANGE&lt;TIMESTAMP&gt;

All [`timestamp` values](https://amzn.github.io/ion-docs/docs/spec.html#timestamp) represent an instant in time. 
A `timestamp` with limited precision (for example, a year-only timestamp like `2007T`) maps to an instant by assuming 
that all unspecified time unit fields are effectively zero (or one for the month and
day units). `2007T` would map to the instant represented by `2007-01-01T00:00.000-00:00`. 
Note that `timestamp` values that do not have a time component (that is: `YYYYT`, `YYYY-MMT`, and `YYYY-MM-DDT` 
timestamps) have an unknown offset (`-00:00`). Timestamps that have an unknown offset are UTC timestamps that
make no assertion about the offset in which they occurred.
   
> ```
>  // Timestamp                  Instant
>     2007T                      2007-01-01T00:00.000-00:00
>     2007-05T                   2007-05-01T00:00.000-00:00
>     2007-05-23T                2007-05-23T00:00.000-00:00
>     2007-05-23T:06:15Z         2007-05-01T06:15.000Z
>     2007-05-23T:06:15-00:00    2007-05-01T06:15.000-00:00
>     2007-05-23T:06:15+00:00    2007-05-01T06:15.000+00:00
>     2007-05-23T:06:15+05:00    2007-05-01T06:15.000+05:00
>     2007-05-23T:06:15.945Z     2007-05-01T06:15.945Z   
> ```

A `timestamp` range includes any `timestamp` that falls between the minimum and maximum in chronological order. 
`timestamp` ranges do not include values of any other type.

> ```
> range::[5, max]                               // minimum 5, maximum unbound
> range::[min, 7]                               // minimum unbound, maximum 7
> range::[5, 7]                                 // between 5 and 7, inclusive
> range::[1.0, 10e]                             // mixing numeric types is allowed
> range::[exclusive::5, exclusive::7]           // between 5 and 7, exclusive; if type is also constrained to be an int, only 6 is allowed
> range::[5.5, 7.9]                             // between 5.5 and 7.9, inclusive
> range::[2019-01-01T, exclusive::2020-01-01T]  // any timestamp in the year 2019
> ```

## General Constraints

### annotations

<code><b>annotations:</b> [ <i>&lt;ANNOTATION&gt;...</i> ]</code><br/>
<code><b>annotations:</b> required::[ <i>&lt;ANNOTATION&gt;...</i> ]</code><br/>
<code><b>annotations:</b> closed::[ <i>&lt;ANNOTATION&gt;...</i> ]</code><br/>
<code><b>annotations:</b> ordered::[ <i>&lt;ANNOTATION&gt;...</i> ]</code>

Indicates the annotations that may be specified on values of the type.
By default, individual annotations are optional; this default may be
overridden by annotating the annotations list with `required`.
Additionally, each annotation may be annotated with `optional` or
`required` to override the list-level behavior. If annotations must be
applied to values in the specified order, the list of annotations may
be annotated with `ordered`.

The `required`, `closed`, and `ordered` annotations may be specified in any order.

Note that annotations represent metadata for a value, and
additional annotations on a value are valid independent of
whether a type is constrained by `content: closed`. Additional
annotations can only be constrained by adding the `closed`
annotation to the list of valid annotations.

> ```
> annotations: [red, required::green, blue]
> annotations: required::[red, optional::green, blue]
> annotations: required::ordered::[one, optional::two, three]
> annotations: closed::required::[red, green, blue] // Annotations must contain exactly "red", "green", and "blue" in any order
> annotations: closed::ordered::[red, green, blue] // Annotations must contain exactly "red", "green", and "blue" in that order
> annotations: closed::[red, blue] // Only the annotations "red" and "blue" are permitted, but they are not required
> annotations: closed::[] // No annotations are permitted
> ```

### type

<code><b>type:</b> <i>&lt;TYPE_REFERENCE&gt;</i></code><br/>
<code><b>type:</b> nullable::<i>&lt;TYPE_REFERENCE&gt;</i></code>

Indicates the type that a value shall be validated against. The core
types do not include null (weak- or strong-typed); for cases in which
null is a desired value, annotate the <code><i>&lt;TYPE_REFERENCE&gt;</i></code>
with `nullable`. When a strongly-typed null value is encountered, its
type must agree with the expected type (e.g., if a `nullable::int` is
expected, `5`, `null`, `null.null`, and `null.int` are valid, but
`null.string` is not).

> ```
> { type: int }
> { type: nullable::int }
> ```

### valid_values

<code><b>valid_values:</b> [ <i>&lt;VALUE&gt;...</i> ]</code><br/>
<code><b>valid_values:</b> <i>&lt;RANGE&lt;NUMBER&gt;&gt;</i></code><br/>
<code><b>valid_values:</b> <i>&lt;RANGE&lt;TIMESTAMP&gt;&gt;</i></code>

A list of acceptable, non-annotated values;  any values not present
in the list are invalid. Whether a particular value matches
a specified valid_value is governed by the equivalence rules
defined by the Ion data model (e.g., `1.230` is not valid for
`valid_values: [1.23]`, as it has a different precision). For numeric
and timestamp types, valid_values may optionally be defined as a
range. When a timestamp range is specified, neither end of the range
may have an unknown local offset.

> ```
> valid_values: [2, 3, 5, 7, 11, 13, 17, 19]
> valid_values: ["abc", "def", "ghi"]
> valid_values: [[1], [2.0, 3.0], [three, four, five]]
> valid_values: [2000T, 2004T, 2008T, 2012T]
> valid_values: range::[-100, max]
> valid_values: range::[min, 100]
> valid_values: range::[-100, 100]
> valid_values: range::[0, 100.0]
> valid_values: range::[exclusive::0d0, exclusive::1]
> valid_values: range::[-0.12e4, 0.123]
> valid_values: range::[2000-01-01T00:00:00Z, max]
> valid_values: [1, 2, 3, null, null.int]
> ```

## Blob/Clob Constraints

### byte_length

<code><b>byte_length:</b> <i>&lt;INT&gt;</i></code><br/>
<code><b>byte_length:</b> <i>&lt;RANGE&lt;INT&gt;&gt;</i></code>

The exact or minimum/maximum number of bytes in a blob or clob (note
that this constrains the number of bytes in the input source, which
may differ from the number of bytes needed to serialize the
blob/clob).

> ```
> byte_length: 5
> byte_length: range::[10, max]
> byte_length: range::[min, 100]
> byte_length: range::[10, 100]
> ```

## String/Symbol Constraints

### codepoint_length

<code><b>codepoint_length:</b> <i>&lt;INT&gt;</i></code><br/>
<code><b>codepoint_length:</b> <i>&lt;RANGE&lt;INT&gt;&gt;</i></code>

The exact or minimum/maximum number of Unicode codepoints
in a string or symbol.  Note that characters are a complex
topic in Unicode, whereas codepoints provide an unambiguous
unit for constraining the length of a string or symbol.

> ```
> codepoint_length: 5
> codepoint_length: range::[10, max]
> codepoint_length: range::[min, 100]
> codepoint_length: range::[10, 100]
> ```

### regex

<code><b>regex:</b> <i>&lt;STRING&gt;</i></code><br/>
<code><b>regex:</b> i::<i>&lt;STRING&gt;</i></code><br/>
<code><b>regex:</b> m::<i>&lt;STRING&gt;</i></code><br/>
<code><b>regex:</b> i::m::<i>&lt;STRING&gt;</i></code>

A string that conforms to a *RegularExpressionBody* defined by
[ECMA 262 Regular Expressions](https://www.ecma-international.org/ecma-262/5.1/#sec-7.8.5).
Regular expressions shall be limited to the following features:

| | |
| -------: | ------- |
|          | Unicode codepoints match themselves |
| `.`      | any codepoint |
| `[abc]`  | codepoint class |
| `[a-z]`  | range codepoint class |
| `[^abc]` | complemented codepoint class |
| `[^a-z]` | complemented range codepoint class |
| `^`      | anchor at the beginning of the input |
| `$`      | anchor at the end of the input |
| `(...)`  | grouping |
| <code>&vert;</code> | alternation |
| `?`      | zero or one |
| `*`      | zero or more |
| `+`      | one or more |
| `{x}`    | exactly x occurrences |
| `{x,}`   | at least x occurrences |
| `{x,y}`  | at least x and at most y occurrences |

Regular expression flags may be specified as annotations on the
regular expression string; supported flags shall include:

| | |
| ---: | --- |
| `i`  | case insensitive |
| `m`  | ^ and $ match at line breaks |

The following classes are provided:

| | |
| `\d` | digit: `[0-9]` |
| `\D` | non-digit |
| `\s` | whitespace: `[ \f\n\r\t]` |
| `\S` | non-whitespace |
| `\w` | word character: `[A-Za-z0-9_]` |
| `\W` | non-word character |

The following characters may be escaped with a backslash:  `. ^ $ | ? * + \ [ ] ( ) { }`.  Note that in Ion text a backslash must itself be escaped, so correct escaping of these characters requires two backslashes, e.g.:  `\\.`.

> ```
> regex: "M(iss){2}ippi"
> regex: i::"susie"
> regex: i::m::"^B[0-9]{9}$"
> regex: "\\$\\d+\\.\\d\\d"
> ```

### utf8_byte_length

<code><b>utf8_byte_length:</b> <i>&lt;INT&gt;</i></code><br/>
<code><b>utf8_byte_length:</b> <i>&lt;RANGE&lt;INT&gt;&gt;</i></code>

An exact or minimum/maximum indicating number of bytes in the UTF8 representation of a string or symbol.

> ```
> utf8_byte_length: 5
> utf8_byte_length: range::[10, max]
> utf8_byte_length: range::[min, 100]
> utf8_byte_length: range::[10, 100]
> ```

## Decimal Constraints

### precision

<code><b>precision:</b> <i>&lt;INT&gt;</i></code><br/>
<code><b>precision:</b> <i>&lt;RANGE&lt;INT&gt;&gt;</i></code>

An exact or minimum/maximum indicating the number of digits in the
unscaled value of a decimal. The minimum precision must be greater than
or equal to `1`.

> ```
> precision: 5
> precision: range::[1, max]
> precision: range::[min, 10]
> precision: range::[1, 10]
> ```

### scale

<code><b>scale:</b> <i>&lt;INT&gt;</i></code><br/>
<code><b>scale:</b> <i>&lt;RANGE&lt;INT&gt;&gt;</i></code>

An exact or minimum/maximum range indicating the number of digits to
the right of the decimal point. The minimum scale must be greater than
or equal to `0`.

> ```
> scale: 2
> scale: range::[3, max]
> scale: range::[min, 6]
> scale: range::[3, 6]
> ```

## Timestamp Constraints

### timestamp_offset

<code><b>timestamp_offset:</b> [ <i>"[+|-]hh:mm"...</i> ]</code>

Limits the timestamp offsets that are allowed. An offset is specified
as a string of the form `"[+|-]hh:mm"`, where `hh` is a two digit number
between 00 and 23, inclusive, and `mm` is a two digit number between 00
and 59, inclusive.

> ```
> timestamp_offset: ["+00:00"] // UTC
> timestamp_offset: ["-00:00"] // unknown local offset
> timestamp_offset: ["+07:00", "+08:00", "+08:45", "+09:00"]
> ```

### timestamp_precision

<code><b>timestamp_precision:</b> <i>&lt;TIMESTAMP_PRECISION_VALUE&gt;</i></code><br/>
<code><b>timestamp_precision:</b> <i>&lt;RANGE&lt;TIMESTAMP_PRECISION_VALUE&gt;&gt;</i></code>

Indicates the exact or minimum/maximum precision of a timestamp.
Valid precision values are, in order of increasing precision:
`year`, `month`, `day`, `minute`, `second`, `millisecond`, `microsecond`, and `nanosecond`.

> ```
> timestamp_precision: year
> timestamp_precision: microsecond
> timestamp_precision: range::[month, max]
> timestamp_precision: range::[min, day]
> timestamp_precision: range::[second, nanosecond]
> timestamp_precision: range::[exclusive::second, max]  // any timestamp with fractional seconds is allowed
> timestamp_precision: range::[exclusive::second, exclusive::millisecond]  // only timestamps with a precision of tenths or hundredths of a second are allowed
> timestamp_precision: range::[month, day]
> timestamp_precision: range::[year, day]
> ```

## Container Constraints

The following constraints are applicable for lists, S-expressions,
structs, and documents.

### container_length

<code><b>container_length:</b> <i>&lt;INT&gt;</i></code><br/>
<code><b>container_length:</b> <i>&lt;RANGE&lt;INT&gt;&gt;</i></code>

The exact or minimum/maximum number of elements in a list or
S-expression, or fields in a struct.

> ```
> container_length: 5
> container_length: range::[10, max]
> container_length: range::[min, 100]
> container_length: range::[10, 100]
> ```

### content

<code><b>content:</b> closed</code>

The default behavior for containers is to allow "open" content,
meaning that it is valid to provide additional elements in a list or
S-expression, or fields in a struct (although such additional content
might exceed a constraint and thus cause the value to be invalid for
that reason). This constraint indicates that additional fields in a
struct, or additional elements in a list, S-expression, or document,
are not allowed.

> ```
> content: closed
> ```

### element

<code><b>element:</b> <i>&lt;TYPE_REFERENCE&gt;</i></code><br/>

Defines the type and/or constraints for all values within a
homogeneous list, S-expression, or struct.

> ```
> element: string
> element: { type: string, codepoint_length: 5 }
> ```

### occurs

<code><b>occurs:</b> <i>&lt;INT&gt;</i></code><br/>
<code><b>occurs:</b> <i>&lt;RANGE&lt;INT&gt;&gt;</i></code><br/>
<code><b>occurs:</b> optional</code><br/>
<code><b>occurs:</b> required</code>

Applicable only within the context of `ordered_elements` and struct
field constraints; indicates either the exact or minimum/maximum
number of occurrences of the specified type or field. The special
value `optional` is synonymous with `range::[0, 1]`; similarly,
the special value `required` is synonymous with the *exact*
value `1` (or `range::[1, 1]`).

> ```
> occurs: 3
> occurs: range::[1, max]
> occurs: range::[min, 3]
> occurs: range::[1, 5]
> occurs: optional           // equivalent to range::[0, 1]
> occurs: required           // equivalent to 1 or range::[1, 1]
> ```

## List/S-expression/Document Constraints

### contains

<code><b>contains:</b> [ <i>&lt;VALUE&gt;...</i> ]</code>

Indicates that the list or S-expression is expected to contain all of
the specified values, in no particular order.

> ```
> contains: [high]
> contains: [1, 4.0, high, "apple"]
> ```

### ordered_elements

<code><b>ordered_elements:</b> [ <i>&lt;TYPE_REFERENCE&gt;...</i> ]</code>

Defines constraints over a list of values in a heterogeneous list,
S-expression, or document. Each value in a list, S-expression, or document
is expected to be valid against the type in the corresponding position
of the specified types list. Each type is implicitly defined with
`occurs: 1` -- behavior which may be overridden.

When specified, this constraint fully defines the content of a list,
S-expression, or document -- open content is not implicitly allowed.

Note that when a type in a heterogeneous list, S-expression, or document
may occur some variable number of times, matching against a particular
type is performed greedily before proceeding to the next type.

> ```
> ordered_elements: [
>   string,
>   symbol,
>   { type: int, valid_values: range::[0, 100] },
> ]
> ordered_elements: [
>   symbol,
>   { type: int, occurs: range::[1, max] },      // 1..n ints
> ]
> ```

## Struct Constraints

### fields

<code><b>fields:</b> { <i>&lt;FIELD&gt;...</i> }</code>

Declares one or more field constraints of a struct, where <FIELD&gt;
is defined as:

<code><i>&lt;SYMBOL&gt;</i>: <i>&lt;TYPE_REFERENCE&gt;</i></code>

Field names defined for a particular struct type shall be unique.
A field may narrow its declared type by specifying additional
constraints. By default, a field is constrained by `occurs: optional`.

> ```
> fields: {
>   city: string,
>   age: { type: int, valid_values: range::[0, 200] },
> }
> ```

## Logic Constraints

The following constraints provide logical behavior over a collection of
one or more types.

### all_of

<code><b>all_of:</b> [ <i>&lt;TYPE_REFERENCE&gt;...</i> ]</code>

Value must be valid for all of the types.

> ```
> all_of: [
>   LineItems,
>   ShippingAddress,
>   BillingAddress,
> ]
> ```

### any_of

<code><b>any_of:</b> [ <i>&lt;TYPE_REFERENCE&gt;...</i> ]</code>

Value must be valid for one or more of the types.

> ```
> // valid: "hi", 0, 100, 0.0, 0e0, null, null.string
> // invalid: 101, null.int
> any_of: [
>   nullable::string,
>   { valid_values: range::[0, 100] },
> ]
> ```

### one_of

<code><b>one_of:</b> [ <i>&lt;TYPE_REFERENCE&gt;...</i> ]</code>

Value must be valid for exactly one of the types.

> ```
> // valid: "hello", 5, null, null.string
> // invalid: hello, 1.3, null.int, null.symbol
> one_of: [
>   nullable::string,
>   int,
> ]
> ```

### not

<code><b>not:</b> <i>&lt;TYPE_REFERENCE&gt;</i></code>

Value must not be valid for the type.

> ```
> // valid: -1, 101, null, null.int, "hi"
> // invalid: 0, 100
> not: { type: int, valid_values: range::[0, 100] }
> ```

# Type Annotations

It can be helpful to tag a value with the name of the type it
corresponds to, although the only way to determine whether a value
corresponds to a type is to validate the value against that type. By
convention, a value may be annotated as follows:

<code><i>&lt;ID&gt;</i>::<i>&lt;TYPE_NAME&gt;</i>::<i>&lt;VALUE&gt;</i></code>

# Implementation Considerations

  - When a value is not valid for a particular type, it is generally
    helpful to surface all the reasons the value isn't valid, rather
    than just the first reason.

  - For types that allow open content, it can be helpful to provide a
    'strict' validation mode that allows trivial errors (e.g., typing
    mistakes) to be identified easily.

  - Runtime resolution of a schema over a network presents availability
    and security risks, and should therefore be avoided.

  - Consider when warnings should be issued instead of errors (e.g.,
    if a schema authority is configured to reference a URL, or a type is
    defined such that there are no valid values for it).

  - As ISL itself allows for open content, consider providing an API
    to make that content available to callers.

  - Consider allowing callers to define additional constraints.

# Rationale

This section attempts to shed light on some of the insights that guided
key decisions when creating this specification.

  - The Ion data model provides a rich set of weakly- and strongly-typed
    nulls, which in practice cause confusion, particularly in the
    context of struct fields. Numerous conversations around what it
    means for a field to be "required and nullable", or "optional and
    not null" illustrated the problem; and while such scenarios represent
    valid use cases that Ion supports, they are not common use cases.
    This led to defining Ion Schema core types as non-null: when a
    required field is defined using a non-null type, code processing it
    is guaranteed to not receive a null value. The less common use cases
    may be modeled using the $-prefixed Ion types, which correspond
    precisely with the types in the Ion data model.

  - While the types in the Ion data model include type-specific null
    values, they do not include the generic `null` or `null.null` values
    (e.g., `null.int` is a valid Ion int, but `null.null` is not). Amidst
    the questions that arise around strongly-typed null values, it was
    deemed overly punitive to not allow `null` or `null.null` to be accepted
    where `null.<type>` is accepted. As such, specifying the `nullable`
    annotation on a type allows both weakly- and strongly-typed nulls to
    be valid.

  - For some, the fact that the `any` type doesn't include null values is
    counterintuitive – some view null as a value, while others think of
    it as the *absence* of a value. The approach followed here is the
    latter:  it is consistent with the treatment of the other core types
    and reduces confusion related to nullability and the requiredness of
    struct fields, while still enabling less common use cases via
    `nullable::any` (which allows `null`, `null.null`, and all of the
    strongly-typed nulls).

  - This specification intentionally avoids defining constraints that
    perform more complex logic (e.g., "if field 1 is A, field 2 is
    constrained by C", or "the value of this field is the result of
    the expression X").  While it can be tempting to enable such logic,
    doing so almost inevitably results in schemas that are difficult
    to understand and maintain over time.  The approach of this
    specification is to aim for a minimal set of simple, orthogonal
    constraints, and defer more complex logic to other aspects of a
    system.

# Grammar

This section provides a BNF-style grammar for the Ion Schema Language.

```
<SCHEMA> ::= <NAMED_TYPE_DEFINITION>...
           | <HEADER> <NAMED_TYPE_DEFINITION>... <FOOTER>

<HEADER> ::= schema_header::{
  imports: [ <IMPORT>... ]
}

<IMPORT> ::= <IMPORT_SCHEMA>
           | <IMPORT_TYPE>
           | <IMPORT_TYPE_ALIAS>

<IMPORT_SCHEMA>     ::= { id: <ID> }

<IMPORT_TYPE>       ::= { id: <ID>, type: <TYPE_NAME> }

<IMPORT_TYPE_ALIAS> ::= { id: <ID>, type: <TYPE_NAME>, as: <TYPE_ALIAS> }

<FOOTER> ::= schema_footer::{
}

<NAMED_TYPE_DEFINITION> ::= type::{ name: <TYPE_NAME>, <CONSTRAINT>... }

<UNNAMED_TYPE_DEFINITION> ::= type::{ <CONSTRAINT>... }
                            | { <CONSTRAINT>... }

<ID> ::= <STRING>
       | <SYMBOL>

<TYPE_ALIAS> ::= <SYMBOL>

<TYPE_NAME> ::= <SYMBOL>

<TYPE_REFERENCE> ::=           <TYPE_NAME>
                   | nullable::<TYPE_NAME>
                   |           <TYPE_ALIAS>
                   | nullable::<TYPE_ALIAS>
                   |           <UNNAMED_TYPE_DEFINITION>
                   | nullable::<UNNAMED_TYPE_DEFINITION>
                   |           <IMPORT_TYPE>
                   | nullable::<IMPORT_TYPE>

<NUMBER> ::= <DECIMAL>
           | <FLOAT>
           | <INT>

<RANGE_TYPE> ::= <DECIMAL>
               | <FLOAT>
               | <INT>
               | <NUMBER>
               | <TIMESTAMP>
               | <TIMESTAMP_PRECISION_VALUE>

<EXCLUSIVITY> ::= exclusive::
                | ""

<RANGE<RANGE_TYPE>> ::= range::[ <EXCLUSIVITY><RANGE_TYPE>, <EXCLUSIVITY><RANGE_TYPE> ]
                      | range::[ min, <EXCLUSIVITY><RANGE_TYPE> ]
                      | range::[ <EXCLUSIVITY><RANGE_TYPE>, max ]

<CONSTRAINT> ::= <ALL_OF>
               | <ANNOTATIONS>
               | <ANY_OF>
               | <BYTE_LENGTH>
               | <CODEPOINT_LENGTH>
               | <CONTAINER_LENGTH>
               | <CONTAINS>
               | <CONTENT>
               | <ELEMENT>
               | <FIELDS>
               | <NOT>
               | <OCCURS>
               | <ONE_OF>
               | <ORDERED_ELEMENTS>
               | <PRECISION>
               | <REGEX>
               | <SCALE>
               | <TIMESTAMP_OFFSET>
               | <TIMESTAMP_PRECISION>
               | <TYPE>
               | <VALID_VALUES>

<ALL_OF> ::= all_of: [ <TYPE_REFERENCE>... ]

<ANNOTATION> ::= <SYMBOL>
               | required::<SYMBOL>
               | optional::<SYMBOL>

<ANNOTATIONS_MODIFIER> ::= required::
                         | ordered::
                         | closed::

<ANNOTATIONS> ::= annotations: <ANNOTATIONS_MODIFIER>... [ <ANNOTATION>... ]

<ANY_OF> ::= any_of: [ <TYPE_REFERENCE>... ]

<BYTE_LENGTH> ::= byte_length: <INT>
                | byte_length: <RANGE<INT>>

<CODEPOINT_LENGTH> ::= codepoint_length: <INT>
                     | codepoint_length: <RANGE<INT>>

<CONTAINER_LENGTH> ::= container_length: <INT>
                     | container_length: <RANGE<INT>>

<CONTAINS> ::= contains: [ <VALUE>... ]

<CONTENT> ::= content: closed

<ELEMENT> ::= element: <TYPE_REFERENCE>

<FIELD> ::= <SYMBOL>: <TYPE_REFERENCE>

<FIELDS> ::= fields: { <FIELD>... }

<NOT> ::= not: <TYPE_REFERENCE>

<OCCURS> ::= occurs: <INT>
           | occurs: <RANGE<INT>>
           | occurs: optional
           | occurs: required

<ONE_OF> ::= one_of: [ <TYPE_REFERENCE>... ]

<ORDERED_ELEMENTS> ::= ordered_elements: [ <TYPE_REFERENCE>... ]

<PRECISION> ::= precision: <INT>
              | precision: <RANGE<INT>>

<REGEX> ::= regex: <STRING>
          | regex: i::<STRING>
          | regex: m::<STRING>
          | regex: i::m::<STRING>

<SCALE> ::= scale: <INT>
          | scale: <RANGE<INT>>

<TIMESTAMP_OFFSET> ::= timestamp_offset: [ "[+|-]hh:mm"... ]

<TIMESTAMP_PRECISION_VALUE> ::= year
                              | month
                              | day
                              | minute
                              | second
                              | millisecond
                              | microsecond
                              | nanosecond

<TIMESTAMP_PRECISION> ::= timestamp_precision: <TIMESTAMP_PRECISION_VALUE>
                        | timestamp_precision: <RANGE<TIMESTAMP_PRECISION_VALUE>>

<TYPE> ::= type: <TYPE_REFERENCE>

<VALID_VALUES> ::= valid_values: [ <VALUE>... ]
                 | valid_values: <RANGE<NUMBER>>
                 | valid_values: <RANGE<TIMESTAMP>>

```

# Examples

The following examples illustrate how Ion Schema concepts work together,
and how they are expressed in ISL.

## customer profile data

#### com/example/util_types.isl:
```
$ion_schema_1_0

type::{
  name: short_string,
  type: string,
  codepoint_length: range::[min, 50],
}

type::{
  name: Address,
  type: struct,
  annotations: ordered::[one, two, three],
  fields: {
    address1: { type: short_string, occurs: required },
    address2: { type: short_string },
    city: { type: string, occurs: required, codepoint_length: range::[min, 20] },
    state: { type: State, occurs: required },
    zipcode: { type: int, valid_values: range::[10000, 99999], occurs: required },
  },
}

type::{           // enum
  name: State,
  valid_values: [
    AK, AL, AR, AZ, CA, CO, CT, DE, FL, GA, HI, IA, ID, IL, IN, KS, KY,
    LA, MA, MD, ME, MI, MN, MO, MS, MT, NC, ND, NE, NH, NJ, NM, NV, NY,
    OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VA, VT, WA, WI, WV, WY
  ],
}
```

#### com/example/customer.isl:
```
$ion_schema_1_0

schema_header::{
  imports: [
    { id: "com/example/util_types.isl", type: Address },
  ],
}

type::{
  name: Customer,
  type: struct,
  annotations: [corporate, gold_class, club_member],
  fields: {
    firstName: { type: string, occurs: required },
    middleName: nullable::string,
    lastName: { type: string, occurs: required },
    customerId: {
      type: {
        one_of: [
          { type: string, codepoint_length: 18 },
          { type: int, valid_values: range::[100000, 999999] },
        ],
      },
      occurs: required,
    },
    addresses: {
      type: list,
      element: Address,
      occurs: required,
      container_length: range::[1, 7],
    },
    last_updated: {
      type: timestamp,
      timestamp_precision: range::[second, millisecond],
      occurs: required,
    },
  },
}

schema_footer::{
}
```

## union

A union of int, string, and list<int_or_string\> types:

```
type::{
  one_of: [
    int,
    string,
    { type: list, element: { one_of: [int, string] } },
  ],
}
```

## byte_length constraint

Type corresponding to the byte_length constraint:

```
// byte_length: <INT>
// byte_length: <RANGE<INT>>
type::{
  name: byte_length,
  fields: {
    byte_length: {
      one_of: [
        int_non_negative,        // <INT>
        range_int_non_negative,  // <RANGE<INT>>
      ],
      occurs: required,
    },
  },
}

// range::[ <INT>, <INT> ]
// range::[ min, <INT> ]
// range::[ <INT>, max ]
// range::[ min, max ]
type::{
  name: range_int_non_negative,
  type: list,
  annotations: required::[range],
  ordered_elements: [
    { one_of: [ int_non_negative, { valid_values: [min] } ] },
    { one_of: [ int_non_negative, { valid_values: [max] } ] },
  ],
  container_length: 2,
}

// an int (>= 0) with optional 'exclusive' annotation
type::{
  name: int_non_negative,
  type: int,
  annotations: [exclusive],
  valid_values: range::[0, max],
}
```

## document

The following schema provides an example of using the 'document' type,
and illustrates what the schema for ISL might look like.

```
schema_header::{
}

type::{
  name: IonSchema,
  type: document,
  ordered_elements: [
    { type: Header, occurs: optional },
    { type: Type,   occurs: range::[0, max] },
    { type: Footer, occurs: optional },
  ],
}

type::{
  name: Header,
  type: struct,
  annotations: [required::schema_header],
  fields: {
    imports: ImportList,
  },
}

type::{
  name: ImportList,
  type: list,
  ...
}

type::{
  name: Type,
  type: struct,
  annotations: [required::type],
  fields: {
    name: symbol,
    ...
  },
}

type::{
  name: Footer,
  type: struct,
  annotations: [required::schema_footer],
}

schema_footer::{
}
```

## list<string\>

A parameterized list containing strings:

```
type::{
  name: MyListOfString,
  type: list,
  element: string,
}
```

## list<bool, string, int+\>

A heterogeneous list that contains a bool, string, and one or more
non-negative ints:

```
type::{
  name: MyHeterogeneousList,
  type: list,
  ordered_elements: [
    bool,
    string,
    { type: int, valid_values: range::[0, max], occurs: range::[1, max] },
  ],
}
```

## map<string,int\> represented as struct<int\>
```
type::{
  name: MyMapAsStruct,
  type: struct,
  element: int,
}
```

## map<string,int\> represented as list<pair<string,int\>\>
```
type::{
  name: MyMapAsList,
  type: list,
  element: {
    type: list,          // pair
    ordered_elements: [
      string,
      int,
    ],
  },
}
```
