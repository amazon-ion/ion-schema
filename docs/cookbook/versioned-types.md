---
title: Modeling types for payloads with embedded version metadata
---

# {{ page.title }}

_(Applies to Ion Schema 2.0.)_

When a data type evolves over time, new fields are introduced, removed, or
changed in successive versions. You may want a single schema type that validates
all versions of the data, enforcing that fields only appear (or are required)
when the version number permits it.

Ion Schema's [`any_of`](../isl-2-0/spec#any_of) constraint combined with
[`nothing`](../isl-2-0/spec#built-in-types) and
[`valid_values`](../isl-2-0/spec#valid_values) ranges lets you express these
version-dependent field rules declaratively.

This document describes one of many possible patterns for modeling versioned
schemas and is intended to be informative, not prescriptive.

## The pattern

The core idea is:

1. Include a version identifier in the payload data.
2. Define all fields (across all versions) in a single
   [`closed`](../isl-2-0/spec#fields) `fields` constraint.
3. For each group of fields introduced in a particular version, add an `any_of`
   constraint that says: _either those fields are absent, or the version number
   is at least that version._

This means older data (with a lower version number) will only pass validation if
the newer fields are not present, while newer data (with a higher version
number) is allowed to include them.

## Choosing a version type

The examples in this article use an integer version field, but other version
representations work well too:

| Representation | Ion type    | Range support | Example                    |
| -------------- | ----------- | ------------- | -------------------------- |
| Sequential int | `int`       | Yes           | `1`, `2`, `3`              |
| Calendar date  | `timestamp` | Yes           | `2024-06-01`, `2025-01-30` |
| Semver string  | `string`    | No            | `"1.0.0"`, `"2.1.4"`       |


[Calendar Versioning](https://calver.org/) (CalVer) is a popular choice for data
formats that evolve on a release schedule. Using an Ion `timestamp` with day or
month [precision](../isl-2-0/spec#timestamp_precision) preserves range support,
so you can write constraints like `valid_values: range::[2024-06T, max]` to mean
"version 2024-06 or later". The `timestamp_precision` constraint on the version
field ensures all version values have consistent precision, preventing unexpected
range comparison behavior from mixed precisions:

```ion
type::{
  name: CalVerExample,
  fields: closed::{
    version: { occurs: required, timestamp_precision: month },
    name: { occurs: required, type: string },
    color: string,  // since 2024-06
  },
  any_of: [
    { fields: { color: nothing } },
    { fields: { version: { valid_values: range::[2024-06T, max] } } },
  ],
}
```

[Semantic Versioning](https://semver.org/) (SemVer) uses a
`MAJOR.MINOR.PATCH` string to convey compatibility information in
the version number itself.

If you use a string-based version (such as SemVer), you cannot use
ranges. Instead, enumerate the valid versions explicitly with
[`valid_values`](../isl-2-0/spec#valid_values):

```ion
  any_of: [
    { fields: { color: nothing } },
    { fields: { version: { valid_values: ["2.0.0", "2.1.0", "3.0.0"] } } },
  ],
```

(A `regex` constraint is also possible and may be useful for semantic versions that include build metadata.)

The remainder of this article uses sequential integer versions for clarity.

## Basic example

Suppose you have a `Widget` type that started at version 1 with just a `name`
field. In version 2, a `color` field was added. In version 3, `weight` and
`dimensions` were added.

```ion
$ion_schema_2_0

type::{
  name: Widget,
  fields: closed::{
    version: { type: int, occurs: required },
    name: { type: string, occurs: required },
    color: string,       // since v2
    weight: decimal,     // since v3
    dimensions: string,  // since v3
  },
  // Optional fields added in v2:
  // Either `color` is absent, or `version` >= 2.
  any_of: [
    { fields: { color: nothing } },
    { fields: { version: { valid_values: range::[2, max] } } },
  ],
  // Optional fields added in v3:
  // Either `weight` and `dimensions` are absent, or `version` >= 3.
  any_of: [
    { fields: { weight: nothing, dimensions: nothing } },
    { fields: { version: { valid_values: range::[3, max] } } },
  ],
}
```

### How it works

Each [`any_of`](../isl-2-0/spec#any_of) encodes an implication: _if field X is present, then version must
be at least N._ Written in propositional logic:

> present(field) &rarr; version &ge; N

Which is equivalent to the disjunction:

> &not;present(field) &or; version &ge; N

In Ion Schema, "not present" is expressed by constraining the field to
[`nothing`](../isl-2-0/spec#built-in-types) (no value can satisfy the
empty type, so the field must be absent). "Version is at least N" is expressed
by constraining the `version` field with `valid_values: range::[N, max]`.

(For more background on expressing logical relationships in Ion Schema, see
[Expressing logical relationships between fields](logical-relationships).)

### Validation examples

The following values are **valid** for the `Widget` type:

```ion
// v1 - only base fields
{ version: 1, name: "sprocket" }

// v2 - includes color
{ version: 2, name: "gear", color: "red" }

// v3 - includes all fields
{ version: 3, name: "bolt", color: "zinc", weight: 4.5, dimensions: "M8x30" }

// v2 without the optional v2 field (color is not required)
{ version: 2, name: "washer" }
```

The following values are **invalid**:

```ion
// INVALID: v1 data cannot have `color`
{ version: 1, name: "sprocket", color: "blue" }

// INVALID: v2 data cannot have `weight` (added in v3)
{ version: 2, name: "gear", weight: 1.2 }

// INVALID: v2 data cannot have `dimensions` (added in v3)
{ version: 2, name: "bolt", dimensions: "M6x20" }
```

## Extended example: an evolving API response

This example demonstrates several real-world version evolution scenarios in a
single type: a field changing types, a field being removed, and an enum gaining
a variant.

Consider an `ApiResponse` type that evolves through four versions:

- **v1**: Initial release with `request_id` (int), `status`, and `payload`.
- **v2**: `request_id` changes from `int` to accept either `int` or `string` (to
  support a new ID format). Adds a `metadata` field.
- **v3**: Adds a `priority` enum field with values `low`, `medium`, `high`.
- **v4**: Removes the `metadata` field (replaced by data in `payload`). Adds a
  `critical` variant to `priority`.

```ion
$ion_schema_2_0

// The `priority` enum, v3 variants
type::{
  name: PriorityV3,
  valid_values: [low, medium, high],
}

// The `priority` enum, v4 variants (adds `critical`)
type::{
  name: PriorityV4,
  valid_values: [low, medium, high, critical],
}

type::{
  name: ApiResponse,
  fields: closed::{
    version: { occurs: required, type: int },
    request_id: { occurs: required, type: any },
    status: { occurs: required, type: string },
    payload: { occurs: required, type: struct },
    metadata: struct,       // added v2, removed v4
    priority: symbol,       // added v3, expanded v4
  },

  // --- request_id type evolution ---
  // In v1, request_id must be int.
  // In v2+, request_id can be int or string.
  any_of: [
    { fields: { request_id: int } },
    { fields: { request_id: { any_of: [int, string] }, version: { valid_values: range::[2, max] } } },
  ],

  // --- metadata lifecycle ---
  // metadata allowed only in v2 and v3
  any_of: [
    { fields: { metadata: nothing } },
    { fields: { version: { valid_values: range::[2, 3] } } },
  ],

  // --- priority lifecycle ---
  // In v3, priority must use the v3 variant set.
  // In v4+, priority may use the expanded variant set.
  // Before v3, priority must be absent.
  any_of: [
    { fields: { priority: nothing } },
    { fields: { version: { valid_values: [3] },
                priority: PriorityV3 } },
    { fields: { version: { valid_values: range::[4, max] },
                priority: PriorityV4 } },
  ],
}
```

### Scenario: field changes type

The `request_id` field is typed as [`any`](../isl-2-0/spec#built-in-types) in
the `fields` constraint (any non-null value). The `any_of` then narrows it:
either the field satisfies `int`, or the version is 2+ and the field satisfies
`int` or `string`. This means v1 data must have an integer `request_id`, while
v2+ data can have either `int` or `string`.

### Scenario: field removed in a later version

The `metadata` field is confined to versions 2 and 3 with a single `any_of`:
either `metadata` is absent, or the version is in `range::[2, 3]`. This covers
both introduction (not allowed before v2) and removal (not allowed after v3) in
one constraint.

### Scenario: enum gains a variant

The `priority` field uses named types (`PriorityV3`, `PriorityV4`) to define the
valid enum values for each version range. A single `any_of` handles introduction,
version-specific variants, and absence with a three-way disjunction: either
`priority` is absent (versions before it was introduced), or the version is
exactly `3` and the value matches `PriorityV3`, or the version is 4+ and the
value matches `PriorityV4`.

### Validation examples

```ion
// Valid v1
{ version: 1, request_id: 42, status: "ok", payload: {} }

// Valid v2 - request_id is now a string, metadata present
{ version: 2, request_id: "abc-123", status: "ok",
  payload: {}, metadata: { trace_id: "x" } }

// Valid v3 - priority with v3 variant
{ version: 3, request_id: "def-456", status: "ok",
  payload: {}, metadata: { trace_id: "y" }, priority: high }

// Valid v4 - metadata gone, priority uses new variant
{ version: 4, request_id: "ghi-789", status: "ok",
  payload: {}, priority: critical }

// INVALID: v1 cannot have string request_id
{ version: 1, request_id: "bad", status: "ok", payload: {} }

// INVALID: v4 cannot have metadata
{ version: 4, request_id: "x", status: "ok",
  payload: {}, metadata: {} }

// INVALID: v3 cannot use the `critical` priority variant
{ version: 3, request_id: "x", status: "ok",
  payload: {}, priority: critical }
```

## Requiring fields in newer versions

The pattern above makes newer fields _allowed_ but not _required_ in newer
versions. If you want a field to be **required** when the version is high
enough, add an additional `any_of` that encodes the reverse implication:

> version &ge; N &rarr; present(field)

Which is equivalent to:

> version &lt; N &or; present(field)

```ion
$ion_schema_2_0

type::{
  name: WidgetStrict,
  fields: closed::{
    version: { occurs: required, type: int },
    name: { occurs: required, type: string },
    color: string,  // required since v2
  },
  // `color` not allowed in v1, required in v2+
  any_of: [
    { fields: { color: nothing, version: { valid_values: [1] } } },
    { fields: { color: { occurs: required }, version: { valid_values: range::[2, max] } } },
  ],
}
```

With this definition, a version-2 `WidgetStrict` _must_ include `color`, but a
version-1 `WidgetStrict` must not.

Note that `color` is declared as optional in `fields` (no `occurs: required`).
The conditional requirement is enforced entirely by the `any_of`. If you used
`occurs: required` on the field in `fields`, it would be required for _all_
versions, defeating the purpose.

### Three-state lifecycle: absent, optional, required

A field may pass through three states across versions: absent (not yet
introduced), optional (allowed but not required), and required. This requires
one `any_of` constraint for each transition:

```ion
$ion_schema_2_0

type::{
  name: ThreeStateExample,
  fields: closed::{
    version: { occurs: required, type: int },
    name: { occurs: required, type: string },
    email: string,  // optional in v2, required in v3+
  },
  // email not allowed before v2
  any_of: [
    { fields: { email: nothing } },
    { fields: { version: { valid_values: range::[2, max] } } },
  ],
  // email required in v3+
  any_of: [
    { fields: { version: { valid_values: range::[min, 2] } } },
    { fields: { email: { occurs: required } } },
  ],
}
```

With this definition:

- **v1**: `email` must be absent.
- **v2**: `email` is optional (allowed but not required).
- **v3+**: `email` is required.

## Independently versioned composed types

In many data models, a parent type contains a collection of child items, and the
parent and children evolve on independent version schedules. Each type carries
its own `version` field and its own version-gating constraints.

Here is an example where a `ShoppingCart` contains a list of `CartItem`s. The
cart and its items are versioned independently:

```ion
$ion_schema_2_0

type::{
  name: CartItem,
  fields: closed::{
    version: { occurs: required, type: int },
    product_id: { occurs: required, type: string },
    quantity: { occurs: required, type: int },
    unit_price: decimal,    // since v2
    discount: decimal,      // since v3
  },
  any_of: [
    { fields: { unit_price: nothing } },
    { fields: { version: { valid_values: range::[2, max] } } },
  ],
  any_of: [
    { fields: { discount: nothing } },
    { fields: { version: { valid_values: range::[3, max] } } },
  ],
}

type::{
  name: ShoppingCart,
  fields: closed::{
    version: { occurs: required, type: int },
    cart_id: { occurs: required, type: string },
    items: { occurs: required, type: list, element: CartItem },
    coupon_code: string,    // since v2
    shipping_estimate: {    // since v2
      timestamp_precision: day,
    },
  },
  any_of: [
    { fields: { coupon_code: nothing, shipping_estimate: nothing } },
    { fields: { version: { valid_values: range::[2, max] } } },
  ],
}
```

Each `CartItem` in the `items` list is validated against its own `version`
field. A v1 `ShoppingCart` can contain v3 `CartItem`s and vice versa. The
versions are decoupled.

The [`element`](../isl-2-0/spec#element) constraint on `items` ensures every
entry in the list satisfies the `CartItem` type (including its version-gating
rules).

### Validation examples

```ion
// A v1 cart with a mix of v1 and v2 items
{
  version: 1,
  cart_id: "cart-001",
  items: [
    { version: 1, product_id: "SKU-A", quantity: 2 },
    { version: 2, product_id: "SKU-B", quantity: 1, unit_price: 9.99 },
  ],
}

// A v2 cart with v3 items
{
  version: 2,
  cart_id: "cart-002",
  coupon_code: "SAVE10",
  shipping_estimate: 2025-03-15T,
  items: [
    { version: 3, product_id: "SKU-C", quantity: 1,
      unit_price: 24.99, discount: 2.50 },
  ],
}

// INVALID: v1 cart cannot have coupon_code
{
  version: 1,
  cart_id: "cart-003",
  coupon_code: "OOPS",
  items: [],
}

// INVALID: v1 item cannot have unit_price
{
  version: 2,
  cart_id: "cart-004",
  items: [
    { version: 1, product_id: "SKU-D", quantity: 1, unit_price: 5.00 },
  ],
}
```

## Multiple fields per version

When several fields are introduced in the same version, group them in a single
`any_of` constraint. All fields in the group should appear together in the
`nothing` alternative:

```ion
  // Fields added in v3
  any_of: [
    { fields: { weight: nothing, dimensions: nothing } },
    { fields: { version: { valid_values: range::[3, max] } } },
  ],
```

This means that _any_ of those fields being present requires version 3 or
higher, but they do not need to co-occur. In v3+, any combination of the
grouped fields is valid. Use separate `any_of` constraints when fields are
introduced in different versions.

## Tips

- **Closed fields are important.** Without [`closed::`](../isl-2-0/spec#fields),
  unknown fields are silently allowed regardless of version, which defeats the
  purpose of version gating.
- **Use named types for complex field constraints.** When a field's valid values
  change across versions (like the `priority` enum above), define a named type
  for each version's constraint set. This keeps the main type readable.
- **Validation cost scales linearly.** Each `any_of` constraint is evaluated
  independently during validation. For types with many version gates, this means
  validation cost grows with the number of gates. (See
  [`ion-schema-rust#253`](https://github.com/amazon-ion/ion-schema-rust/issues/253))
  for the mitigation of this issue.)
