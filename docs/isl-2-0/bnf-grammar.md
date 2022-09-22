---
title: Ion Schema 2.0 BNF-Style Grammar
---
# {{page.title}}

This grammar is intended as a learning aid and is _not_ authoritative.

Some limitations of this grammar are that it cannot accurately represent open content, that it excludes equivalent encodings of an Ion value (e.g. the symbol `year` could also be `'year'`), that it does not describe a valid ISL regex string, and that it does not describe reserved words that cannot be used as a type name.

{% capture grammar %}{% include grammar-2-0.txt %}{% endcapture %}
<pre class="grammar">
{{ grammar | escape_once }}
</pre>