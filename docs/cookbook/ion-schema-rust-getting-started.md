---
title:  Getting started with `ion-schema-rust`
---
# {{ page.title }}
_(Applies to Ion Schema 1.0.)_

This is a getting started cookbook for `ion-schema-rust`. It includes all the examples for using `ion-schema-rust` like loading a schema, using Ion schema ot validate Ion values etc.

* [Terms](#terms)
* [How to create a `SchemaSystem`?](#how-to-create-a-schemasystem)
    * [Creating `DocumentAuthority`](#creating-documentauthority)
    * [How to create `FileSystemDocumentAuthority`](#how-to-create-filesystemdocumentauthority)
    * [How to create `MapDocumentAuthority`](#how-to-create-mapdocumentauthority)
* [`DocumentAuthority` operations on schema](#docuementauthority-operations-on-a-schemasystem)
    * [How to get all the authorities that are there for a given `SchemaSystem`?](#how-to-get-all-the-authorities-that-are-there-for-a-given-schemasystem)
    * [How to add new authority into a `SchemaSystem`?](#how-to-add-new-authority-into-a-schemasystem)
    * [How to create a `SchemsSystem` with given authority or list of authorities?](#how-to-create-a-schemssystem-with-given-authority-or-list-of-authorities)
* [How to load a `Schema`?](#how-to-load-a-schemahttpsdocsrsion-schema040ion_schemaschemastructschemahtml)
    * [Loading a schema](#loading-a-schema)
* [How to create a schema programmatically(`IslSchema`)?](#how-to-create-a-schema-programmaticallyislschemahttpsdocsrsion-schema040ion_schemaislstructislschemahtml)
    * [How to create an `IslType`?](#how-to-definecreate-an-isltypehttpsdocsrsion-schema040ion_schemaislisl_typeenumisltypehtml)
    * [How to create `IslSchema`?](#how-to-create-islschema)
* [How to validate an Ion value using a `Schema`?](#how-to-validate-an-ion-value-using-a-schema)

## Terms

* **Schema Id**: A unique identifier provided to each schema.
* **Authority:** Authority is responsible for resolving particular class of schema identifiers. One example of authority is file system authority which resolves schema ids to files relative to a base path.
* **Schema System:**  Provides methods for instantiating instances of Schema. Requests each of the provided Authorities, in order to resolve the requested schema id until one successfully resolves it. 
* **Schema:** Schema is a collection of 0 or more Types. It contains an optional header, type definitions/ types and an optional footer. The schema header can optionally contain imports for that schema.
* **Import:** An Import allows types from other schemas to be used within a schema definition. These imports are usually defined in the schema header.

## How to create a `SchemaSystem`?

`ion-schema-rust` requires you to create an [`SchemaSystem`](https://docs.rs/ion-schema/0.4.0/ion_schema/system/struct.SchemaSystem.html) in order to load a schema from given file location. 
Hence, Creating a `SchemaSystem` is the first step to loading a schema file for validation. 

### Creating `DocumentAuthority`:

In general, users will create a [`DocumentAuhtority`](https://docs.rs/ion-schema/0.4.0/ion_schema/authority/trait.DocumentAuthority.html) and then use it to build the [SchemaSystem](https://docs.rs/ion-schema/0.4.0/ion_schema/system/struct.SchemaSystem.html). Then this [SchemaSystem](https://docs.rs/ion-schema/0.4.0/ion_schema/system/struct.SchemaSystem.html) is used instantiating instances of [Schema](https://docs.rs/ion-schema/0.4.0/ion_schema/schema/struct.Schema.html).
There are two types of `DocumentAuthority` available:

* [`FileSystemDocumentAuthority`](https://docs.rs/ion-schema/0.4.0/ion_schema/authority/struct.FileSystemDocumentAuthority.html) 
    * This authority allows to specify the base path to where all the schema files are saved (e.g. `/home/USER/schemas/`)
    * Adding this authority your `SchemaSystem` would allow to resolve all schema ids (relative path to schema file, e.g. `my_schema.isl`) that are within this authority’s base path(e.g. `/home/USER/schemas/`)
    * In order to load a schema id(e.g. `my_schema.isl`) with this `FileSystemDocumentAuthority` that is added to your `SchemaSystem` would be as simple as: `schema_system.load_schema("my_schema.isl")`
* [`MapDocumentAuthority`](https://docs.rs/ion-schema/0.4.0/ion_schema/authority/struct.MapDocumentAuthority.html)
    * This authority allows to specify a `HashMap` of schema ids as a key and the schema as value. 
    * Adding this authority your `SchemaSystem` would allow to resolve all schema ids that are within this authority’s map keys.
    * In order to load a schema id(e.g. `my_schema`) with this `FileSystemDocumentAuthority` that is added to your `SchemaSystem` would be as simple as: `schema_system.load_schema("my_schema")`

_Note: A single `SchemaSystem` can contain multiple `DocumentAuthority`s_

```rust
  // An example of `MapDocumentAuhtority` with `(schema_id, schema content)` pair
   (
        "my_schema", <--- schema id
        r#"                     _
            schema_header::{     |
            }                    |
            type::{              |  
                name: my_int,    |--> Ion schema as raw string
                type: int,       |
            }                    |
            schema_footer::{     |
            }                    |
        "#,                     -
  ),
```

### How to create `FileSystemDocumentAuthority`?
Creating a `FileSystemAuthority` requires to pass a base path where all the schema files resides.
```rust
// In this example, it is assumed that all the schema files that will
// later be used to load a schema are inside `sample_schemas` folder

let file_system_document_authority = FileSystemDocumentAuthority::new(Path::new(
    "sample_schemas",
));
```

### How to create `MapDocumentAuthority`?
Creating a `MapDocumentAuthority` requires to pass a `HashMap` with key-value pair of `(schema_id, schema content)`.
```rust
// map with (schema id, schema content) to represent `sample_number` schema
let map_authority = [
    (
        "sample_number.isl",
        r#"
            schema_header::{
                imports: [{ id: "sample_decimal.isl", type: my_decimal, as: other_decimal }],
            }
            type::{
                name: my_int,
                type: int,
            }
            type::{
                name: my_number,
                all_of: [
                    my_int,
                    other_decimal,
                 ],
            }
            schema_footer::{
           }
        "#,
  ),
  (
        "sample_decimal.isl",
        r#"
            schema_header::{
                imports: [],
            }
            type::{
                name: my_decimal,
                type: decimal,
             }
             schema_footer::{
             }
        "#,
   ),
];

// Create a MapDocumentAuthority using a map like above with 
// schema id as key and schema as value
let map_document_authority = MapDocumentAuthority::new(map_authority);
```

Finally, next code block shows how to create a `SchemSystem` using `FileSystemDocumentAuthority`

```rust
// Create authorities vector containing all the authorities that will be used to load a schema based on schema id
let document_authorities: Vec<Box<dyn DocumentAuthority>> = vec![Box::new(
    FileSystemDocumentAuthority::new(Path::new("sample_schemas")), <--- provide a path to the authority base folder containing schemas
)];

// Create a new schema system using given document authorities
let mut schema_system = SchemaSystem::new(document_authorities);
```

## `DocuementAuthority` operations on a `SchemaSystem`

### How to get all the authorities that are there for a given `SchemaSystem`?

In order to get all the authorities in a `SchemaSystem`:

```rust
// assuming the SchemSystem in built into variable: `schema_system`
let result = schema_system.authorities()
```

Output of the above operation will have following vector saved inside `result`:
```rust
vec![Box::new(
    FileSystemDocumentAuthority::new(Path::new("sample_schemas")),
)]
```

### How to add new authority into a `SchemaSystem`?

```rust
// assuming the SchemSystem in built into variable: `schema_system`
// following operation adds new authority with base path `tests` into `schema_system`
schema_system.add_authority(Box::new(FileSystemDocumentAuthority::new(Path::new("test"))));
```

### How to create a `SchemsSystem` with given authority or list of authorities?

```rust
// assuming the SchemSystem in built into variable: `schema_system`
// Creating a SchemaSystem with given authority would return a new SchemsSystem
// following operation creates a `new_schema_system` with an authority
// that has base path `tests`
let new_schema_system = schema_system.with_authority(
    Box::new(FileSystemDocumentAuthority::new(Path::new("test")))
);

// For creating an SchemaSystem with given list of authorities
let new_schema_system =  schema_system.with_authorities(vec![ 
    Box::new(FileSystemDocumentAuthority::new(Path::new("test"))),
    Box::new(FileSystemDocumentAuthority::new(Path::new("ion"))),
]);
```

## How to load a [`Schema`](https://docs.rs/ion-schema/0.4.0/ion_schema/schema/struct.Schema.html)?

### Example schema `my_schema.isl`

This file (`my_schema.isl`) defines a new type (`my_int_type`) based on Ion's int type.

```
schema_header::{
  imports: [],
}

type::{
  name: my_int_type,
  type: int,
}

schema_footer::{
}
```

### Loading a schema

```rust
use ion_schema::authority::{DocumentAuthority, FileSystemDocumentAuthority};
use ion_schema::external::ion_rs::value::owned::OwnedElement;
use ion_schema::result::{ValidationResult, IonSchemaResult};
use ion_schema::types::TypeRef;
use ion_schema::schema::Schema;
use ion_schema::system::SchemaSystem;
use std::path::Path;
use std::rc::Rc;

fn main() -> IonSchemaResult<()> {
    // Create authorities vector containing all the authorities that will be used to load a schema based on schema id
    let document_authorities: Vec<Box<dyn DocumentAuthority>> = vec![Box::new(
        FileSystemDocumentAuthority::new(Path::new("schema")), // provide a path to the authority base folder containing schemas
    )];

    // Create a new schema system from given document authorities
    let mut schema_system = SchemaSystem::new(document_authorities);

    // Provide schema id for the schema you want to load (schema_id is the schema file name here)
    let schema_id = "my_schema.isl";

    // Load schema
    let schema: Rc<Schema> = schema_system.load_schema(schema_id)?;
}
```

## How to create a schema programmatically([`IslSchema`](https://docs.rs/ion-schema/0.4.0/ion_schema/isl/struct.IslSchema.html))?

Programmatic construction of Ion schema refers to an internal model representation of Ion schema and it mostly resembles to the [grammar](https://amzn.github.io/ion-schema/docs/spec.html#grammar) specified in Ion schema spec.

### How to define/create an [IslType](https://docs.rs/ion-schema/0.4.0/ion_schema/isl/isl_type/enum.IslType.html)?
For an Ion schema type definition like:
```
type:: {
     name:my_type_name,
     type: int,
     all_of: [
         { type: bool }
     ]
}
```
The `IslType` can be created as shown below:
```rust
let isl_type = IslType::named(
    // represents the `name` of the defined type
    "my_type_name".to_owned(),
    vec![
        // represents the `type: int` constraint
        IslConstraint::type_constraint(
            IslTypeRef::named("int")
        ),
        // represents `all_of` with anonymous type `{ type: bool }` constraint
        IslConstraint::all_of(
            vec![
                IslTypeRef::anonymous(
                    vec![
                        IslConstraint::type_constraint(
                            IslTypeRef::named("bool")
                        )
                    ]
                )
            ]
        )
    ]
);
```

### How to create `IslSchema`?

```rust
// The `isl-type` defiend in the previous section cna be used here
let isl_schema = IslSchema::new(vec![], vec![isl_type], vec![]);
```

## How to validate an Ion value using a `Schema`?

### Example schema `my_schema.isl`

This file (`my_schema.isl`) defines a new type (`my_int_type`) based on Ion's int type.

```
schema_header::{
  imports: [],
}

type::{
  name: my_int_type,
  type: int,
}

schema_footer::{
}
```

### How to validate an Ion value using `Schema`?

```rust
// This example uses a schema that was created using how to load a schema section (`my_schema.isl`)?
// Retrieve a particular type from this schema
let type_ref: TypeRef = schema.get_type("my_int_type").unwrap();

let valid_element: OwnedElement = 5.into();
let invalid_element: OwnedElement = 5e3.into();
let invalid_document_element: Vec<OwnedElement> = vec![5.into(), true.into(), 6e3.into()];

// Validate data based on the type: 'my_int_type'
check_value(&valid_element, &type_ref); // this validation passes as the value satisfies integer type constraint
check_value(&invalid_element, &type_ref); // this returns violation as 'my_int_type' expects an integer value
check_value(&invalid_document_element, &type_ref); // this returns violation as 'my_int_type' expects an integer value


// Verify if the given value is valid and print violation for invalid value
fn check_value<I: Into<IonSchemaElement> + Debug + Clone>(value: I, type_ref: &TypeRef) {
    let validation_result: ValidationResult = type_ref.validate(value.to_owned());
    if let Err(violation) = validation_result {
        println!("{}", value.into());
        println!("{:#?}", violation);
    }
}
```

### Output
When run, the code above produces the following output:
```rust
5e3
Violation {
    constraint: "my_int_type",
    code: TypeConstraintsUnsatisfied,
    message: "value didn't satisfy type constraint(s)",
    violations: [
        Violation {
            constraint: "type_constraint",
            code: TypeMismatched,
            message: "expected type Integer, found Float",
            violations: [],
        },
    ],
}
/* Ion document */ 5 true 6e3 /* end */
Violation {
    constraint: "my_int_type",
    code: TypeConstraintsUnsatisfied,
    message: "value didn't satisfy type constraint(s)",
    violations: [
        Violation {
            constraint: "type_constraint",
            code: TypeMismatched,
            message: "expected type Integer, found document",
            violations: [],
        },
    ],
}
```

