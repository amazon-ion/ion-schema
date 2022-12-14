---
title:  Modeling SQL Decimals in Ion Schema
---
# {{ page.title }}
_(Applies to Ion Schema 1.0 and Ion Schema 2.0.
Example code uses Ion Schema 2.0; for Ion Schema 1.0, replace `exponent` with `scale` and negate the argument.)_

Ion `decimal` and SQL `DECIMAL` have some fundamental differences that make it complex to compare values between the two types.

A SQL `DECIMAL` is an exact numeric type, having a precision `P` and a scale `S`. `P` is a positive integer that
determines the number of significant digits in a particular radix (base-10 for `DECIMAL`), and `S` is a non-negative
integer. Every value of a `DECIMAL` type of scale `S` is of the form n × 10<sup>–S</sup>, where n is an integer such
that –10<sup>P</sup> < n < 10<sup>P</sup>. (For more details about SQL numeric types, including `DECIMAL`, see SQL-92 §4.4.)
Therefore, the precision of the number `12.34` is not determined by the actual number of digits, but (speaking informally)
by the data type it is assigned. `12.34` can be assigned to `DECIMAL(38,2)` just as easily as `DECIMAL(4,2)`. That is to
say, precision and scale are a property of the `DECIMAL` data _type_ rather than being inherent in the value.

On the other hand, the [Ion decimal](https://amzn.github.io/ion-docs/docs/decimal.html) data type has an _exponent_ property instead of a scale property.
Because an Ion decimal can have more than one encoding, the value of the exponent property is actually the _adjusted exponent_ as defined in the [IBM Hursley Lab General Decimal Arithmetic Specification](https://speleotrove.com/decimal/damodel.html):

> The _adjusted exponent_ is the value of the exponent of a number when that number is expressed as though in scientific notation with one digit (non-zero unless the coefficient is 0) before any decimal point.
> This is given by the value of the `exponent+(clength–1)`, where `clength` is the length of the coefficient in decimal digits.

For example, the adjusted exponent of the values `0.00123d2` and `0.123d0` is the exponent of the adjusted form, `1.23d-1`.
Informally, the exponent property is like the negation of scale, except that positive and negative numbers are valid exponents, but scale may only be non-negative.
Finally, the Ion decimal _data type_ has no particular precision or exponent as it is an _arbitrary precision_ data type.
Instead, the precision and exponent of an Ion decimal value are inherent in the value itself.

As a result of these differences, when converting a value from a SQL `DECIMAL` to an Ion `decimal`, it is _possible_ to
preserve the scale of the `DECIMAL` (as it becomes the exponent of the Ion decimal, multiplied by -1), but the precision
is lost. When converting from an Ion `decimal` to a `DECIMAL(p,s)`, the precision and exponent of the Ion value are always
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
  exponent: -2,
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
  exponent: -2,
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
  exponent: [-2, max],
  // Exponent is not fixed, so we cannot use the `precision` constraint. Must use `valid_values` instead.
  valid_values: range::[ -999.99, 999.99 ],
}
```
This will accept values such as `1.5`, `1.50`, `5d2`, and `500`. It will reject values such as `1200`, `1.2d5`, `1.501`,
and `1.500`.
