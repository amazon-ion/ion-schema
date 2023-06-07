---
title: News
---

# {{ page.title }}

{% for post in site.posts %}
  <hr/>
  **<a href="{{site.baseurl}}{{post.url}}">{{ post.title }}</a>**<br/>
  _{{post.date | date_to_long_string}}_<br/>
  {{post.excerpt}}
  <a href="{{site.baseurl}}{{post.url}}">Read more</a>
{% endfor %}
<hr/>
