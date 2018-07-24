---
layout: post
title: PHP will lose its LTS
tags: php lts 
permalink: php-loses-lts
---

In about [5 months][php-versions] PHP 5.6 loses its security support. Which means that in 5 months, PHP loses its current Long Term Support(LTS) version.
If you don't count security only support as LTS, then PHP hasn't had an LTS for the past 1.5 years. If your website can't handle PHP 7 or higher,
you may start finding it harder to get support for that, with hosting sites like acquia [removing php 5.6 support][acquia-php-5.6]
We will look at the advantages, and disadvantages of LTS, and what it means for the PHP ecosystem.
<!--more-->


## What is LTS

In essence, LTS is exactly what it says it is. A specific version gains longer that usual support. Take Symfony for example. Every release has 8 months of
active, bug fixing, support. After that it has 6 months of security only support, and after that the version has no official support.
The LTS versions (3.4, and 4.4 etc. in the future) have 3 years of bug support, and then 1 more year of security only support. 
Generally, there will also be a clear upgrade path between the latest LTS and the current one.

## Why LTS

Now you may wonder, why would i support a specific version for a long amount of time, when there are newer versions with more features. The reason for that is
simple. If a company uses your framework/package/programming language a lot, every backwards incompatible change could mean a lot of rework to their applications.
But not updating means bugs wont be fixed and security vulnerabilities wont be patched. LTS solves both problems by keeping everything the same, and only fixing bugs
and/or security issues. 

Of course LTS also has downsides. For the maintainers it means that every bug fix or security patch has to be applied to the LTS version first, and then added on top of the 
current version. And then there is still the fixing of any conflicts that could be caused by the bug and the difference between LTS and the current version.

## PHP LTS

Now PHP's LTS is a bit different. Every minor version already has 2 years of bug fix support, and then 1 year of security only support. Which means you *could* already
consider them LTS. Another difference is that PHP does not follow [semantic versioning][semver]. Which in essence means that almost every minor update(e.g. 7.1 ->7.2) 
has one or more backwards incompatible changes. It may also require one to update dependencies that are incompatible with those changes, which could
end up being a lot of work, as it may require updating major versions of those dependencies.

If you asked someone what version your new PHP package should support, a lot of people would have told you to support 5.6. With its LTS ending, soon, 7.0 seems to be all
the new go to lowest version. The funny thing is that 7.0 will lose its security support in 4 months, which is earlier than 5.6. So some opt to make the lowest version 7.1
or 7.2. 

Until PHP gains a new LTS, any **new** package should support the last, or last 2, versions of PHP. Unless you are filling a very specific niche, or need to
stay in line with other packages, supporting 5.6 shouldn't really be done any more. And please don't create new packages for PHP 5.3. Now if you are already
maintaining something, upgrading the minimum PHP versions is a backwards incompatible change, and means you have to bump the major version if you follow
semantic versioning. If a new PHP LTS gets released we should attempt to support that version as a minimum until it gets deprecated.




[php-versions]: https://secure.php.net/supported-versions.php
[acquia-php-5.6]: https://support.acquia.com/hc/en-us/articles/360005518633-PHP-5-6-Retirement-FAQ
[semver]: https://semver.org/