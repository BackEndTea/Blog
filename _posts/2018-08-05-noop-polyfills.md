---
layout: post
title: Noop polyfills
tags: php extensions polyfills noop
permalink: noop-polyfill
---

A while ago a [reddit post][reddit-post-compat] showed up, where someone installed version `9.99.99` of [paragonie/random_compat][rand-compat].
Seeing a package update from `2.*` to `9.99.99` may be a bit confusing, but given how autolaoding, polyfills and composer work in php, this is
actually quite a clever way of dealing with things. Lets take a look at version constraints, autoloading and composer to see why.
<!--more-->

## Applying a polyfill
The purpose of the polyfill in question is to provide `random_*` functions to php versions below 7.0. As these functions were only
introduced in php 7.0. You can't declare these functions yourself in versions over 7.0, as it has already been declared by php itself.
Resulting in an error like: `Fatal error: Cannot redeclare random_bytes() in /foo.php on line 6`.

The file that gets loaded therefore first checks the php version. In other cases, like polyfilling an extension, it would check
the existence of that function, or if the extension is loaded.

## Autoloading

A composer.json with a section something like this may be familiar.
```json
{
    "autoload": {
        "psr-4": {
            "Acme\\Foo\\": "src/"
        },
        "files": [
            "src/Helpers.php",
            "src/global-functions.php"
        ]
    }
}
```

We use the [psr-4][psr4-fig] standard for autoloading, and we load a few files as well that contain global functions/helpers. I won't go into detail
about psr 4 as that isn't relevant for this blog post. But lets look at how the files are autoloaded by composer.

If we dive into our `vendor/composer/autoload_real.php` we will find something like the following. The class names may differ as they are auto-generated, but
it should generally look like this.

The `$includeFiles` will be all the files that are in the `autoload.files` part of composer.json (as well as the composer.json files from packages you depend on).
We can see that if the file hasn't been required already, its required. This is done as soon as you include/require `vendor/autoload.php`, which is generally
done at the start of every process.

```php
class ComposerAutoloaderInit0e3a5124969d920e9ee3b981a725692a
{
    //...

    public static function getLoader()
    {
       //...

        if ($useStaticLoader) {
            $includeFiles = Composer\Autoload\ComposerStaticInit0e3a5124969d920e9ee3b981a725692a::$files;
        } else {
            $includeFiles = require __DIR__ . '/autoload_files.php';
        }
        foreach ($includeFiles as $fileIdentifier => $file) {
            composerRequire0e3a5124969d920e9ee3b981a725692a($fileIdentifier, $file);
        }

        return $loader;
    }
}

function composerRequire0e3a5124969d920e9ee3b981a725692a($fileIdentifier, $file)
{
    if (empty($GLOBALS['__composer_autoload_files'][$fileIdentifier])) {
        require $file;

        $GLOBALS['__composer_autoload_files'][$fileIdentifier] = true;
    }
}
```

This means that if you have paragonie/random_compat as a dependency, even if its an indirect dependency, you will require its bootstrap file every time.
Which means that ever process starts with a check to see if you have php 7.0 or not.

## Noop versions

This is where the noop version comes in. The version that does 'nothing'. It doesn't populate the autoload, thus the files are never required. It has a
really high version, so that you can require `~1.0||~2.0||~9.99.99`. Composer will always attempt to install the highest possible version of a package.
So if you have php 7.0 or higher, it will install version `9.99.99`, and if you don't it will attempt to install a lower version. This is currently the
best way a package can declare to 'not' be installed if certain criteria are met.

So if you have a package that uses paragonie/random_compat, and you are installable on php 7.0+, update the requirements to `9.99.99`. If you are not
compatible with php below 7.0, and you get paragonie/random_compat from another dependency which doesn't allow `9.99.99` to install, consider adding the
following to your composer. This will completely remove the package from your dependency tree. You shouldn't do this if you are compatible with lower php versions.

```json
{
    "replace": {
        "paragonie/random_compat": "*"
    }
}
```

If you are directly using a symfony polyfill, you may soon also be able to require a version `9.*` that does the same thing, [as it may soon become available][symfony-polyfill-pr].

If you wish to know more about polyfills and extensions, check out my [other blog post about polyfills and exentions][polyfill-blog].

[reddit-post-compat]: https://www.reddit.com/r/PHP/comments/91ffbi/package_in_v99999_is_this_normal/
[rand-compat]: https://github.com/paragonie/random_compat
[psr4-fig]: https://www.php-fig.org/psr/psr-4/
[symfony-polyfill-pr]: https://github.com/symfony/polyfill/pull/138
[polyfill-blog]: {% link _posts/2018-06-12-php-extensions-polyfills.md %}
