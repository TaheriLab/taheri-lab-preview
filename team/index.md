---
title: Team
nav:
  order: 3
  tooltip: Meet our team
---

# Team

{% include list.html data="members" component="portrait" filter="role == 'principal-investigator'" %}

{% include section.html %}

## Researchers

{% include list.html data="members" component="portrait" filter="role == 'researcher'" %}

{% include section.html %}

## Postdoctoral researchers

{% include list.html data="members" component="portrait" filter="role == 'postdoc'" %}

{% include section.html %}

## PhD students

{% include list.html data="members" component="portrait" filter="role == 'phd'" %}
