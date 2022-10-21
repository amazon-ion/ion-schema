# RFC: Ion Schema 2.0 Open Content

<!-- TOC start -->
- [Ion Schema 2.0 Open Content](#rfc-ion-schema-20-open-content)
  - [Introduction](#introduction)
  - [Definitions/Glossary](#definitionsglossary)
  - [Motivation](#motivation)
     - [The meaning of "open content" is underspecified](#the-meaning-of-open-content-is-underspecified)
     - [Lack of reserved words interferes with the evolution of Ion Schema](#lack-of-reserved-words-interferes-with-the-evolution-of-ion-schema)
     - [Known Use-Cases Differ from the Specification](#known-use-cases-differ-from-the-specification)
  - [Solution](#solution)
     - [Definition of Reserved and Un-Reserved Symbols](#definition-of-reserved-and-un-reserved-symbols)
     - [Open Content in Ion Schema Language Structures](#open-content-in-ion-schema-language-structures)
     - [Repeated Field Names](#repeated-field-names)
     - [Additional Top Level Values](#additional-top-level-values)
     - [Any other content is prohibited](#any-other-content-is-prohibited)
  - [Alternatives Considered](#alternatives-considered)
     - [Relying on Casing/Sigils](#relying-on-casingsigils)
     - [Enforcing stylistic choices](#enforcing-stylistic-choices)
     - [Set of unreserved symbols](#set-of-unreserved-symbols)
     - [Do not allow open content to shadow built-in constraints of ISL](#do-not-allow-open-content-to-shadow-built-in-constraints-of-isl)
     - [Allow Ion Schema 2.0 keywords to be name-shadowed](#allow-ion-schema-20-keywords-to-be-name-shadowed)
     - [Designate a specific field for user content, and do not allow anywhere else](#designate-a-specific-field-for-user-content-and-do-not-allow-anywhere-else)
     - [Alternatives for Top-Level Open Content](#alternatives-for-top-level-open-content)
  - [Appendix – FAQ](#appendix--faq)
     - [Repeated field names seems like an antipattern; what should we do about that?](#repeated-field-names-seems-like-an-antipattern-what-should-we-do-about-that)
     - [What about field names with unusual characters?](#what-about-field-names-with-unusual-characters)
     - [Exactly what sort of open content is allowed now?](#exactly-what-sort-of-open-content-is-allowed-now)
     - [Is there a syntax we could use for sharing user-content declarations between multiple schemas?](#is-there-a-syntax-we-could-use-for-sharing-user-content-declarations-between-multiple-schemas)
  - [Appendix – Open Content Edge Cases in Ion Schema 1.0](#appendix--open-content-edge-cases-in-ion-schema-10)
<!-- TOC end -->

## Introduction

The purpose of this document is to specify the nature of allowed "open content" within an Ion Schema document so that we can avoid conflicts between user defined content, extensions, and unreleased language features.

This document does not seek to address whether "open content" in an Ion Schema document can be associated with any particular functionality (such as custom constraint behavior).

This document builds upon changes proposed in  [Ion Schema Language Versions](language_versions.md) and assumes the reader is familiar with that document.

*The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).*

## Definitions/Glossary

* **Ion Schema Language (ISL):** the syntax, grammar, and set of constraints for validating Ion data, as well as the rules that govern how an Ion Schema implementation should interpret and apply schemas to Ion data.
* **Schema Document**: A single stream of Ion values that conforms to the Ion Schema grammar. (In IonJava terms, an IonDatagram that conforms to an Ion Schema specification.)  A schema may be a subsequence of a larger stream of Ion values, but it is the responsibility of Authority implementations to provide zero-or-one schemas for a given schema ID.
* **Open Content**: Additional information in an Ion Schema document that is not part of the Ion Schema Language
* **Reserved symbol:** A symbol that is reserved for use by the Ion Schema Language
* **Key Word:** A reserved symbol that is given a meaning by (i.e. part of) the Ion Schema Language
* **Unreserved symbol:** A symbols that will never be used by the Ion Schema Language
* **Ion-reserved symbol:** A symbol that is reserved by the Ion specification—"By convention, symbols starting with `$` should be reserved for system tools, processing frameworks, and the like, and should be avoided by applications and end users. In particular, the symbol `$ion` and all symbols starting with `$ion_` are reserved for use by the Ion notation and by related standards."
* **Snake Case:** A style of writing where spaces between words are represented by underscores (`_`) and letters are lowercase

## Motivation

### The meaning of "open content" is underspecified

The Ion Schema 1.0 Specification says:

>ISL itself allows for open content – additional information may be specified within a type definition (or schema_header / schema_footer), and such additional content is simply ignored. [[source](https://amzn.github.io/ion-schema/docs/spec.html#open-content)]

This does not describe where in the type definition, header, or footer the extra data may occur. Does this mean that unknown field names are allowed? Does this mean that extra values or annotations for a constraint may be specified?
It does not describe how repeated fields are to be handled within these structs (are they repeated constraints, or are they considered "additional information"—ie. open content?).

### Lack of reserved words interferes with the evolution of Ion Schema

When it was released in 2018, Ion Schema 1.0 had no reserved or unreserved symbols. In September 2021, in response to a user question, Ion Schema 1.0 was updated to have unreserved symbols ([ion-schema #50](https://github.com/amzn/ion-schema/pull/50)). This change placed limits on Ion Schema, effectively reserving a set of words for users that can never become Ion Schema keywords in the future. This is beneficial for customers because they can add open content using those words as field names without worrying about conflict with future keywords, but it does not provide any reserved symbols for Ion Schema’s use.

Because Ion Schema 1.0 has no reserved symbols, any new feature that is added to the language has a chance of conflicting with a user’s "open content", thereby making the change backwards incompatible. Ion Schema 1.0’s open content causes almost any new feature to require a new major version of the Ion Schema specification.

[Ion Schema Language Versions](language_versions.md) defines a contract for new versions of Ion Schema, and in order to have backwards compatible changes, we need to put more guard rails around open content for Ion Schema 2.0

### Known Use-Cases Differ from the Specification

Finally, the Ion Schema reference implementation ([Ion Schema Kotlin](https://github.com/amzn/ion-schema-kotlin)) is more permissive about open content than the Ion Schema 1.0 specification. This has enabled customer use cases that were not originally intended by the Ion Schema specification. (For example, one internal customer is known to use a top-level symbol to indicate the version of their API that the schema corresponds to, and [ion-schema-tests](https://github.com/amzn/ion-schema-tests) adds test cases as top-level values in schema documents.) Even though these may not have been intended, the fact that customers are using top-level open content is a strong signal that we should allow some provision for it in the specification.

## Solution

### Definition of Reserved and Un-Reserved Symbols

The set of *reserved symbols* SHALL be all symbols matching the regular expression `($ion_schema(_.*)?|[a-z][a-z0-9]*(_[a-z0-9]+)*)`. Informally stated, this is the symbol `$ion_schema`, all symbols starting with `$ion_schema_`, and all [identifier symbols](https://amzn.github.io/ion-docs/docs/spec.html#symbol) that are *snake case* and start with an unaccented ascii, lower-case letter.

The set of *un-reserved symbols* SHALL be the complement of the set of reserved symbols.

##### Keywords

A keyword is a reserved symbol that has been assigned a meaning by the Ion Schema specification.

Whether a reserved symbol is considered a keyword is context dependent.

* Within a type definition, the keywords SHALL be `name`, `occurs`, and `id` , as well as all the constraints defined in this version of the Ion Schema specification.
* Within the schema header, the keywords SHALL be `imports` and `user_reserved_fields`.
* There are no keywords in a schema footer.

### Open Content in Ion Schema Language Structures

Within a type definition, schema header, or schema footer, *unreserved symbols* may freely be used as field names for additional content. For example:

```
schema_header::{
  _info: "This schema is about penguins."
}
type::{
  name: adelie,
  type: penguin,
  _region: antarctica,
  _crested: false,
  _banded: false,
}
type::{
  name: humboldt,
  type: penguin,
  _region: south_america,
  _crested: false,
  _banded: true,
}
schema_footer::{}
```

In order to use a *reserved symbol* for additional content, the use of that word must be declared in the schema header. In addition, an individual declaration is scoped to one of `schema_header`, `type`, or  `schema_footer`. For example:

```
schema_header::{
  imports: [
    // ...
  ],
  // This is valid open content even though the `user_reserved_fields` struct comes "after" 
  // it because structs are unordered.
  foo: 1,
  user_reserved_fields: {
    schema_header: [
      // foo is only available in the header
      foo,
      // documentation is declared for the header, and later also declared for type
      documentation,
    ]
    type: [
      documentation,
      should_index,
    ],
  },
  documentation: "This schema is for ...",
}

type:: {
  name: product_title,
  documentation: '''product_title isn't sanitised, so beware of the potential for code injection attacks''',
  type: string,
  codepoint_length: range::[1, 50],
  should_index: true,
}

schema_footer::{}
```

#### Name Shadowing of Keywords

Name shadowing is when a user reserves the same symbol text as an element of the Ion Schema language. Ion Schema 2.x must allow name shadowing in order for it to be possible for a new keyword to be introduced as a minor version upgrade by the rules set forth in [Language Versions: Minor Versions](language_versions.md#minor-versions). (For example, if a user has reserved `foo` and Ion Schema 2.Y+1 introduces `foo` as a keyword, allowing name-shadowing means that upgrading from Ion Schema 2.Y to 2.Y+1 is backwards compatible. Prohibiting name-shadowing would cause Ion Schema 2.Y+1 to be incompatible with Ion Schema 2.Y, and so 2.Y would actually have to be 3.0.) Be careful—*if a user reserves a keyword, it will effectively disable that keyword*. For example, if a user reserves `is_prime`, and a future version of Ion Schema introduces an `is_prime` constraint, `is_prime` will function as open content rather than provide the new constraint functionality.

Ion Schema 2.0 keywords may not be shadowed—only keywords introduced in Ion Schema >= 2.1. This is because name-shadowing a keyword is a concession to preserve backwards compatibility, not a feature in and of itself.


### Repeated Field Names

When two or more fields have the same name, they SHALL be the same type of content. (I.e. all shall be considered *open content* or all shall be considered a constraint.) This is because Ion structs are unordered, so we are not guaranteed to choose a "first" or "second" instance in a consistent way. Therefore, in order to ensure that the behavior of the schema is the same across all implementations, all instances of a field name must be treated equally.

In the first type of this example, both occurrences of `regex` are constraints that must be evaluated by an Ion Schema implementation. The two types in this example are functionally equivalent.

```
type::{
  regex: "[0-9]*",
  regex: ".{8}"
}

type::{
  all_of:[
    { regex: "[0-9]*" },
    { regex: ".{8}" },
  ]
}
```

Duplicate constraints are evaluated like any other constraint in a type definition. If any constraint is unsatisfied then the data is considered invalid, and each constraint reports separate (if any) violations.

### Additional Top Level Values

An Ion Schema MAY include extra top-level values that are not explicitly specified in the Ion Schema specification, but any top-level open content MUST NOT be annotated with a *reserved symbol*. Note that Ion Schema version markers are always interpreted as Ion Schema version markers and can never be valid open content. (See [Ion Schema Language Versions: ISL Version Marker Syntax and Implementation](language_versions.md#isl-version-marker-syntax-and-implementation)). Ion Schema implementations MAY provide APIs to read the top-level open content, but are not required to do so.

Examples:
```
[1, 2, 3]        // <-- Valid open content
$type::[1, 2, 3] // <-- valid open content
type::[1, 2, 3]  // <-- Invalid type definition

// Valid open content
$test_case::{
  type: positive_int,
  valid: [ 1, 2, 3 ],
  invalid: [ -1, 0, null.int, true, 2.0, 2e0, "two" ],
}

// All are valid open content, but be careful because they each use symbols starting
// with $ion_ which are reserved by the Amazon Ion Specification.
$ion_foo      
$ion_foo::{ a:1 }
$ion_schema
$ion_schema_x

// Not valid open content because of the reserved symbol annotation
foo::$ion_bar

// All are invalid as open content because of the use of $ion_schema... annotation
$ion_schema_foo::{}
$ion_schema_2_0::{}

// ISL version markers -- not open content
$ion_schema_38483_59879823 // <-- Invalid Ion Schema Version Marker, not valid as open content
$ion_schema_2_0            // <-- Valid Ion Schema Version Marker, but not valid
                           //     as open content. 
```

### Any other content is prohibited

If a stream of Ion values contains any _open content_ other than what is specified above, that stream of values SHALL NOT be a valid Ion Schema.

Some examples of illegal _open content_ include:

```
schema_header::aardvark::{ // Illegal extra annotation 'aardvark'
  imports: [
    // Illegal annotation 'armadillo' on an import
    armadillo::{ id: 'mammals/felines/leopards.isl' },
    // Illegal field 'stripes' in an import
    { id: 'mammals/felines/tigers.isl' stripes: true },
  ],
  user_reserved_fields: {
    type: [
      tarsir
    ]
  },
  // Illegal open content because "tarsir" was declared in the type definition scope.
  tarsir: 123,
}

$ion_schema_123_456 // ISL version marker is never open content

type::type::{ // Illegal repetition of 'type' annotation
  name: snow::leopard, // Illegal annotation on type name
  type: feline,
}

// Invalid use of `type` annotation for something that is not a type definition
type::(lemur ::= indri | ring_tailed | aye_aye | sifakas)

// Reserved symbol not allowed for top-level annotation
penguin::[
  macaroni, king, emperor, gentoo,
  rockhopper, humboldt, chinstrap,
  magellan, galapagos, adelie,
]

```

## Alternatives Considered

### Relying on Casing/Sigils

Should the "open content" rules *rely on* any sort of style or casing of field names? (E.g. `$` prefix indicates a custom constraint, no prefix is a reserved word, `_` prefix or non-snake case indicates user data.)

As much as possible, we do not want to rely on [sigils](https://en.wikipedia.org/wiki/Sigil_(computer_programming)) or casing to indicate the meaning of a field name. Casing is particularly problematic because it breaks down for characters that are not obviously upper or lower case (such as ‘1’, ‘🥧’, ‘$’, ‘_’, or characters in some non-Latin alphabets). Sigils would remove the need to declare user-reserved words, but limit the flexibility of mixing ISL with some other framework (e.g. fields that are directives for a hypothetical Ion 1.1 template generator).

### Enforcing stylistic choices

Should the open content rules *enforce* any sort of style or casing of field names?

Should we have a single, blessed syntax/style for user-defined content, or should we allow anything that does not conflict with the symbols that are reserved for Ion Schema?

Example of a so-called mixed-style struct

```
type::{
  name: foo,
  type: string,
  $foo: 1,
  BAR: 2,
  _baz: 3,
  FooBar: 4,
  '🙁' : '🥦'
  '😄' : '🍰'
}
```

Mixed-style structs might look ugly, but there is no technical reason for such a rule. If we care about the aesthetics of ISL, then we should consider writing a rule for an Ion Schema linter.

### Set of unreserved symbols

Should unreserved symbols be...

1. **Anything that does not match `($ion_schema(_.*)?|[a-z][a-z0-9]*(_[a-z0-9]+)*)`**
   This is the preferred solution presented in this document.
2. **Anything that does not match `($ion_schema(_.*)?|[a-zA-Z]).*`**
   This is unnecessarily restrictive. We have chosen to use snake case for Ion Schema Language keywords, so we have no need to reserve uppercase letters.
3. **Anything that matches `[$_].*` but not `$ion_schema(_.*)?`**
   The difference between this option, and option 1 is subtle. Option 1 allows open content identifiers such as `'--foo'` and `BAR`, whereas this option only allows unreserved symbols to start with `$` and `_`. This option is unnecessarily restrictive because Ion Schema will never try to introduce a keyword that is not an Ion identifier symbol.

**Should  `$isl(_.*)?` also be reserved?**

No. The ISL version marker has already set a precedent of using `$ion_schema` for Ion Schema system-level symbols.

Ultimately, the choice of reserving the `$ion_schema` prefix and snake-case symbols is because it seems to be a minimal subset of all symbols that gives room for Ion Schema to evolve without having exact knowledge of the future, and it has a relatively low cognitive burden for developers learning to use Ion Schema.

### Do not allow open content to shadow built-in constraints of ISL

While this seems like it would simplify things, it actually has the same problem of open content right now. Specifically, that any new ISL constraints would have the potential of conflicting with a new constraint, which would either change the behavior of a schema or render the schema invalid, and so any new constraint would require a new major version.

### Allow Ion Schema 2.0 keywords to be name-shadowed

It was originally considered to allow any reserved word to be used for user content, including ISL keywords. However, this presented some problems.

**Name-shadowing certain keywords introduces implementation problems**

Certain keywords will cause problems when name-shadowed by user content.

* **`id` in a type definition**. This could cause an inline type to be indistinguishable from an inline import in some cases
* **`name` in a type definition**. Needs to occur only once, unless we want to start allowing this as a way to provide multiple names for a type. (Actually, that is not a terrible idea.) Even if you override this, however, top-level types still need a name—where would it come from? All top-level types must have a name in order for a schema to be valid.
* **`user_reserved_fields` in schema header**. Overriding `user_reserved_fields` leads to a paradox because the implementation cannot know that `user_reserved_fields` is name-shadowed until reading the `user_reserved_fields` field with its original semantics, but if `user_reserved_fields` is overridden, then it cannot be used to define overrides.
* **`occurs` in a type definition**. If overridden, does everything always have the default `occurs` value? It is probably a bad idea, but it is technically possible.


**Possible Mitigations**

Open content theoretically *could* use `name`, but because all top-level types must still have a name, there would be conflict between the `name` open-content and `name` of the type. This could be mitigated by requiring that the name of the type be a single field with a symbol value, and all `name` fields that are not symbols are simply ignored for the purpose of determining the type name. Things that consume the open-content `name` fields could choose to use or ignore the actual type name. The ability to use `name` could be useful for layering a nominal type system on top of ISL using a custom constraint, though a name like `nominal_type` for the custom constraint might be a better idea to avoid confusion.

Custom constraints theoretically *could* use `id`, but there is a potential to be unable to distinguish between inline imports and type definitions. This could be mitigated by specifying that an un-annotated struct containing exactly one `type` field and one `id` field will always be considered an inline import. If other fields are present, or if the annotation `type::` is present, then it will be considered an inline type definition.

Allowing `name` and `id` to be used for custom constraints adds complexity to implementations and introduces edge cases that make the ISL rules more difficult for the developer to understand. Since there is no immediate use case for allowing `name` or `id` to be name-shadowed by a custom constraint, it seems like the simpler solution is to not allow these fields for open content. It would be a backwards compatible change if we decided, in a future version of ISL, to allow shadowing of `name` or `id`.

There is no clear mitigation for the paradox of name-shadowing `user_reserved_fields` in the header.

Each of these mitigations adds non-trivial amounts of implementation complexity and cognitive burden for Ion Schema users, so this was deemed unacceptable as a solution.

**Special classes of keywords**

Another alternative was to allow some keywords to be overridden, but not others. The keywords `id`, `name`, `user_reserved_fields`, and `type` were proposed, but it was impossible to come up with a logical way to divide up those keywords that can be name-shadowed, and those that cannot. If `type` is special, and cannot be name-shadowed, then so should its complement `not`. If both `type` and `not`, then so should all the algebraic and aggregation constraints—`all_of`, `any_of`, `one_of`, `element`, `fields`, and `ordered_elements`. This creates a slippery slope situation where it becomes increasingly untenable to argue that any known (as of Ion Schema 2.0) keyword should be allowed to be overridden.

Therefore, it was deemed simplest to prohibit name-shadowing of any Ion Schema 2.0 keyword. This is a two-way door decision, as we can easily allow it in a future minor version if a use case arises. On the other hand, allowing name-shadowing of Ion Schema 2.0 keywords would be a (relatively speaking) one-way door decision, since taking away that capability would require a new major version on Ion Schema.

### Designate a specific field for user content, and do not allow anywhere else

Rather than allowing arbitrary user keys inside type definition structs, we could define a single field for user-defined content. A straw-man proposal for such a field would be `user_reserved_fields`. This field could appear any number of times and have any value of any type. The biggest reason for this approach is that it is easier to implement because the schema system would not need to check the field names against a regex to determine whether a field is user content or not—there is only ever one field name for user content.

Ultimately, this was rejected as being too restrictive for users of Ion Schema with no actual benefit for implementations because the proposal for custom constraints would require arbitrary fields in a type definition anyway.

### Alternatives for Top-Level Open Content

**(A) No top-level open content**
Pros:

* Easy to implement
* Easy for users to understand
* Allows us to add a new top-level value to ISL without needing a major version bump.

Cons:

* This means that IF anyone wants to put non-ISL into a schema, they must filter the open content out before passing it to the Schema System
* If you are using the workaround, then when ISL adds new top-level values, it could break customers unless any customer filtering logic is appropriately updated for the new ISL version... but we cannot guarantee that custom code will do that.

Option A is rejected because customers must resort to workarounds to support their existing use cases. (Even if we think they are arguably flimsy use cases.) If we make them implement the workaround, it will likely be brittle. If we implement the workaround, we are basically doing (C).

This is not a customer-obsessed solution because it ignores real-world use cases and makes things harder for customers who have already started using this.

**(B) Top level content allowed in the ISL file/stream before the start of the schema and after the end of the schema.**

This supports the current known use cases of ISL tests and service interface version markers (e.g. `$foo_service_interface_1_0`).

If anyone does want top-level content in the middle, they have to resort to the workaround for (A).

How do we define the start and end of a schema? Suppose we have this:

```
type::{ ... }
$foo
type::{ ... }
```

Is this an invalid schema, or is the second type actually just open content? (Or maybe the first type is open content, and the second type is the schema?) The only way that we can resolve this consistently is to say that `type`, `schema_header`, `$ion_schema.*`, `schema_footer` are not allowed as open content, even after the end or before the beginning of a schema. (And so then we can assume that any of these are part of the schema.)

At this point, we have arrived at solution (C) with the additional restriction that open content cannot be in the middle of the schema.

Reasons for option B:

* It supports the known use cases
* It errs on the side of being restrictive; it is no more permissive than it needs to be.

Reasons against option B:

* It is more restrictive than it needs to be
* The rules for where open content can occur are more complicated than they need to be (higher cognitive burden for users).
* Has all the potential pitfalls of (A)—with lower likelihood, though—without the benefits of (A).

**(C) Allow anything as open content as long as it is not part of the Ion Schema language (e.g. version markers, headers, types, footers) and it does not use the `\$ion_schema(_*)?` reserved symbols.**

* Easy to implement
* Easy for users to understand
* Allows us to add a new top-level value to ISL without needing a major version bump by using an `$ion_schema_.*` annotation for introducing new language features.

Option C is preferable over Option B because it has a lower cognitive burden for Ion Schema users.

**(D) PREFERRED – Reserved and unreserved space**
Treat like fields in ISL structs. There is a reserved space and an unreserved space. However, unlike constraints, there is no way to override it (as of Ion Schema 2.0).


## Appendix – FAQ

#### Repeated field names seems like an antipattern; what should we do about that?

Create an Ion Schema linter. (See [ion-schema #60](https://github.com/amzn/ion-schema/issues/60).)

#### What about field names with unusual characters?

Field names such as ‘🥧_foo’, ‘   ’, ‘é∑å®ê’ are allowed, but often a bad idea.

To warn against foot-guns, we can create a linter rule that warns for any field names that are not [identifiers](https://amzn.github.io/ion-docs/docs/symbols.html#symbol-representations).

>**Identifier**: an unquoted sequence of one or more ASCII letters, digits, or the characters `$` (dollar sign) or `_` (underscore), not starting with a digit.

(source: [Ion Specification§Symbols](https://amzn.github.io/ion-docs/docs/spec.html#symbol))

#### Exactly what sort of open content is allowed now?

It depends on what you mean by "allowed". The specification says little about open content in the schema, and the open content allowed by the reference implementation is more permissive than the specification.

**Specification:**

>ISL itself allows for open content – additional information may be specified within a type definition (or schema_header / schema_footer), and such additional content is simply ignored.

No other type of open content is explicitly allowed or prohibited.

**Implementation:**

* Extra fields inside a type definition
* Extra top-level values in the schema document
* Extra annotations on type definitions, headers, footers, imports, some constraint arguments
* Extra fields inside an import definition
* Any non-struct inside the imports list
* Any non-list value for the `imports` field in the header
* Anything inside the footer
* Anything can be labelled as `schema_footer::` — null, struct, list, symbol, boolean
* You can have multiple schema headers and multiple schema footers
* Things that are not structs can be labelled as types. Eg. `type::[1, 2, 3]`

#### Is there a syntax we could use for sharing user-content declarations between multiple schemas?

This has been deemed out of scope for Ion Schema 2.0, but in a future version, it would be possible to introduce a syntax that is something like this:

```
$ion_schema_2_0
schema_header::{
  imports: [
    user_reserved_fields::{ id: foo }, // Imports the user content words defined in foo
    { id: foo, type: bar}
  ]
}
```

## Appendix – Open Content Edge Cases in Ion Schema 1.0
This is an assortment of edge cases that are not well-defined in Ion Schema 1.0

Is this type named "foo", "bar", "foo" and "bar", or should this be an error?

```
type::{
  name: foo,
  name: bar,
  type: string,
  codepoint_length: range::[min, 10]
}
```

Are the elements of this list Employees, Students, people who are both Employees and Students, or is the schema invalid?

```
type::{
  name: PeopleList,
  type: list,
  element: Student,
  element: Employee
}
```

Are all of these `foo::` annotations allowed? Are they part of the type definition for the purposes of open content?

```
type::foo::{
  name: foo::string_list,
   type: foo::list,
   container_length: foo::range::[1, foo::10],
   element: foo::string
}
```

Is this a valid schema? If so, what gets imported to this schema?

```
schema_header::{
   imports: [
    { id: a, type: aaa }
   ],
   imports: [
     { id: b, type: bbb }
   ]
}
// Is this open content or a second header?
schema_header::{
  imports: [
    { id: c, type: ccc }
  ],
  imports: [
    { id: d, type: ddd }
  ]
}

schema_footer::{}
```

Are all of these extra annotations allowed? (This is a valid schema according to `ion-schema-kotlin@v1.2.1`!)

```
type::$ion_schema_1_0

type::schema_header::schema_footer::{
  imports: [ 
    schema_header::{
      id: foo,
      imports: [ 
        { id: foo },
      ]
    }
  ]
}

type::schema_footer::{
  name: schema_footer::my_type,
  type: schema_footer::string,
}

schema_footer::{}
```
