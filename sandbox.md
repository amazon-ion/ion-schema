---
title: Give Ion Schema a Try!
---

# {{ page.title }}
<script src="./assets/ace-builds/src-noconflict/ace.js" type="text/javascript" charset="utf-8"></script>
<script src="./assets/ace-builds/src-noconflict/mode-ion.js" type="text/javascript" charset="utf-8"></script>

{% include note.html type="note" content="This sandbox uses `ion-schema-rust` (pre-release version) to validate Ion value using given schema" %}

<label for="schema"></label>

Predefined examples: 
<select name="examples" id="examples">
  <!-- These are loaded dynamically in ion-schema-widget.js --/>
</select>

Enter one or more type definitions. No Authority is configured, so imports are not available.
<div id="schema" class="bs-callout bs-callout-primary"></div>

<label for="value"></label>
Enter a single Ion value.

<label class="container"> 
    <input id="document" type="checkbox">
    <span class="checkmark"></span>
Treat the input Ion value as document type that represents a series of top-level values
</label>
<div id="value" class="bs-callout bs-callout-primary"></div>

<label for="schema_type">Validate as </label>
<input type="text" id="schema_type" placeholder="e.g. my_type" name="schema_type" size="15"/>
<button id="validate" type="submit">Go</button>
<button id="share" type="submit" title="Share a link to your schema" style="float: right;"><i class="fa fa-share-square-o" aria-hidden="true"></i></button>

<div id="resultdiv" class="bs-callout bs-callout-default">
<h4 id="result"></h4>
<pre id="violation"></pre>
</div>

<div id="snackbar"></div>

<script async type="module" src="assets/ion-schema-widget.js"></script>
