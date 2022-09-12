---
title: Give Ion Schema a Try!
---

# {{ page.title }}
<script src="./assets/ace-builds/src-noconflict/ace.js" type="text/javascript" charset="utf-8"></script>
<div id="sandbox">
      <h4>Note: This sandbox uses `ion-schema-rust`(pre-release version) to validate Ion value using given schema</h4>
      <label for="schema">Ion schema:</label>
      <div id="schema"></div>
      <br>
      <label for="value">Ion input data to be validated:</label>
      <div id="value"></div>
      <br>
      <label for="schema_type">Validate as </label>
      <input type="text" id="schema_type" placeholder="e.g. my_type" name="schema_type" size="15"/>
      <button id="validate" type="submit">Go</button>
      <br>
      <br>
      <h3><pre id="result"></pre></h3>
      <h3><pre id="violation"></pre></h3>
</div>
<script async type="module" src="assets/ion-schema-widget.js"></script>