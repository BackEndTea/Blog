---
layout: post
title: PHP extensions, polyfills and you
tags: php extensions polyfills
eye_catch: /assets/img/php-logo.png
permalink: extension-polyfill
---

A little while ago someone ran into an error with a dependency of a project i worked on.
A fatal error, which seemingly only occurred for them: the `ctype_alnum` function was not defined.

So it turned out the `ctype` functions aren't part of the php core, but are instead a 'default' extension.
Lets explore what extensions mean for your project, and how to help your users with these kinds of errors.
<!--more-->

## Extensions
You may have seen something like this in a `composer.json`:

```json
"require": {
  "ext-intl": "*"
}
```

This means the project needs the `intl` php extension in order to work. If you don't have it installed, composer will not install the packages, and 
tell you it is missing an extension it needs to function.
Generally, installing a package is as easy as `sudo apt-get install php-intl`, and restart your web server if needed. A lot of deploy/build environments will 
automatically install the needed extensions, so no need to worry about that.

Even running composer already requires the simple-xml extension, so its not like you can run php without any extensions.
A lot of packages require extensions without making it explicit like this, which is a shame.
Getting an error when running `composer install` that mentions an extension being needed is a lot more informative than seeing the following error
when running your program.
```
Fatal error: Uncaught Error: Call to undefined function Composer\XdebugHandler\ctype_alnum() in $dataRec->vendor/composer/xdebug-handler/src/XdebugHandler.php on line 437
```

A closer look at the [ctype documentation](https://secure.php.net/manual/en/ctype.installation.php) reveals that from php 4.2 and onward, it is enabled by default.
Meaning you would have to pass the `--disable-ctype` flag when compiling php to disable it. However, certain php distributions don't include it, as they did in fact
pass that flag while compiling, some examples being FreeBSD and Alpine. So relying on the fact that it is enabled by 'default' is not really an option.

There are [a lot](https://secure.php.net/manual/en/extensions.membership.php) of extensions available. Some are part of the 'core' meaning you can't disable them,
others are 'default', meaning a 'normal' php installation *should* have it, but as mentioned early, we can't rely on that.
Some need to be installed by hand, and some even need a whole lot of configuration.
So before you start requiring extensions left and right, it may be a good idea to check how much strain it will put on your users.

## Polyfills

A way to avoid a direct dependency on (some) extensions is using a [polyfill](https://github.com/symfony/polyfill).
Symfony provides quite a few, but there are others as well. So instead of requiring the ctype extension, we can require its polyfill.
Composer can install that itself, so no error for the user, and if the user doesn't have the extension available it will be 'suggested' by composer.
Of course, this suggestion is buried by dozens of other suggestions that other packages make.

The one down side of using a polyfill is that it is generally slower. However, if you don't have control over your production server, these polyfills mean you can still use the functionality they provide.

## And you

So, what can you do with this information?

If you have an application for which performance is absolutely critical, consider checking what polyfills you are actually using, and what extensions are
available on your production server. Even if you don't use `ctype` or `intl` or another extension directly, your dependencies may use them, so getting the
'real' extension could give you a performance boost. This boost will be absolutely minimal, unless you use these functions a ton.

If you maintain an (open source) package, take a closer look at your code base, 
what extensions are you actually using, and are they presented in your `composer.json` ?
The one line that says `"ext-intl": "*"` can save someone hours of debugging. Even when dealing with a 'default' extension, like `ctype`,
it can an will be disabled on certain systems. If there is a polyfill available for that extension, you can also choose to require a polyfill instead.

You can also choose to work around any extensions that aren't part of the core, but why would you? I'm not saying you should require every possible
extension. Especially ones that are harder to install for your users, but most extensions should have better performance than the php implementation you
could write yourself. But anything is better than requiring an extensions in your code, but not reflecting that in your `composer.json`
