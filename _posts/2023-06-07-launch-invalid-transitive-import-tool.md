---
layout: news_item
title: "🚀 Launch Announcement 🚀 Transitive Import Repair Tool"
date: 2023-06-07
categories: news ion-schema-kotlin
---

The CLI in `ion-schema-kotlin` now includes a command for repairing schemas that rely on the bug that allowed transitive imports.

# What is the problem?

The [Imports section](https://amazon-ion.github.io/ion-schema/docs/isl-1-0/spec#imports) of the Ion Schema 1.0 spec was previously underspecified with respect to how imports should be resolved (see amazon-ion/ion-schema#39).

For example, if Schema A imports all types from Schema B, and Schema B imports something from Schema C, should Schema A also be able to reference the type from Schema C without directly importing it (transitive import resolution), or must Schema A explicitly import Schema C to reference any types declared in Schema C (direct import resolution)?

The original implementation resolved imports transitively, which led to issues when schemas have so-called "diamond" imports (amazon-ion/ion-schema-kotlin#117) or circular imports (amazon-ion/ion-schema-kotlin#58).

Transitively resolved imports can also lead to unexpected type name conflicts when a user is authoring a schema that depends on another schema owned by someone else. If ALL schemas are known at compile time, name conflicts can be detected and fixed early, before the schemas are deployed to production. When some schemas are authored at runtime or by users of the application, name conflicts can present an availability risk.

Suppose we have Schemas A through Z, each of which imports the next schema in alphabetical order. If imports are resolved transitively, then even if Schema A does not rely on any types from Schema Z, a change to Schema Z could result in a name conflict with a type that is declared in Schema A, thus rendering Schema A unusable. If imports are not transitive, then Schema A is only affected by changes in Schema B. Direct-import-only resolution does not _entirely_ remove the potential for name conflicts, but it significantly reduces the number of possible schemas that can contribute to a naming conflict within a graph of interdependent schemas.

If you want to entirely eliminate the possibility of a name conflict, you can do so by always importing specific types by name (or by importing nothing at all).

# What are we doing about it?

The Ion Schema 1.0 specification has been clarified to say that only top-level, declared types may be imported from another schema.

Ion Schema Kotlin is being fixed so that the resolution of type references will only take into account the direct imports of a schema. This will be a breaking change for some users of Ion Schema, so the fix is being released in two phases.

The bug fix was released in `ion-schema-kotlin-1.2.0` as an optional behavior. Customers will have to explicitly opt in by setting the `allowTransitiveImports(false)` builder option.

In `ion-schema-kotlin-2.0.0`, the bug fix will become the default behavior.

In addition, the `ion-schema-kotlin` repo has a CLI tool to help you fix any affected schemas.

# How can I tell if I am affected by this change?

It _does_ affect you if you have created any schemas that (intentionally or unintentionally) use a “transitive” import, or if you vend schemas to other teams who have created their own schemas that have used a “transitive” import.

...but we don’t necessarily expect teams to know whether they have done this, so we have a few ways for you to find out.

#### Method 1

Here is a rubric that can help.

* If you don’t use any imports to create dependencies between schemas, then this bug **_does not_** affect you. E.g.

```

schema_header::{ 
  imports: [          
    { id: "birds.isl" },                    // <-- you have none of these          
    { id: "cats.isl", type: lion },           // <-- or these          
    { id: "cats.isl", type: cougar, as: puma }, // <-- or these          
  ]
}

type::{ 
  name: poodle_list,
  type: list, 
  element: { id: "dogs.isl", type: poodle }  // <-- and you have no inline 
                                             //     imports, like this one
}

```

* If the dependency tree of your schemas is never more than 2 levels deep (i.e. root and one layer of imports) then this bug **_does not_** affect you.
* If you have any schema that contains _only_ import statements (i.e. because it is a schema to aggregate other schemas), then this **_does_** affect you.

```
// A schema such as this one 
schema_header::{ 
  imports:[  
    { id: "cats.isl" },  
    { id: "dogs.isl" },  
    { id: "birds.isl" },  
  ] 
} 
// Note—there are intentionally no types between the header and the footer 
schema_footer::{}
```

* Otherwise, this bug **_might_** affect you.

#### Method 2

Use the CLI command (mentioned below) to attempt to repair your schemas.
If you run the rewriter tool and the diff of non-whitespace changes between any of your existing schemas and the corresponding rewritten schemas is non-empty, then it _probably does_ affect you.
(There are some cases where the tool might reorganize some imports resulting in a diff, but the semantics of the schema are unchanged.)
If you run the rewriter tool on every schema that your application could use (i.e. the universe of all possible schemas that can be loaded by the Authorities you are using, which is only finite if you are the author of all of your schemas), and the diff between the old and new schemas is empty (or only whitespace), then the bug/bugfix **_does not_** affect you.

#### Method 3

Provide a logging callback for the Ion Schema System. Wait a while, and check your application’s logs. If you have any warning messages about transitive imports, then it **_does_** affect you. If there are no warning messages, it **_might_** affect you.

Here are examples of how you can configure a callback function to receive the warning messages using [`withWarningMessageCallback`](https://github.com/amzn/ion-schema-kotlin/blob/master/src/com/amazon/ionschema/IonSchemaSystemBuilder.kt#L124,L162).

**Kotlin**

```kotlin
val iss = IonSchemaSystemBuilder.standard()
    .withWarningMessageCallback { println(it) } 
    // Configure Authorities, etc. as usual 
    .build()
```

**Java**

```java
IonSchemaSystem iss = IonSchemaSystemBuilder.standard()
    // Use a lambda function...
    .withWarningMessageCallback(it -> { System.out.println(it); }) 
    // ... or a method reference
    .withWarningMessageCallback((Consumer<String>) System.out::println) 
    // Configure Authorities, etc. as usual 
    .build()
```

In most applications, you should substitute your own logging framework or metrics recorder instead of printing to `stdout`.


# How do I fix my schemas?

Check out the `ion-schema-kotlin` GitHub repository, and use the bundled CLI to update your schemas.

```shell
git clone --recursive https://github.com/amazon-ion/ion-schema-kotlin.git
cd ion-schema-kotlin
./ion-schema-cli repair fix-transitive-imports --help
```

Follow the instructions in the command help to fix your schemas. In most cases, the default options will suffice, and you can simply run:

```shell
./ion-schema-cli repair fix-transitive-imports <PATH_TO_AUTHORITY_ROOT_DIRECTORY>
```


# FAQ

### What about schemas that only aggregate types from other schemas?

E.g.
```
schema_header::{
  imports: [      
    { id: "common.isl" },      
    { id: "api_1.isl" },      
    { id: "api_2.isl" },      
    { id: "api_3.isl" },      
  ]
}
schema_footer::{}
```

The use case is valid, but this implementation is no longer valid because it relied on the buggy behavior.

Instead, you must explicitly declare types in your schema to “re-export” them.

E.g.
```
type::{ name: foo, type: { id: "common.isl", type: foo } } 
type::{ name: api_1_type, type: { id: "api_1.isl", type: api_1_type } }
type::{ name: an_alias_for_api_1_type, type: { id: "api_1.isl", type: api_1_type } }
// etc.
``` 

The schema fixer/rewriter tool will know how to handle this sort of schema, and can expand the imports into type definitions for you.

### How do customers upgrade when mixing schemas authored by multiple teams?

Who needs to upgrade their schemas first?

* If the consumer only consumes types by importing them from an aggregating schema, the vendor and consumer can safely update their schemas in any order.
* If the only necessary changes by the vending team are rewrites of aggregating schemas (i.e. schema has imports but not types), the vending team can do this either before or after the consumer schemas are updated.
* If vending schemas as an artifact in some package manager, the vending team can run the rewriter tool and save the results in a new version of the package distribution. Then consuming teams can pick up that new version at their convenience.
* If none of the above options are possible, consumers must update schemas first, then vendors can update their schemas, then everyone can update their schema systems.
* Consumers cannot update their schema systems to the new behavior until the vended schemas have been fixed (or are known to be good).
* Cyclical cross-team dependencies could cause a problem where all the schemas need to be updated at the same time. As long as schemas are version-controlled this should still be reasonably straightforward. Feel free to open an issue if you need help in this situation.

### I enabled the bug fix and now my application is broken. What do I do?

Don’t panic! This is mostly harmless. As soon as you roll back your changes, you should be fine.

If you cannot roll back your entire deployment because of some other change that cannot be reverted, and you have confirmed that the problem is because you have picked up the bugfix before you were ready for it, you can use the `allowTransitiveImports(true)` builder option to disable the bugfix.

Once you have mitigated the immediate impact to your application, refer back to this page to determine what went wrong. If you are still unable to resolve your issue, create an issue to let us know.

### If I run the schema rewriter tool, can I still load those schemas with an old version of Ion Schema Kotlin?

Yes. This bugfix does not introduce any new Ion Schema language features—it only removes the use of an edge case that was previously underspecified in the spec.

### Will `ion-schema-rust` have an option to allow transitive imports?

There will be no support allow transitive imports in `ion-schema-rust`.

### Does Ion Schema 2.0 allow transitive imports?

No. Ion Schema 2.0 does not allow transitive imports and has never been affected by this bug.
