---
title:  Ion Schema Specification 2.0
---
<!-- including the title in a `<h1>` instead of using `#` means that it won't be included in the TOC /-->
<h1> {{ page.title }} </h1>

<!-- DO NOT MODIFY BETWEEN THESE LINES! -->
* Placeholder for Table of Content (Must not be removed)
{:toc}

<!-- DO NOT MODIFY BETWEEN THESE LINES! -->

## About This Document

This specification defines a means to express constraints over the Ion data model.
The universe of values in the Ion data model is narrowed by defining types with constraints, then determining whether a value is valid for a particular type.
Types are expressed with the Ion Schema Language (ISL), which consists of the syntax, constraints, and grammar presented in this document.

{% include note.html type="note" content="This document assumes that readers are familiar with the Ion data model defined in the [Amazon Ion Specification](https://amzn.github.io/ion-docs/docs/spec.html)." %}

Ion Schema 2.0 builds upon the [Ion Schema 1.0 specification](../isl-1-0/spec), adding the changes from [RFC: Ion Schema 2.0](../../rfcs/ion_schema_2_0/ion_schema_2_0).
This document does not assume that the reader is familiar with the Ion Schema 1.0 specification.

### Grammar

This document provides snippets of a BNF-style grammar for the Ion Schema Language.
This grammar is intended as a learning aid and is _not_ authoritative.
The full BNF-style grammar can be found [here](bnf-grammar) along with a discussion of the grammar's known limitations.

# Schemas

{% include grammar-element.md productions="schema,schema,header,header_field,footer" %}

A schema is a collection of types that can be used to constrain the Ion data model.

A schema consists of a schema version marker `$ion_schema_2_0` followed by an optional schema header, zero or more type definitions, and an optional schema footer.
The schema header is a struct, annotated with `schema_header`, with an optional `imports` field for leveraging types from other schemas.
The schema header may also have an optional `user_reserved_fields` field that is used to declared reserved symbols that are to be used for open content fields.
The schema footer is a struct that it annotated with `schema_footer`.
The schema footer is optional and can be used to delimit the end of a schema when a schema is embedded in a larger Ion stream.
A schema may not have more than one header or more than one footer.

{% include example.md title="An Ion Schema 2.0 schema with one type and no header" markdown='
```ion
$ion_schema_2_0

type::{
  name: positive_int,
  type: int,
  valid_values: range::[1, max],
}
```
' %}

## Version Marker

{% include grammar-element.md productions="isl_version_marker" %}

The Ion Schema version marker for Ion Schema 2.0 is `$ion_schema_2_0`.
The Ion Schema version marker is the first element in the schema document, before any `type` or `schema_header` structs or any open content.
Any non-Ion-Schema values (i.e. open content) before the Ion Schema version marker is not part of the schema.
If any Ion Schema value (i.e. a schema header or a type) appears before or without a version marker, then that schema is an Ion Schema 1.0 document, and it must follow the [Ion Schema 1.0 specification](../isl-1-0/spec).
If any Ion Schema version marker is found after the first value of the schema document, it is invalid and will result in an error as required by [ISL Versioning § Requirements for Ion Schema Implementations](https://amazon-ion.github.io/ion-schema/docs/isl-versioning#requirements-for-ion-schema-implementations).

{% comment %}{% include example.md title="An ISL 2.0 Schema" code_file="examples/placeholder.isl" %}{% endcomment %}

## Imports

{% include grammar-element.md productions="imports_declaration,import,import_schema,import_type,import_type_alias" %}

An import allows types from other schemas to be used within a schema definition.
An import that only specifies an `id` makes all the types from that schema available for use in the current schema.
Specifying a `type` narrows the import to that single type, and a type may be imported with a different name by specifying: `as: <TYPE_ALIAS>`.
The core types and Ion types are implicitly imported before any specified imports; specified imports are performed in order.
Once an implementation has finished loading a schema, if any imports could not be resolved, it must result in an error. 
If two types with the same name are imported, or if a type defined within a schema has the same name as an imported type, this must result in an error.
Only named types of a schema may be imported in another schema.
Types may only be imported from the schema where they are declared; importing a type to a schema does not make that type transitively available to any other schemas. 

{% include example.md title="A schema that imports a type from other schema" markdown='
Suppose we create a schema `integers.isl` with the following content:
```ion
$ion_schema_2_0

type::{
  name: positive_int,
  type: int,
  valid_values: range::[1, max],
}

type::{
  name: negative_int,
  type: int,
  valid_values: range::[min, -1],
}
```
We can use the types defined in `integers.isl` in another schema by importing the specific types that we want to use.
When importing types by name, we can specify an alias to improve readability or to avoid a naming conflict with another
type that has the same name.

```ion
$ion_schema_2_0

schema_header::{
  imports: [
    { id: "integers.isl", type: positive_int },
    { id: "integers.isl", type: negative_int },
    { id: "integers.isl", type: positive_int, as: positive_int_by_another_name },
  ]
}

type::{
  name: non_zero_int,
  one_of: [
    negative_int,
    positive_int,
  ]
}

type::{
  name: non_negative_int,
  one_of: [
    positive_int_by_another_name,
    { valid_values: [0] }
  ],
}
```
' %}

### Schema Authorities

The structure of an `id` string is defined by the schema authority responsible for the schema/type(s) being imported.
Note that runtime resolution of a schema over a network presents availability and security risks that must be taken into consideration.

When resolving a schema, authorities may choose to follow well-known patterns; for example:
- a filesystem authority might specify that an `id` string corresponds to an ISL file relative to some base, e.g.:`"{base}/com/example/core/Customer.isl"`
- a REST authority might specify that an `id` string is a resource URL that corresponds to an ISL file, e.g.: `"https://{host}:{port}/{base}/com/example/core/Customer"` (again, note the inherent availability and security risks here)

# Types

The Ion Schema type system is a hybrid of [nominal](https://en.wikipedia.org/wiki/Nominal_type_system) and [structural](https://en.wikipedia.org/wiki/Structural_type_system) typing.
All Ion values are nominally one of the types defined in the [Ion data model](https://amzn.github.io/ion-docs/docs/spec.html#the-ion-data-model).
Beyond that, a value (or stream of values) may belong to one or more structural types.

{% include note.html type="note" content="
The [_universal type_](https://en.wikipedia.org/wiki/Top_type) (sometimes called the _top type_) is a type that includes all possible values.
In Ion Schema, the universal type is called `$any`, and it is defined as a type with no constraints.
" %}

## Built-in Types

Ion Schema has several built-in types that are implicitly imported before any other imports are handled.

The nominal Ion types are prefixed with `$`, and correspond precisely with the types defined by [the Ion data model](https://amzn.github.io/ion-docs/docs/spec.html#the-ion-data-model).
For example, `$int` contains all non-null, Ion `int` values as well as `null.int`.
(As in the Ion data model, the presence or absence of annotations does not affect the nominal type for a given value, so `foo::null.int` or `null.int` with any other list of annotations is also in `$int`.)
The type `$null` contains only `null.null` (which is equivalent to `null`).
The nominal Ion types are `$blob`, `$bool`, `$clob`, `$decimal`, `$float`, `$int`, `$null`, `$string`, `$symbol`, `$timestamp`, `$list`, `$sexp`, and `$struct`.

Ion Schema adds one more nominal type, `document`, which is a stream of top-level Ion values.
Ion Schema implementations may represent this stream as a list, sequence, array, or other similar data structure depending on what is idiomatic for the language in which it is implemented.

In addition, Ion Schema provides the following structural types:

- `$any`: the _universal type_ that includes every value. It is the union of all nominal types, including `$null`.
- `$lob`: union of `$blob` or `$clob`
- `$number`: union of `$decimal`, `$float`, or `$int`
- `$text`: union of `$string` or `$symbol`

- `blob`, `bool`, `clob`, `decimal`, `float`, `int`, `string`, `symbol`, `timestamp`, `list`, `sexp`, `struct` correspond to the Ion types, except that they do not allow null values.
- `any`: represents any value that is not a null value. It is the union of `blob`, `bool`, `clob`, `decimal`, `float`, `int`, `string`, `symbol`, `timestamp`, `list`, `sexp`, `struct`, and `document`.
- `lob`: union of `blob` or `clob`
- `number`: union of `decimal`, `float`, or `int`
- `text`: union of `string` or `symbol`
- `nothing`: the [_empty type_](https://en.wikipedia.org/wiki/Empty_type); it has no valid value

{% include note.html type="tip" content="
For the built-in types, the presence of a leading `$` sigil generally indicates that the type includes the respective strongly-typed null values.
The universal type `$any` is an exception since it also includes the untyped null.
" %}

{% include note.html type="note" content="
You may have noticed that there is a `$null` type, but there is no corresponding `null` type (as there is with `$int` and `int`).
That is because a non-null equivalent of the type `$null` is an empty type.
The non-null equivalent of `$null` is actually `nothing`.
" %}

## Type Definitions

{% include grammar-element.md productions="named_type_definition,inline_type_definition" %}

A type consists of a collection of zero or more constraints.
The set of values which belong to a type is the intersection of the values that satisfy each constraint.
In order for a value to be a valid instance of a type, the value must not violate any of the type's constraints.
A type definition with no constraints is equivalent to `$any`.

### Declaring a Type Name

A _named type definition_ is a special case of type definition.
A named type definition must be a top-level value in the schema document that is annotated with `type`. 
A named type definition must contain the field `name`, where the value is an Ion symbol that is to be the name of the type.
All other type definitions must not declare a `name`.

{% include example.md title="Named Type Definitions" markdown="
This is a trivial example of a named type—we are creating a type named `foo`.
Since it has no constraints, it is equivalent to the type `$any`.
```ion
type::{
  name: foo,
}
```
You will almost always want to add _constraints_ to your named types, as in this example of a `positive_int` type.
```ion
type::{
  name: positive_int,
  type: int,
  valid_values: range::[1, max],
}
```
" %}

## Type Arguments

{% include grammar-element.md productions="type_argument,type_name,import_type" %}

Some constraints accept a type or list of types as their argument.
A type argument can be a reference to a named type, an inline import of a type from another schema, or an inline definition of a new type.

{% include example.md title="Reference to a Named Type" markdown="
```ion
type::{
  name: foo,
  type: $null_or::int
}

type::{
  name: bar,
  // The `list` symbol is a reference to a built-in type
  type: list,
  // The `foo` symbol is a reference to the previous type
  element: foo,
}
```
" %}

{% include example.md title="Inline Import" markdown="
```ion
type::{
  name: bar,
  type: list,
  // This imports the type `foo` from the schema `other_schema.isl`
  element: { id: \"other_schema.isl\", type: foo },
}
```
" %}

{% include example.md title="Inline Type Definition" markdown="
```ion
type::{
  name: bar,
  type: list,
  // This is a type definition that is inlined in the element constraint
  element: { 
    type: string,
    codepoint_length: 10
  },
}
```
" %}

### Nullable Type Arguments

As a convenience, Ion Schema provides syntactical sugar for handling nullable values.
The `$null_or` annotation modifies a type argument to also allow the `null` (or `null.null`) value.
The `$null_or` annotation may not be added to top-level type definitions; it is only applicable to type arguments.
When the `$null_or` annotation is present on any type argument, it SHALL be evaluated equivalently to the union of `$null` and the annotated type.

For example, to allow `null` or any non-null integer value, you would use `$null_or::int`.
To allow `null`, `null.int`, or any non-null integer value, you would use `$null_or::$int`.
To allow `null` or any positive integer, you would use `$null_or::{ type: int, valid_values: range::[1, max] }`.

{% include example.md title="Nullable Type Argument" markdown="
The following types are equivalent.

```ion
type::{
  name: foo,
  type: $null_or::int
}
```
```ion
type::{
  name: bar,
  type: { one_of:[$null, int] }
}
```
" %}

### Variably-Occurring Type Arguments

Some constraints allow a quantity to be specified along with a type argument.
The quantity is given by the `occurs` field, and the field value can be one of `optional`, `required`, a non-negative integer, or an integer range.

{% include grammar-element.md productions="variably_occurring_type_argument,occurs" %}

While it is valid for a constraint to be repeated, `occurs` is not a constraint and may not appear more than once in any type definition.
The field `occurs` is never allowed in a `NAMED_TYPE_DEFINITION`.

The `occurs` field is optional.
Each constraint that accepts a variably-occurring type argument specifies what the default `occurs` value is for that constraint. 

It is permitted to use a nullable type argument wherever a variably-occurring type argument is accepted.
However, the `$null_or` annotation may not be applied to any variably-occurring type argument with an explicit `occurs` field.

{% include example.md title="Correct ways to construct a variably-occurring, nullable type" markdown='
```ion
type::{
  name: foo,
  ordered_elements:[
    // These are all valid
    $null_or::decimal,
    $null_or::{ codepoint_length: 5 },
    $null_or::{ id: "bar_schema.isl", type: bar_type },
    { type: $null_or::int, occurs: 3 },
    // This is not permitted
    // $null_or::{ type: int, occurs: 3 },
  ]
}
```
' %}

# Constraints

Constraints are the fundamental building blocks of types.
Each constraint is a rule that restricts the values that are valid for the type.

The order of constraints does not matter.
Constraints can be repeated, and when they are, all instances of the constraint will apply.

{% comment %}{% include example.md title="Repeated constraints" code_file="examples/placeholder.isl" %}{% endcomment %}

Generally speaking, constraints must reject null values as invalid.
For example, the precision and scale constraints must reject a null value, as `null` does not have a precision or scale to evaluate.
The `fields` constraint must reject `null.struct`, as `null.struct` does not have a collection of fields.
Similar reasoning applies to the expected handling of null values by most constraints.
The `contains`, `annotations`, `valid_values`, and type-algebra constraints are exceptions to this, as these constraints may be defined such that a null value is valid.

### Ranges

{% include grammar-element.md productions="range_int,range_number,range_timestamp,range_timestamp_precision,number,exclusivity" %}

Some constraints can be defined by a range.
A range is represented by a list annotated with `range`, and containing two values, in order: the minimum and maximum ends of the range.
The default behavior is for both ends of the range to be *inclusive*; 
if *exclusive* behavior is desired, the minimum or maximum (or both) values shall be annotated with `exclusive`.
If the minimum or maximum end of a range is to be unspecified, this shall be represented by the symbols `min` or `max`, respectively. 
The symbols `min` and `max` may not be annotated with `exclusive`, and a range may not contain both `min` and `max`.

All ranges have a type.
The type of the range is the same as that of the minimum and/or maximum values specified in the range list. 
If both a minimum and maximum values are specified (i.e. `min` and `max` are not used), then both of those values must be of the same type. 
(For example, `range::[1995-12-06T, 55.4]` mixes values of the timestamp and number types, and therefore is not a valid range.)


## all_of

{% include grammar-element.md productions="all_of" %}

Value must be valid for all the types listed. The list of types must not be empty.

{% include example.md title="`all_of` constraint" markdown="
```ion
type::{
  name: Duck,
  all_of: [
    WalksLikeADuck,
    QuacksLikeADuck,
  ]
}
```
" %}

## annotations

{% include grammar-element.md productions="annotations,annotations_modifier" %}

Restricts the allowed annotations on a value.
Applicable to all types except `document`.
A `document` does not have a list of annotations (not even an empty list); therefore, a `document` must always be rejected by the `annotations` constraint.

This constraint has two available syntaxes.
The "Standard" syntax is very expressive, but can be verbose for simple use cases.
The "Simple" syntax is based on the Ion Schema 1.0 `annotations` syntax, and is concise, but only supports a limited set of use cases.

### Standard Syntax

The `annotations` constraint specifies the type and/or constraints for all annotations of a value.
[The annotations themselves are symbols _tokens_](https://amzn.github.io/ion-docs/docs/spec.html#annot) but will be considered a non-null list of non-null, un-annotated symbol _values_ for the purpose of validation.
The list of annotation symbols must match the given type.

{% capture sample_code %}
// Annotations must contain "red" and "blue" in any order, and may contain other annotations, such as "yellow"
annotations: { contains: [red, blue] }                   

// Only the annotations "red" and "blue" are permitted, but they are not required
annotations: { element: { valid_values: [red, blue] } }  

// No annotations are permitted
annotations: { container_length: 0 }                     

// Annotations must match the regex
annotations: { element: { regex: "\\w+(\\.\\w+)" } }   

// Each annotation must not be more than 8 bytes when encoded as UTF8
annotations: { element: { utf8_byte_length: range::[min,8] } }     

// Value must have the annotation "foo", optionally followed by one more annotation which can be anything
annotations: { ordered_elements: [ { valid_values: [foo] }, { occurs: optional, type: any } ]   
{% endcapture %}
{% include example.md title="`annotations` constraint; standard syntax" code=sample_code %}

### Simple Syntax
Argument may be a list of allowed annotation symbols. 
The annotations are required to be present on the value if the list is annotated with `required`
Additional annotations can be prevented by adding the `closed` annotation to the list of valid annotations.
The list must be annotated with at least one of `closed` or `required`.
Repeated symbols in the list have no effect; the list should be treated as if it were a set.

While similar to `annotations` in Ion Schema 1.0, it differs in the following ways:
- `ordered::` annotation is removed
- at least one of `closed::` or `required::` is required on the list of annotations
- annotation level `required::` and `optional::` annotations are removed

{% capture sample_code %}
annotations: required::[red, blue]                // Annotations must contain "red" and "blue" in any order, and may contain other annotations, such as "yellow"
annotations: closed::required::[red, green, blue] // Annotations must contain exactly "red", "green", and "blue" in any order
annotations: closed::[red, blue]                  // Only the annotations "red" and "blue" are permitted, but they are not required
annotations: closed::[]                           // No annotations are permitted
{% endcapture %}
{% include example.md title="`annotations` constraint; simplified syntax" code=sample_code %}

Anything that can be represented by the simplified syntax can also be represented by the standard syntax.

<!-- TODO: Add examples of equivalence between standard and simplified syntax -->

## any_of

{% include grammar-element.md productions="any_of" %}

The value must match any of the specified types. The list of types must not be empty.

{% include example.md title="`any_of` constraint" code_file="examples/placeholder.isl" %}

## byte_length

{% include grammar-element.md productions="byte_length" %}

The exact or minimum/maximum number of bytes in a blob or clob.
Note that this constrains the number of bytes in the blob or clob _value_, which differs from the number of bytes needed to serialize the blob/clob.
<!-- Note: we need to use liquid tags to escape the double '{' in the following lines because otherwise these will be processed as a liquid tag. The escape code &#123; does not work because it's between backticks, which gets rendered into a <pre></pre>. /-->
For example, the clob `{{"{{"}}"hello"}}` has a `byte_length` of 5 bytes, but the actual number of bytes in the serialized representation is 11 bytes.
The same clob value, could also be encoded as `{{"{{"}} '''hello''' }}`, and it would still have a `byte_length` of 5 bytes, but the actual number of bytes in the serialized representation is now 17 bytes.
The values `null.blob` and `null.clob` do not have a length of 0.
Rather, they have no length at all, and are always invalid for this constraint.

{% comment %}{% include example.md title="`byte_length` exact" code_file="examples/placeholder.isl" %}{% endcomment %}
{% comment %}{% include example.md title="`byte_length` range" code_file="examples/placeholder.isl" %}{% endcomment %}

## codepoint_length

{% include grammar-element.md productions="codepoint_length" %}

The exact or minimum/maximum number of Unicode codepoints in a string or symbol.
Note that characters are a complex topic in Unicode, whereas codepoints provide an unambiguous unit for constraining the length of a string or symbol.
The values `null.string` and `null.symbol` do not have a sequence of codepoints, and are always invalid for this constraint.

{% comment %}{% include example.md title="`codepoint_length` exact" code_file="examples/placeholder.isl" %}{% endcomment %}
{% comment %}{% include example.md title="`codepoint_length` range" code_file="examples/placeholder.isl" %}{% endcomment %}

## container_length

{% include grammar-element.md productions="container_length" %}

Applicable for `list`, `sexp`, `struct`, and `document` values.

The exact or minimum/maximum number of elements in a list, S-expression or document, or fields in a struct.
The values `null.list`, `null.sexp`, and `null.struct` do not have a length of 0.
Rather, they have no length at all, and are always invalid for this constraint.

{% comment %}{% include example.md title="`container_length` exact" code_file="examples/placeholder.isl" %}{% endcomment %}
{% comment %}{% include example.md title="`container_length` range" code_file="examples/placeholder.isl" %}{% endcomment %}

## contains

{% include grammar-element.md productions="contains" %}

Indicates that the `list`, `sexp`, `struct`, or `document` is expected to contain all the specified values, in no particular order.
If a value is specified more than once, the repeated instances of the value have no effect.

{% comment %}{% include example.md title="`contains`" code_file="examples/placeholder.isl" %}{% endcomment %}

## element

{% include grammar-element.md productions="element" %}

Defines the type and/or constraints for all values within a homogeneous list, S-expression, document, or struct.

{% comment %}{% include example.md title="`element`" code_file="examples/placeholder.isl" %}{% endcomment %}

The `distinct` annotation on the type argument indicates that the constraint should not allow repeated elements within the container.
For the purpose of this constraint, the comparison of the values (including any annotations) in the container is governed by the equivalence rules defined by the [Ion data model](https://amzn.github.io/ion-docs/docs/spec.html#the-ion-data-model).

{% comment %}{% include example.md title="Disallowing duplicate elements" code_file="examples/placeholder.isl" %}{% endcomment %}

## exponent

{% include grammar-element.md productions="exponent" %}

This constraint specifies an exact or minimum/maximum range indicating the exponent of an Ion decimal.
The exponent of an Ion decimal is determined from the [decimal data model](https://amzn.github.io/ion-docs/docs/decimal.html#data-model) rather than the serialized text or binary form.
For example, the text of `1.23`, `123d-2`, and `0.123d1` are different, but using the decimal data model, they all have the same coefficient (`123`) and exponent (`-2`).

Remember that decimal values with digits after the decimal point have a _negative_ exponent, so to require at least two digits after the decimal point, you must specify `exponent: range::[min, -2]`.

{% include note.html type="tip" content="See [Modeling SQL Decimals](../cookbook/sql-decimals.md) to learn how `exponent` relates to the concept of _scale_." %} 

{% comment %}{% include example.md title="`exponent` exact" code_file="examples/placeholder.isl" %}{% endcomment %}
{% comment %}{% include example.md title="`exponent` range" code_file="examples/placeholder.isl" %}{% endcomment %}

### Converting from Ion Schema 1.0 `scale` to `exponent`

The `exponent` constraint replaces the `scale` constraint found in ISL 1.0.
To convert a from `scale` to `exponent`, simply multiply a single argument by -1 (e.g. `scale: 4` becomes `exponent: -4`) or reflect the range relative to 0 (e.g. `scale: range::[min, 5]` becomes `exponent: range::[-5, max]`).

## field_names

{% include grammar-element.md productions="field_names" %}

Applicable for `struct` values.

The field_names constraint defines the type and/or constraints for all field names within a struct.
Field names are symbol tokens and will be represented as symbol values for the purpose of validation.
Any value that is not a struct, as well as `null.struct`, will always be invalid for this constraint.

{% comment %}{% include example.md title="Limiting the length of field names" code_file="examples/placeholder.isl" %}{% endcomment %}
{% comment %}{% include example.md title="Limiting the characters used in field names" code_file="examples/placeholder.isl" %}{% endcomment %}

The `distinct` annotation on the type argument indicates that the constraint should not allow field names to be repeated within a single struct.

{% comment %}{% include example.md title="Disallowing repeated field names" code_file="examples/placeholder.isl" %}{% endcomment %}

## fields

{% include grammar-element.md productions="fields,field" %}

The `fields` constraint is a collection of field definitions—a field name and an associated type—that constrain the values in a struct.

The values for all occurrences of a field name must match the associated type.
Ion structs allow field names to be repeated, and a field definition applies to all occurrences of a field name in the value being validated.
In addition, the number of times that a field name may occur can be specified with `occurs`.
(See [§Variably-Occurring Type Arguments](#variably-occurring-type-arguments).)
If a field definition does not specify a value for `occurs`, the field may occur zero or one times.
The `fields` constraint may not have multiple definitions for a given field name—i.e. field names may not be repeated within a single instance of the `fields` constraint.

{% comment %}{% include example.md title="open `fields`" code_file="examples/placeholder.isl" %}{% endcomment %}

The default behavior for `fields` is to allow additional content beyond what is explicitly specified.
Annotating the `fields` struct with `closed::` indicates that only fields that are explicitly specified should be allowed. 

{% comment %}{% include example.md title="closed `fields`" code_file="examples/placeholder.isl" %}{% endcomment %}

## ieee754_float

{% include grammar-element.md productions="ieee754_float" %}

The `ieee754_float` constraint allows you to test whether a float value is losslessly compatible with the given [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) interchange format.
Any value that is not an Ion float is invalid, and `null.float` is invalid.
The special values `nan`, `+inf`, and `-inf` are always valid.
For numeric values, a value is valid if and only if it can be losslessly converted from the Ion representation to the specified float representation, and back to the Ion representation.

{% comment %}{% include example.md title="`ieee754_float`" code_file="examples/placeholder.isl" %}{% endcomment %}

## not

{% include grammar-element.md productions="not" %}

Value must not be valid for the type.

{% comment %}{% include example.md title="`not`" code_file="examples/placeholder.isl" %}{% endcomment %}

## one_of

{% include grammar-element.md productions="one_of" %}

Value must be valid for exactly one of the types. The list of types must not be empty.

{% include note.html type="important" content="
Specifying two overlapping types may cause unexpected results.
For example, if you specify `one_of: [$null_or::int, $null_or::float]`, the value `null` will be invalid because it matches two type arguments. 
" %}

{% comment %}{% include example.md title="`one_of`" code_file="examples/placeholder.isl" %}{% endcomment %}

## ordered_elements

{% include grammar-element.md productions="ordered_elements" %}

Defines constraints over a list of values in a heterogeneous list, S-expression, or document.
Each value in a list, S-expression, or document is expected to be valid against the type in the corresponding position of the specified types list.
Each type is implicitly defined with `occurs: 1`—behavior which may be overridden.
(See [§Variably-Occurring Type Arguments](#variably-occurring-type-arguments).)

When specified, this constraint fully defines the content of a list, S-expression, or document—open content is not allowed.

{% comment %}{% include example.md title="`ordered_elements`" code_file="examples/placeholder.isl" %}{% endcomment %}

## precision

{% include grammar-element.md productions="precision" %}

Applicable for `decimal`.
An exact or minimum/maximum indicating the number of digits in the unscaled value of a decimal.
The minimum precision must be greater than or equal to `1`.

{% comment %}{% include example.md title="`precision`" code_file="examples/placeholder.isl" %}{% endcomment %}

## regex

{% include grammar-element.md productions="regex" %}

Tests whether a `symbol` or `string` has any matches for the given regular expression.
The regular expression is a string that conforms to a *RegularExpressionBody* defined by [ECMA 262 Regular Expressions](https://www.ecma-international.org/ecma-262/5.1/#sec-7.8.5).
Regular expressions shall be limited to the following features:

|                     |                                      |
|--------------------:|--------------------------------------|
|                     | Unicode codepoints match themselves  |
|                 `.` | any codepoint                        |
|             `[abc]` | codepoint class                      |
|             `[a-z]` | range codepoint class                |
|        `[a-cABC\d]` | union codepoint class                |
|            `[^abc]` | complemented codepoint class         |
|            `[^a-z]` | complemented range codepoint class   |
|       `[^a-cABC\d]` | complemented union codepoint class   |
|                 `^` | anchor at the beginning of the input |
|                 `$` | anchor at the end of the input       |
|             `(...)` | grouping                             |
| <code>&vert;</code> | alternation                          |
|                 `?` | zero or one                          |
|                 `*` | zero or more                         |
|                 `+` | one or more                          |
|               `{x}` | exactly x occurrences                |
|              `{x,}` | at least x occurrences               |
|             `{x,y}` | at least x and at most y occurrences |

Regular expression flags may be specified as annotations on the regular expression string; supported flags shall include:

|     |                              |
|----:|------------------------------|
| `i` | case insensitive             |
| `m` | ^ and $ match at line breaks |

The following classes are provided:

| | |
| `\d` | digit: `[0-9]` |
| `\D` | non-digit |
| `\s` | whitespace: `[ \f\n\r\t]` |
| `\S` | non-whitespace |
| `\w` | word character: `[A-Za-z0-9_]` |
| `\W` | non-word character |

The following characters may be escaped with a backslash:  `. ^ $ | ? * + \ [ ] ( ) { }`.
Note that in Ion text a backslash must itself be escaped, so correct escaping of these characters requires two backslashes, e.g.:  `\\.`.


## timestamp_offset

{% include grammar-element.md productions="timestamp_offset" %}

Limits the timestamp offsets that are allowed. 
An offset is specified as a string of the form `"[+|-]hh:mm"`, where `hh` is a two-digit number between 00 and 23, inclusive, and `mm` is a two-digit number between 00 and 59, inclusive.
The offset `"+00:00"` is equivalent to `Z`.
The offset `"-00:00"` represents unknown local offset.
For more details about offsets, see the [Ion Specification – Timestamps](https://amzn.github.io/ion-docs/docs/spec.html#timestamp).

{% comment %}{% include example.md title="`timestamp_offset`" code_file="examples/placeholder.isl" %}{% endcomment %}

## timestamp_precision

{% include grammar-element.md productions="timestamp_precision,timestamp_precision_value,range_timestamp_precision" %}

Indicates the exact or minimum/maximum precision of a timestamp.
Timestamp precision ranges follow the rules set out in [§Ranges](#ranges).
Valid timestamp precision values are, in order of increasing precision: `year`, `month`, `day`, `minute`, `second`, `millisecond`, `microsecond`, and `nanosecond`.

{% comment %}{% include example.md title="`timestamp_precision`" code_file="examples/placeholder.isl" %}{% endcomment %}

## type

{% include grammar-element.md productions="type" %}

Indicates the type that a value shall be validated against.

{% comment %}{% include example.md title="`type`" code_file="examples/placeholder.isl" %}{% endcomment %}

## utf8_byte_length

{% include grammar-element.md productions="utf8_byte_length" %}

An exact or minimum/maximum indicating number of bytes in the [UTF-8](https://en.wikipedia.org/wiki/UTF-8) encoding of a string or symbol.
The values `null.string` and `null.symbol` have no UTF-8 encoding and are always invalid for this constraint.

{% include note.html type="tip" content="
Use `codepoint_length` to constraint the logical size of the text data.
Use `utf8_byte_length` to constrain the physical size of the text encoding.
For text that is guaranteed to contain only ASCII code points, `utf8_byte_length` and `codepoint_length` can be used interchangeably since each ASCII code point is represented by a single UTF-8 code unit.
" %}

{% comment %}{% include example.md title="`utf8_byte_length`" code_file="examples/placeholder.isl" %}{% endcomment %}

## valid_values

{% include grammar-element.md productions="valid_values,value_or_range,number_range,timestamp_range" %}

A list of acceptable values or ranges of values; any values not present in the list (or range) are invalid.
The argument to this constraint can be a range or a list of unannotated values or a list containing a mix of ranges and unannotated values.

Ignoring annotations, the value must match one of the list of valid values or be within the boundaries of a range.
Whether a particular value matches a specified value is governed by the equivalence rules defined by the Ion data model.
For example, `1.230` is not valid for `valid_values: [1.23]`, as it has a different precision.
While these may be mathematically equal values, they are not _equivalent data_.
In particular, note that `nan` is valid for `valid_values: [nan]` because in the Ion data model, all valid Ion encodings of `nan` are _equivalent data_.

{% include note.html type="note" content="
`valid_values` only matches a single Ion value.
Recall that a `document` is not a single Ion value, but rather a stream of values, so a `document` is always invalid for the `valid_values` constraint.
" %}

For numeric and timestamp types, `valid_values` may optionally be defined as a range.
Numeric and timestamp ranges follow all the rules specified in [§Ranges](#ranges).

A `number` range includes all values of any numeric type (i.e. `float`, `int`, and `decimal`) that fall within that range mathematically.
When testing a value for inclusion, the range bounds and the value that is being tested will all be converted to `decimal` values for the sake of comparison.
`number` ranges do not include values of any other type.
The `float` type includes [special non-number values](https://amzn.github.io/ion-docs/docs/float.html#special-values) (`nan`, `+inf`, and `-inf`).
Attempting to use a non-number value as the bound of a number range will result in an error.
When tested for inclusion in a number range, the non-number float values are always outside the bounds of the number range, even when one of the range bounds is `min` or `max`.
Number-typed `null` values are never valid for any number range.

A `timestamp` range includes any `timestamp` that falls between the minimum and maximum in chronological order.
All [`timestamp` values](https://amzn.github.io/ion-docs/docs/spec.html#timestamp) represent an instant in time.
A `timestamp` with limited precision (for example, a year-only timestamp like `2007T`) maps to an instant by assuming that all unspecified time unit fields are effectively zero (or one for the month and day units). 
`2007T` would map to the instant represented by `2007-01-01T00:00.000-00:00`.
Note that `timestamp` values that do not have a time component (that is `YYYYT`, `YYYY-MMT`, and `YYYY-MM-DDT` timestamps) have an unknown offset (`-00:00`).
Timestamps that have an unknown offset are UTC timestamps that make no assertion about the offset in which they occurred.
The value `null.timestamp` is never in the bounds of a timestamp range, and `timestamp` ranges do not include values of any other type.

# Open Content

{% include grammar-element.md productions="user_reserved_fields_declaration,user_reserved_fields_declaration_field" %}

The Ion Schema 2.0 specification allows users to insert additional content that is not part of the Ion Schema language into a schema document.
This additional content may be used for documentation, integrations with other tools or frameworks, or any other desired purpose.

A schema header, type definition, or schema footer may include extra fields that are not explicitly stated in the Ion Schema specification.
These extra fields may have any field name that is not a *keyword*.
If the field name is a *reserved symbol*, its use as open content must be declared in the appropriate subfield of the `user_reserved_fields` field in the schema header.
For example, the reserved symbol `list_type` may be used in a type definition if `user_reserved_fields: { type: [ list_type ] }` is present in the schema header.

{% capture sample_code %}
```ion
schema_header::{
  info: "This schema is about penguins.",
  user_reserved_fields: {
    schema_header: [info],
    type: [region, crested, banded],
  }
}
type::{
  name: adelie,
  type: penguin,
  region: antarctica,
  crested: false,
  banded: false,
}
type::{
  name: humboldt,
  type: penguin,
  region: south_america,
  crested: false,
  banded: true,
}
```
{% endcapture %}
{% include example.md title="A schema with open content using reserved symbols as open content field names." markdown=sample_code %}

An Ion Schema MAY include extra top-level values that are not explicitly specified in the Ion Schema specification, but any top-level open content MUST NOT be annotated with a *reserved symbol*.
Top-level open content may appear after the Ion Schema version marker and before, between, or after any header, types, or footer.
Note that a top-level symbol value with the same text as an Ion schema version marker is always interpreted as an Ion Schema version marker and can never be valid open content.

{% capture sample_code %}
```ion
penguins

$ion_schema_2_0

$note_to_self::"I really like penguins. Get ready!"
3
2
1
Go

schema_header::{
  _info: "This schema is about penguins."
}

(I <3 Penguins!)

type::{
  name: adelie,
  type: penguin,
  _region: antarctica,
  _crested: false,
  _banded: false,
}

"I have watched many penguin documentaries and know many facts about penguins."

type::{
  name: humboldt,
  type: penguin,
  _region: south_america,
  _crested: false,
  _banded: true,
}

FAQ::{
  q: "What is the biggest extant species of penguin?",
  a: "The emperor penguin."
}

TODO::
'''Add definitions for southern rockhopper penguins, emperor penguins, king '''
'''penguins, gentoo penguins, chinstrap penguins, and macaroni penguins.    '''

[ "Goodbye" ]
```
{% endcapture %}
{% include example.md title="A schema with open content using un-reserved symbols as open content field names, and top-level open content displaying the author's excitement and love for the subject." markdown=sample_code %}

{% comment %} TODO: include an example of top-level open content used in ion-schema-tests.{% endcomment %}

No other open content is allowed except for what is explicitly identified in this section.

#### Reserved Symbols

The set of reserved symbols SHALL be all symbols matching the regular expression `^(\$ion_schema(_.*)?|[a-z][a-z0-9]*(_[a-z0-9]+)*)$`.
Informally stated, this is the symbol `$ion_schema`, all symbols starting with `$ion_schema_`, and all [identifier symbols](https://amzn.github.io/ion-docs/docs/spec.html#symbol) that are *snake case* and start with an unaccented ascii, lower-case letter.

#### Keywords
A keyword is a reserved symbol that has been assigned a meaning by the Ion Schema specification.
The following is a list of all keywords in Ion Schema 2.0.
The keywords in this list are case-sensitive, so `ALL_OF`, for example, is not a keyword.
```ion
all_of
annotations
any_of
as
byte_length
codepoint_length
container_length
contains
element
exponent
field_names
fields
id
imports
name
not
occurs
one_of
ordered_elements
precision
regex
schema_footer
schema_header
timestamp_offset
timestamp_precision
type
user_reserved_fields
utf8_byte_length
valid_values
```

# Compatibility with Ion Schema 1.0

Ion Schema 2.0 will be fully interoperable with Ion Schema 1.0.

* Any Ion Schema implementation with support for Ion Schema 2.0 must also support reading Ion Schema 1.0. (See [RFC: Ion Schema 2.0](../../rfcs/ion_schema_2_0/ion_schema_2_0) for the differences between Ion Schema 1.0 and 2.0.)
* Ion Schema 2.0 shall allow importing schemas written in Ion Schema 1.0.
* Any implementation of ISL 1.0 that also implements ISL 2.0 must allow types from an ISL 2.0 schema to be imported by an ISL 1.0 schema.
* The interoperability requirements stated here shall not apply to Ion Schema 3.0 or any future major version unless that major version explicitly restates them. (i.e., Ion Schema 3.0 is allowed to say that implementations must also support Ion Schema 2.0 but are not required to support Ion Schema 1.0.)

# Change Log
This is a list of all non-trivial changes to this document since it was first published.
For a complete list of changes, refer to the commit history at [`amazon-ion/ion-schema`](https://github.com/amazon-ion/ion-schema).

* **2023-04-27**—Renamed "Type Reference" to "Type Argument" to better convey the purpose.
