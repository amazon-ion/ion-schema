---
title:  Optionally ignoring the occurs requirement for fields
---
# {{ page.title }}
_(Applies to Ion Schema 1.0 and Ion Schema 2.0. Example code uses Ion Schema 2.0.)_

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
  fields: closed::{
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
