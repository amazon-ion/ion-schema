---
title:  Expressing logical relationships between fields
---
# {{ page.title }}
_(Applies to Ion Schema 1.0 and Ion Schema 2.0.)_


Sometimes you may need to model logical relationships between fields. Consider the following:
```ion
type::{
  name: Address,
  fields: {
    country: string,
    street: string,
    postal_code: string,
    zip: int,
    state: string,
    province: string,
  }
}
```
The fields `postal_code` and `province` would be used for Canadian addresses, whereas `state` and `zip` would be used for US addresses.
An address having a `province` and a `state` or a `province` and a `zip` would not be valid.

Sometimes these situations can be resolved by a careful rethinking of the data model.
(In this case, one could create a field that represents a province _or_ state and another field that can represent a postal code _or_ zip code.)
However, it is not always possible to modify the structure of the data if you already have data or if the data model is shared with other systems.

In many cases, it is possible (even preferable) to treat the type as a union of other types.
For example, `Address` is union of `USAddress` and `CanadianAddress`.
```ion
type::{
  name: Address,
  one_of: [USAddress, CanadianAddress]
}
type::{
  name: USAddress,
  fields: {
    street: string,
    state: string,
    country: string,
    zip: int,
  }
}
type::{
  name: CanadianAddress,
  fields: {
    street: string,
    province: string,
    country: string,
    postal_code: string,
  }
}
```

### Advanced cases
If the logical relationships in your data model are not easily described as a union of other types, or you are having difficulty determining how to break down
the sub-types of the union, you can follow these steps to express the relationships in ISL.

1. Write down the relationships as a propositional logic statement: `(zip ↔ state) AND (province ↔ postal_code) AND (state ↔ ~province)`
2. Convert the statement to [Disjunctive Normal Form](https://en.wikipedia.org/wiki/Disjunctive_normal_form): `(zip AND state AND ~province AND ~postal_code) OR (~zip AND ~state AND province AND postal_code)`
3. Convert each conjunction to an ISL inline type and combine in an `any_of` constraint.

```ion
type::{
  name: Address,
  fields: {
    country: string,
    street: string,
    postal_code: string,
    zip: int,
    state: string,
    province: string,
  },
  any_of: [
    { fields: { zip: {occurs:required}, state: {occurs:required}, postal_code: nothing, province: nothing } },
    { fields: { zip: nothing, state: nothing, postal_code: {occurs:required}, province: {occurs:required} } }
  ]
}
```


Here are some more examples demonstrating how propositional logic can be represented as ISL.

```ion
type::{
  name: a_or_b, // A V B
  type: struct,
  any_of: [
    { fields: { a: { occurs: required } } },
    { fields: { b: { occurs: required } } }
  ]
}

type::{
  name: a_implies_b, // A → B ≡ A' V B
  type: struct,
  any_of: [
    { fields: { a: nothing } },
    { fields: { b: { occurs: required } } }
  ]
}

type::{
name: a_implies_not_b, // A → B' ≡ A' V B'
  type: struct,
  any_of: [
    { fields: { a: nothing } },
    { fields: { b: nothing } }
  ]
}

type::{
  name: a_iff_b, // A ↔ B ≡ (A Λ B) V (A' Λ B')
  type: struct,
  any_of: [
    { fields: { a: { occurs: required }, b: { occurs: required } } },
    { fields: { a: nothing, b: nothing } }
  ]
}

type::{
  name: a_xor_b, // A ↔ B' ≡ (A Λ B') V (A' Λ B)
  type: struct,
  any_of: [
    { fields: { a: { occurs: required } , b: nothing } },
    { fields: { a: nothing, b: { occurs: required } } },
  ]
}
```

This strategy can be applied just as easily to elements in a list.

```ion
type::{
  name: contains_a_implies_contains_b,
  type: list,
  any_of: [
    { not: { contains: [A] } },
    { contains: [B] }
  ]
}
```
