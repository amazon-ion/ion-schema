<!--
Arguments:
productions: a comma separated list of production names. E.g. "TIMESTAMP_PRECISION,TIMESTAMP_PRECISION_VALUE"

TODO: When introducing ISL 2.1, make this accept an argument containing the ISL version number.
-->
{% assign productions = include.productions | upcase | split: "," %}
{% capture grammar %}
{% include grammar-2-0.txt %}
{% endcapture %}
{% assign grammar_lines = grammar | escape_once | newline_to_br | split: '<br />' %}

<div class="bs-callout bs-callout-grammar">
<pre>
{%- for production in productions -%}
  {%- assign is_in_production = false -%}
  {%- assign production_start = "&lt;PRODUCTION> ::=" | escape_once | replace: "PRODUCTION", production -%}
  {%- for grammar_line in grammar_lines -%}
    {%- assign grammar_line_stripped = grammar_line | strip -%}
    {%- if grammar_line contains production_start -%}{%- assign is_in_production = true -%}{%- endif -%}
    {%- if is_in_production -%}{{- grammar_line | escape_once -}}{%- endif -%}
    {%- if is_in_production and grammar_line_stripped == "" -%}{%- break -%}{%- endif -%}    
  {%- endfor -%}
{%- endfor -%}
</pre>
</div>
