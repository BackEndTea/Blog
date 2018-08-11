---
layout: post
title: Add an editorconfig to your project
tags: editorconfig opinion
permalink: add-an-editorconfig
---

One of the hardest things to spot during a pr whitespace issues. Did someone use tabs instead of spaces, trailing whitespace etc.
So, why not make it easy on yourself and help any contributors by adding an `.editorconfig` file that automatcially fixes those things for you.
<!--more-->

An editorconfig is an ini like file that helps your IDE or text editor to keep certain standards. Even this blog, which is written in mostly markdown
has the following editorconfig:

```ini
root = true

[*]
charset=utf-8
end_of_line=lf
trim_trailing_whitespace=true
insert_final_newline=true
indent_style=space
indent_size=4
```
`root=true` means that it is the top level editorconfig. This is usefull if you have certian directories that have a different style for whatever reason.
The charset is set to utf-8, we use 'normal' line endings, and trim all trailing whitespace.
All files have an empty new line at the end, and are indented with 4 spaces.

If i have a `Makefile`, which needs to be indented with tabs i can add the following:

```ini
[Makefile]
indent_style=tab
```
And now my makefile is correctly indented with tabs.

If the project contains `js` and `scss` files that i want indented with 2 spaces i can add the following:

```ini
[*.{js,scss}]
indent_size=2
```

The [editor config website][editor-conf-website] has an explanation on what options there are, and how to specify what files to affect etc.
Some editors check for a `.editorconfig` file by default, while other need a plugin to understand and use them. You can find the full list on their
website as well. (But PHPstorm needs a plugin, so please do install it.)


[editor-conf-website]: https://editorconfig.org/
