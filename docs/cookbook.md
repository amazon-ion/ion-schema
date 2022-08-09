---
title:  Ion Schema Language Cookbook
---
# {{ page.title }}

## Optionally ignoring the occurs requirement for fields

Suppose you have a type definition for a struct, and sometimes you want to validate the fields without enforcing the
required-ness of fields. (A possible use case for this is to perform partial validation on a partially constructed 
piece of data.) Ion Schema does not provide any flag or option to "turn off" the required-ness of fields, so you can
model this in Ion Schema by composing two types. In one type, you can define the types of each field, and in another
type you can define whether a field is required (or more generally, the number of times the field can occur). Finally,
the type you intended to create can be defined as a composition of these two types you have created.


Here is an example using a `Customer` type:
```ion
type::{
  name: CustomerFieldTypes,
  fields: {
    title: { valid_values: ["Dr.", "Mr.", "Mrs.", "Ms."] },
    firstName: string,
    middleName: string,
    lastName: string,
    suffix: { valid_values: ["Jr.", "Sr.", "PhD"] },
    preferredName: string,
    customerId: {
      one_of: [
        { type: string, codepoint_length: 18 },
        { type: int, valid_values: range::[100000, 999999] },
      ],
    },
    addresses: { type: list, element: Address },
    lastUpdated: { timestamp_precision: second },
  },
  content: closed,
}

type::{
  name: CustomerFieldOccurrences,
  fields: {
    firstName: { occurs: required },
    lastName: { occurs: required },
    addresses: { occurs: required },
    customerId: { occurs: required },
    lastUpdated: { occurs: required },
  }
}

type::{
  name: Customer,
  all_of: [CustomerFieldTypes, CustomerFieldOccurrences],
}
```

When you want to validate only that the fields have the correct types, and that there are no unexpected fields, you can
test your data against `CustomerFieldTypes`, and when you want the validation to also enforce required fields,
you can test your data against `Customer`.

## Expressing logical relationships between fields

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

## Modeling SQL Decimals in Ion Schema

Ion `decimal` and SQL `DECIMAL` have some fundamental differences that make it complex to compare values between the two types.

A SQL `DECIMAL` is an exact numeric type, having a precision `P` and a scale `S`. `P` is a positive integer that 
determines the number of significant digits in a particular radix (base-10 for `DECIMAL`), and `S` is a non-negative 
integer. Every value of a `DECIMAL` type of scale `S` is of the form n × 10<sup>–S</sup>, where n is an integer such 
that –10<sup>P</sup> < n < 10<sup>P</sup>. (For more details about SQL numeric types, including `DECIMAL`, see SQL-92 §4.4.)
Therefore, the precision of the number `12.34` is not determined by the actual number of digits, but (speaking informally)
by the data type it is assigned. `12.34` can be assigned to `DECIMAL(38,2)` just as easily as `DECIMAL(4,2)`. That is to
say, precision and scale are a property of the `DECIMAL` data _type_ rather than being inherent in the value.

On the other hand, the Ion decimal data type has no particular precision or scale as it is an _arbitrary precision_ data
type—the precision and scale of an Ion decimal value are inherent in the value itself.

As a result of these differences, when converting a value from a SQL `DECIMAL` to an Ion `decimal`, it is _possible_ to 
preserve the scale of the `DECIMAL` (as it becomes the exponent of the Ion decimal, multiplied by -1), but the precision
is lost. When converting from an Ion `decimal` to a `DECIMAL(p,s)`, the precision and scale of the Ion value are always 
lost because the value is converted into having the precision and scale of `DECIMAL(p,s)`.

That being said, here are some questions that one might be trying to answer by modeling SQL `DECIMAL` and how to approach
modeling them in Ion Schema.

**Does `x` have the exact precision and the exact scale of `DECIMAL(p,s)`?**

This is probably the least useful way to model a SQL `DECIMAL`, and is included here only to help explain why exact 
precision is not useful when modeling `DECIMAL` in Ion Schema.

Using `DECIMAL(5,2)` as our example, we can model an _exact_ precision and scale like this:
```
type::{
  precision: 5,
  scale: 2,
}
```
This will only allow `decimal`s with 5 digits, and two after the decimal point. However, this will not accept valid 
`DECIMAL(5,2)` values such as `1.00`.

**Does `x` have a compatible precision and the exact scale of `DECIMAL(p,s)`?**

This way of modeling a SQL `DECIMAL` is useful for scenarios where the value was a SQL `DECIMAL(p,s)` before being 
converted to Ion.

This can be separated into two parts:
1. Does `x` have exactly `s` digits after the decimal point?
2. Does `x` have less than or equal to `p` digits? (Or is `-10^(p-s) < x < 10^(p-s)`?)


Using `DECIMAL(5,2)` as our example, we can model a _compatible_ precision and _exact_ scale like this:
```
type::{
  precision: range::[min, 5],
  scale: 2,
}
```
This will accept values such as `100.00`, `1.50`, and `0.01`. It will reject values such as `100`, `1.5`, `0.010`, and `1000.0`.

Instead of using the `precision` constraint, we could also use `valid_values: range::[-999.99, 999.99]` to achieve the same result.

**Does `x` fit in a `DECIMAL(p,s)` without having to round or truncate any digits after the decimal point?**

This is probably the most useful way to model a SQL `DECIMAL` in Ion Schema. It can be used for validating that data 
_could_ have been a `DECIMAL(p,s)` before it was converted to Ion, and that the value could be converted to a 
`DECIMAL(p,s)` without any rounding or truncating.

This can be separated into two parts:
1. Does `x` have less than or equal to `s` digits after the decimal point?
2. Is `-10^(p-s) < x < 10^(p-s)`?

Using `DECIMAL(5,2)` as our example again, we can model a _compatible_ precision and scale like this:
```
type::{
  scale: [min, 2],
  // Scale is not fixed, so we cannot use the `precision` constraint. Must use `valid_values` instead.
  valid_values: range::[ -999.99, 999.99 ],
}
```
This will accept values such as `1.5`, `1.50`, `5d2`, and `500`. It will reject values such as `1200`, `1.2d5`, `1.501`,
and `1.500`.



## Using Ion Schema Schemas for syntactical validation of your schemas

![I heard you like schemas, so I made a schema for validating your schemas](../assets/schema-for-schema-meme.png) 

[Ion-schema-schemas](https://github.com/amzn/ion-schema-schemas) has Ion schemas that describe a valid Ion schema.
These schemas can be used to help validate your own schemas as part of your build process.

Here is an example automated test using Kotlin and JUnit4.

```kotlin
import com.amazon.ion.system.IonSystemBuilder
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized
import java.io.File

@RunWith(Parameterized::class)
class MySchemasTest(val file: File) {

    companion object {
        private val ION = IonSystemBuilder.standard().build()
        private val ISS = IonSchemaSystemBuilder.standard()
            .withIonSystem(ION)
            .withAuthority(ResourceAuthority.forIonSchemaSchemas())
            .build()
        private val schemaType = ISS.loadSchema("isl/schema.isl").getType("schema")!!

        @JvmStatic
        @Parameterized.Parameters(name = "{0} is syntactically valid")
        fun getSchemas(): Iterable<Array<out Any>> = File("my-schemas-base-directory/").walk()
            .filter { it.isFile && it.path.endsWith(".isl") }
            .map { arrayOf(it) }
            .asIterable()
    }

    @Test
    fun testSchema() {
        val mySchemaIon = ION.loader.load(file)
        val violations = schemaType.validate(mySchemaIon)
        Assert.assertTrue(violations.toString(), violations.isValid())
    }
}
```

_Note—there are some problems, such as duplicate type names or unresolvable imports, that cannot be caught by the Ion Schema schemas._
