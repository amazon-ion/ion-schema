---
title: Amazon Ion Schema
permalink: /
---
Amazon Ion Schema defines a grammar and constraints for narrowing the universe of Ion values.  A schema consists of zero or more types, and a type is a collection of zero or more constraints over the Ion data model.  Aspects of a value not constrained by a type ("open content") are considered valid, which enables loosely-coupled systems to evolve independently.

Once defined, a type can be used to: 
* assert that a value meets specific expectations,
* generate developer-friendly APIs for working with data,
* enable efficient analysis over data that conforms to a type,
* and more!

For more information, see the [Ion Schema Specification][1].

<br/>

### Latest News

---
{% for post in site.posts limit:2 %}
  **<a href="{{site.baseurl}}{{post.url}}">{{ post.title }}</a>**<br/>
  *{{post.date | date_to_long_string}}*<br/>
  {{post.content}}
{% endfor %}
---
Visit the [News][2] page for more announcements related to Ion Schema.

<br/>

### Ion Schema Example {#example}
```
type::{
  name: Person,
  type: struct,
  fields: {
    title: {
      type: symbol,
      valid_values: [Mr, Mrs, Miss, Ms, Mx, Dr],
    },
    firstName: { type: string, occurs: required },
    middleName: string,
    lastName: { type: string, occurs: required },
    age: { type: int, valid_values: range::[0, 130] },
  },
}
```

The following values are valid for the type `Person`:
```
{
  firstName: "Susan",
  lastName: "Jones",
}
{
  title: Mr,
  firstName: "Jonah",
  middleName: "Q.",
  lastName: "Smith",
  age: 34,
}
```

The following values are *not* valid for the type `Person`:
```
{
  firstName: "Cathy",        // lastName is required
}
{
  title: Prof,               // Prof is not a valid value for the title field
  firstName: "Jasmine",
  lastName: "Bradford",
}
{
  firstName: "Shami",
  lastName: "Ahmed",
  age: 131,                  // age must be between 0 and 130, inclusive
}
```


<!-- References -->
[1]: docs/spec.html
[2]: news.html
[3]: https://amzn.github.io/ion-docs/

