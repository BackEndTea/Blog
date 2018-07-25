---
layout: post
title: Infection 0.9 is out!
tags: php infection tests update
eye_catch: /assets/img/infection-logo.png
permalink: infection-09-release
---

[I wrote about infection a while ago][infection-blog-url], and not too long after that, [0.9.0 was released][infection-release-url]. 
Lets look at the new features, and how we can use them in our projects!
<!--more-->

## Profiles

Previously, if you wanted to run all mutators, except for one, it would involve passing all mutators in the commandline,
except for the one you didn't want, which was tedious. With the addition of profiles this became a whole lot easier.

Here we have a simple configuration file, where we use all mutators, except for the `@function_signature` ones (`PublicVisiblity` & `ProtectedVisibility`).

```json
{
    "timeout": 10,
    "source": {
        "directories": [
            "src"
        ]
    },
    "logs": {
        "text": "infection-log.txt"
    },
    "mutators": {
        "@default": true,
        "@function_signature": false
    }
}
```

Instead of a profile (which always starts with an `@` and is snake_case), you can also disable a single mutator directly.
e.g. `"PublicVisiblity": false`.


## Disabling mutators for specific places.

Besides passing true or false to a mutator in the config, we now have the ability to add specific settings to it.

Lets say we want to disable the `Plus` mutator for the method named `doPlus` in the `Foo\Bar\Baz` class, we can do it like so:

```json
{
    "mutators": {
        "@default": true,
        "Plus": {
            "ignore": [
                "Foo\\Bar\\Baz::doPlus"
            ]
        }
    }
}
```

But what if we want to disable the `Minus` mutator, for all classes in the `Foo\Bar` namespace, and the
`@function_signature` profile for all methods named `noTrue` in the `Foo` namespace?

It can easily be done by adding the following parts to your configuration file.
```json
{
    "mutators": {
        "@default": true,
        "Minus": {
            "ignore": [
                "Foo\\Bar\\**"
            ]
        },
        "@function_signature": {
            "ignore": [
                "Foo\\**::noTrue"
            ]
        }
    }
}
```

**Important:** If you want to (partially) disable certain mutators or profiles, but still run everything else, be sure to add
`"@default": true"` to your config, which enables all the other mutators.


## Mutation Badge

<img style="float:left" src="https://badge.stryker-mutator.io/github.com/infection/infection/master"> <br>

Thanks to the people who made [Stryker][Stryker-url], you can now add a new badge to show off your mutation score.
You can find the instructions right [here][infection-mutation-badge].

## Smarter mutators

This mutation would always result in the following error, making it a useless mutation.

`Fatal error: Access level to B::foo() must be public (as in class A) in /foo/test.php on line 14`

```diff
abstract class A
{
    abstract public function foo();
}

class B extends A
{
-    public function foo()
+    protected function foo()
    {
    }

}
```

Infection now uses reflection to determine if a method has a parent class or an interface that declares the same method.
And it does not mutate the visibility if the method is inherited.
If you use a lot of abstract/parent classes and interfaces this could drastically reduce the amount of mutations you get,
and thus speed up the process by a lot.


## Phar Scoping

Now you may be worried, that autoloading your code, when using a phar could result in a clash while autoloading.
e.g. your project has a dependency on `Symfony/Console`, and the phar does as well, so which one does infection load?
This has been fixed by using [PHP-Scoper][php-scoper-url], which prefixes all namespaces within the phar with a random string, and
makes it so that the code, and autoloading, within the phar can not clash with the code in your project.

For example, your project would use (and thus autoload) the following class `Symfony\Component\Console\Application`.
Now infection also uses this class, but within the phar its called something like: `ScopedRandomgString\Symfony\Component\Console\Application`.
This means that infection has a separate version of the class that it uses.

[PHP-Scoper][php-scoper-url] a really cool project, so if you are interested in it, be sure to check it out.

## New mutators

Not only did mutators get smarter, we also got a whole lot of new mutators:

`Finally_`:

Removes the `finaly` block that is part of a try catch block, e.g.

```diff
try {
    dangerous_function()
}
catch(Exception $e) {
    //handle exception
}
- finally {
-    // Do this no matter what
- }
```

This should help you test your error handling.

`PregQuote`:

Removes `preg_quote` function calls, e.g.

```diff
- $a = preg_quote('value');
+ $a = 'value';
```

This should help you test the usage of `preg_quote` calls, and maybe even show you don't need/use them.

`ArrayItem`& `Yield_`:

Changes the `=>` into `>` for arrays and `yield` respectively,

```diff
[
-    $a->var => $b->var
+    $a->var > $b->var
]
```
 
This should help to test the usages of your arrays and yield statements

`Assignment`:

Changes assignments like `+=`. `-+`, `.=` etc into plain `=`.

```diff
$a = 'title;
- $a .= ' suffix';
+ $a = ' suffix';
```

This should help you test that assignments are done properly.

`For_`:

The `for` counterpart to the `ForEach_` mutator that stops for loops from happening:

```diff
- for($i =0; $i < count($array); $i++)
+ for($i =0; false; $i++)
```

This should help testing that your for loops are actually happening.

## Updating
If you use composer to add infection as a dev dependency, be sure to change
the version restriction in your composer.json to `^0.9.0`, and hit `composer update`. Because in pre `1.0.0` releases
composer won't bump minor versions, as they could have breaking changes.

If you are downloading the par, simply change the current version in the url to `0.9.0` and you should be good.

## In conclusion

Infection 0.9 came with a lot of improvements, especially for (partially) disabling mutators or groups of mutators.
The mutators also got a bit smarter, and hopefully you should see your mutation testing being done a lot quicker.

If you liked this blog post, and/or have questions/tips/whatever, feel free to leave a comment here, or hit me up on
[twitter][my-twitter]

[infection-blog-url]: {% link _posts/2018-06-10-test-your-tests-are-testing.md %}
[infection-release-url]: https://github.com/infection/infection/releases/tag/0.9.0
[Stryker-url]: https://stryker-mutator.io/
[infection-mutation-badge]: https://infection.github.io/guide/mutation-badge.html
[php-scoper-url]: https://github.com/humbug/php-scoper
[my-twitter]: https://twitter.com/BackEndTea
