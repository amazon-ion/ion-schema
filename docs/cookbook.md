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
