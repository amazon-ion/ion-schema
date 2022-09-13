<!--
Creates a folding callout box, styled for an example.

Arguments:
title       -- The text that will be shown while the box is collapsed.
code        -- A string containing example code to display in the expanded example callout.
code_file   -- A file containing example code to display in the expanded example callout.
lang        -- the code block language to use for highlighting. Default is none. Only needed if `code` or `code_file`
markdown    -- A markdown blob to display in the expanded example callout.

Only one of `code`, `code_file`, or `markdown` should be used.
-->
{% capture content %}
{%- if include.markdown -%}{{include.markdown}}
{% elsif include.code_file %}
```{{ include.lang | default: "" }}
{% include {{ include.code_file }} %}
```
{% else %}
```{{ include.lang | default: "" }}
{{ include.code | strip }}
```
{% endif %}
{%- endcapture -%}
{::options parse_block_html="true" /}
<div markdown="1" class="bs-callout bs-callout-example">
<details>

<summary markdown="span">**Example: {{ include.title }}**</summary>

{{ content }}

</details>
</div>
{::options parse_block_html="false" /}