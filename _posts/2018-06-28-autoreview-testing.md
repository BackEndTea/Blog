---
layout: post
title: Automated code reviews
tags: php tests open-source code-review
permalink: auto-review-testing
---

Sometimes a code base has specific code style rules, that aren't easy to detect with either with a style fixer or a static analyzer.
So instead of having to tell every new contributor your rules during a PR, or lay them all out in your CONTRIBUTING.md,
why not automatically check them with PHPUnit.
We will look at a couple of different 'rules' your code base could have, and how to set up the automated tests.
<!--more-->

The goal of these tests is not to replace code reviews. Instead it allows your code review to focus on the actual code, rather than
having to read through a PR to check if classes are final, or if they don't expose public properties.
It allows you to focus on those important things, like what the code is doing, and how it is doing it.
It won't replace static analyzers either, as the goal of these tests is to automate those little, usually opinionated things, that are
hard to put into a single 'rule' for static analysis, but instead differ greatly from project to project.


We will go through writing tests for the following cases:
* Source classes must have no public properties
* Source classes must be final
* Source classes must have a corresponding unit test

Hopefully this should get your familiar with how to write these tests.

But before we do that, we have to gather a list of all our classes for which we can use

## Getting the classes

To get our source classes, we use the `symfony/finder` component, and we write two methods, assuming our project uses psr-4.

```php
//ProjectCodeTest.php

public function providesSourceClasses(): array
{
    return array_map(
        static function ($item) {
             return [$item];
         },
        $this->getSrcClasses()
    );
}

private function getSrcClasses(): array
{
    static $classes;

    if (null !== $classes) {
        return $classes;
    }

    $finder = Finder::create()
        ->files()
        ->name('*.php')
        ->in(__DIR__ . '/../../src')
        ->notName('helpers.php')
    ;

    $classes = array_map(
        static function (SplFileInfo $file) {
            return sprintf(
                '%s\\%s%s%s',
                'VendorNamespace',
                strtr($file->getRelativePath(), DIRECTORY_SEPARATOR, '\\'),
                $file->getRelativePath() ? '\\' : '',
                $file->getBasename('.' . $file->getExtension())
            );
        },
        iterator_to_array($finder, false)
    );

    sort($classes);

    return $classes;
}
```

The `providesSourceClasses` is our dataProvider, that we use on all our tests. Lets take a look at the `getSrcClasses` method and see what it does.

```php
static $classes;

if (null !== $classes) {
    return $classes;
}
//...
```

The variable we will assign the list of classes to is `$classes`. By using a static variable, we can cache it within the method, so the next time we don't have to iterate over the file system again, and simply return our cached list.

```php
//...
$finder = Finder::create()
    ->files()
    ->name('*.php')
    ->in(__DIR__ . '/../../src')
    ->notName('helpers.php')
;
//...
```

We create a finder object that gets us all files ending in `.php` in the src directory (your indentation level may be different), except for `helpers.php`.
In this scenario we exclude the `helpers.php` file as it is a file with functions, and not a class.

```php
//...
$classes = array_map(
    static function (SplFileInfo $file) {
        return sprintf(
            '%s\\%s%s%s',
            'VendorNamespace',
            strtr($file->getRelativePath(), DIRECTORY_SEPARATOR, '\\'),
            $file->getRelativePath() ? '\\' : '',
            $file->getBasename('.' . $file->getExtension())
        );
    },
    iterator_to_array($finder, false)
);

sort($classes);

return $classes;
```

We use [array_map](https://secure.php.net/manual/en/function.array-map.php) to loop over all the files found by our finder, which are `SplFileInfo` objects,
and replace change those into a Fully Qualified Name(FQN) strings of our classes. The `VendorNamespace` is the namespace you use before everything else. If the autoload in composer.json looks like this, you would replace it with `Acme\\Foo`.
```json
"autoload": {
    "psr-4": {
        "Acme\\Foo": "src/"
    }
},
```
We then append the relative path, starting in the src folder, and replace our directory separators with a `\`, to turn it into its namespace.
If the relative path is empty, its directly in the src folder, we do not add another `\` since its already after the vendor namespace, otherwise,
we add a new `\`, and then finally we append the name of the file, without its suffix. Which should turn into our class name.

The [iterator_to_array](https://secure.php.net/manual/en/function.iterator-to-array.php) is used as `array_map` doesn't accept generators.
We then sort it and return it to our provider.

Our provider wraps it into an array to make sure it can be used by our PHPUnit tests.

Now, the final step before we can finally write those tests to check our code style, is to make sure this provider is valid. We may have another file
that doesn't contain a class that gets picked up by our finder, or someone may add one later and run into strange errors.

```php
/**
 * @dataProvider providesSourceClasses
 *
 * @param string $className
 */
public function test_src_class_provider_is_valid(string $className)
{
    $this->assertTrue(
        class_exists($className) || interface_exists($className) || trait_exists($className),
        sprintf(
            'The "%s" class was picked up by the source files finder, but it is not a class, interface or trait. ' .
            'Please check for typos in the class name. Or exclude the file if in the ProjectCodeTest if it is not a class.',
            $className
        )
    );
}
```

This simply checks if the provided class name is either a class, interface or trait. And then gives a **descriptive** failure message to the user.

## Error Messages

As seen in the example above, half of the method is the error message. Since we want these tests to help our uses adhere to our standards, it should be
clear why the test is failing. Simply seeing `Failed asserting that false is true.` doesn't help our users at all.

And for what its worth, descriptive test failure messages are always a good idea, as it helps you figure out why a test is suddenly failing.


## The rules

**Source classes must have no public properties**

```php
/**
 * @dataProvider providesSourceClasses
 *
 * @param string $className
 */
public function test_src_classes_do_not_expose_public_properties(string $className)
{
    $rc = new \ReflectionClass($className);

    $properties = $rc->getProperties(\ReflectionProperty::IS_PUBLIC);

    $properties = array_filter($properties, function (\ReflectionProperty $property) use ($className) {
        return $property->class === $className;
    });

    $this->assertCount(
        0,
        $properties,
        sprintf(
            'Class "%s" should not declare public properties, ' .
            "if it has properties that need to be accessed, consider getters and/or setters instead. \nViolations:\n%s",
            $className,
            implode("\n", array_map(static function ($item) {
                return " * ${item}";
            }, $properties))
        )
    );
}
```

Lets go through the code again, and see what it does.

```php
$rc = new \ReflectionClass($className);

$properties = $rc->getProperties(\ReflectionProperty::IS_PUBLIC);

$properties = array_filter($properties, function (\ReflectionProperty $property) use ($className) {
    return $property->class === $className;
});
```

We create a [ReflectionClass](https://secure.php.net/manual/en/class.reflectionclass.php) of our class, and get all public properties.

We then filter this down to only the properties of the current class, by removing any properties that belong to parent classes.
This makes sure that we don't get a lot of errors if a parent class has a public property, or if we extend from a class outside our code base that has public properties.

Of course there might be edge cases, where you want to have public properties.
For example, if you create your own [stream wrapper](https://secure.php.net/manual/en/class.streamwrapper.php), you need a public property named `context`.
So if you have a stream wrapper named `StreamWrapperClass`, you can add the following snippet before the assertion.

```php
if ($className === StreamWrapperClass::class) {
    // The StreamWrapperClass needs 1 public property: $context
    // @see https://secure.php.net/manual/en/class.streamwrapper.php
    $this->assertCount(
        1,
        $properties,
        sprintf(
            'The "%s" class must have exactly 1 public property as it is a streamwrapper. ' .
            'If this has changed due to recent php developments, consider updating this test.',
            $className
        )
    );
    $this->assertSame(
        'context',
        $properties[0]->getName(),
        sprintf(
            'The "%s" class must have exactly 1 public property named context. ' .
            'If this has changed due to recent php developments, consider updating this test.',
            $className
        )
    );

    return;
}
```

Once again, we use a descriptive message to explain to our user what is going on. We use a return statement, as we do not want to run the rest of the method,
and its generally considered cleaner than an `else` statement.

**Source classes must be final**

Lets assume we want to make all our classes final (except for a few, but we'll get back to that). This is useful when you are writing a library and don't want
users to extend your classes.

Reflection classes have a method named `isFinal`, but we may have abstract classes, traits and interface, which can not be final, so that won't be enough.
To get around this we write a provider that gives us only the 'concrete' classes.

```php

public function provideConcreteSourceClasses(): array
{
    return array_map(
        static function ($item) {
            return [$item];
        },
        $this->getConcreteSrcClasses()
    );
}

private function getConcreteSrcClasses(): array
{
    return array_filter($this->getSrcClasses(),
        function ($class) {
            $rc = new \ReflectionClass($class);

            return !$rc->isInterface() && !$rc->isAbstract() && !$rc->isTrait();
        }
    );
}
```

We filter out all classes that are interfaces, abstract or traits, leaving us with just the concrete classes. And create the following test, to make sure new classes are final.

```php
/**
 * @dataProvider provideConcreteSourceClasses
 *
 * @param string $className
 */
public function test_all_classes_are_final(string $className)
{
    $rc = new \ReflectionClass($className);

    $this->assertTrue(
        $rc->isFinal(),
        sprintf('Source class "%s" should final.', $className)
    );
}
```

But what if we have classes that we want users to extend some of our non abstract classes? Lets create a filter for that.

```php
 /**
 * This array contains all classes that are extension points.
 *
 * @var string[]
 */
private static $extensionPoints = [
    ExtenableClass::class,
    OtherExtendableClass::class,
];

/**
 * @dataProvider provideConcreteSourceClasses
 *
 * @param string $className
 */
public function test_all_classes_are_final(string $className)
{
    $rc = new \ReflectionClass($className);

    if (in_array($className, self::$extensionPoints)) {
        $this->addToAssertionCount(1);

        return;
    }

    $this->assertTrue(
        $rc->isFinal(),
        sprintf('Source class "%s" should final.', $className)
    );
}
```

But of course, it doesn't end here, we now also want to check if the list of extension points is still valid

```php
 /**
 * @dataProvider provideExtensionPoints
  *
  * @param string $className
  */
public function test_non_final_non_extension_list_is_valid(string $className)
{
    $rc = new \ReflectionClass($className);

    $this->assertTrue(
        !$rc->isFinal(),
        sprintf(
            'Source class "%s" an extension point and should not be made final.',
            $className
        )
    );
}

public function provideExtensionPoints(): array
{
    return array_map(
        static function ($item) {
            return [$item];
        },
        self::$extensionPoints
    );
}
```

These two tests now make sure that all our classes are final, except for a specific list, and we also make sure that the list is still valid.

**Source classes must have unit tests**

Now this is a funny one, as you are testing if your code has tests. This also makes it easy to spot if a big PR is missing unit tests for certain classes.

The following method will check if all source classes have corresponding unit tests, except those that are in a 'legacy' list
```php
/**
 * This array contains all classes that are not yet unit tested due to legacy reasons.
 * This list should never be added to, only removed from.
 *
 * @var string[]
 */
private static $nonTestedConcreteClasses = [
    NotTestedClass::class,
    OtherClassWithoutTests::class,
];
/**
 * @dataProvider provideConcreteSourceClasses
 *
 * @param string $className
 */
public function test_all_concrete_classes_have_tests(string $className)
{
    $testClass = preg_replace('/VendorNamespace/', 'VendorNamespace\\Test', $className, 1) . 'Test';

    if (\in_array($className, self::$nonTestedConcreteClasses)) {
        $this->assertFalse(class_exists($testClass),
            sprintf(
                'Class "%s" has a corresponding unit test "%s", and can be removed from the non tested class list',
                $className,
                $testClass
            )
        );

        $this->markTestSkipped(sprintf(
            'Class "%s" does not have a corresponding unit test yet, you can improve this by adding one',
            $className
        ));
    }

    $this->assertTrue(class_exists($testClass),
        sprintf(
            'Class "%s" doesn\'t not have a corresponding unit test "%s", please add one',
            $className,
            $testClass
        )
    );
}
```

We use the dataprovider we created when making sure all classes are final, as we don't usually have unit tests for interfaces or abstract classes.

Lets walk through the method and see what every part does, starting with the `preg_replace`.

```php
$testClass = preg_replace('/VendorNamespace/', 'VendorNamespace\\Test', $className, 1) . 'Test';
```

Here, `VendorNamespace` is once again the 'default' namespace, as mentioned in [Getting the classes](#getting-the-classes).
We manipulate the FQN we got to change `VendorNamespace` into `VendorNamespace\\Test`, and then append Test to it. For a lot of projects, this is how
tests are named, simply the same class name, but with Test appended to it.
We use `preg_replace`, with a `1` as the 3rd parameter, to make sure we only do this once, on the first occurrence.
As your `VendorNamespace` may appear elsewhere within the namespace.

```php
if (\in_array($className, self::$nonTestedConcreteClasses)) {
    $this->assertFalse(class_exists($testClass),
        sprintf(
            'Class "%s" has a corresponding unit test "%s", and can be removed from the non tested class list',
            $className,
            $testClass
        )
    );

    $this->markTestSkipped(sprintf(
        'Class "%s" does not have a corresponding unit test yet, you can improve this by adding one',
        $className
    ));
}
```
First we make sure that our list of not tested classes is still valid, by making asserting they are not tested, and otherwise notifying the user to
update the list.

Next up, we mark the test as skipped. If you add `verbose="true"` to your `phpunit.xml`, or run it with the `--verbose` flag,
all skipped tests will show their message. Meaning you will see exactly what source classes do not have unit tests every time you run those tests.
This will make sure you always have your technical debt in sights.

```php
$this->assertTrue(class_exists($testClass),
     sprintf(
        'Class "%s" doesn\'t not have a corresponding unit test "%s", please add one',
        $className,
        $testClass
    )
);
```

And to end it, we make sure that our classes in fact do have the unit test.

## What's next

First off, i would highly recommend checking out the
[AutoReview tests from PHP-CS-FIXER](https://github.com/FriendsOfPHP/PHP-CS-Fixer/tree/aabbbc2021e2222f1d49435bc8f4e3467d08c31a/tests/AutoReview),
where these tests originated. They were originally created by Dariusz Rumiński (keradus), who you should check out on [github](https://github.com/keradus).
By now
[other](https://github.com/opencfp/opencfp/blob/e45b1f263e429ea3a85f8bbdf7e4a8932e153aec/tests/Unit/ProjectCodeTest.php)
[projects](https://github.com/infection/infection/tree/cdd179bfd1c6d895a2559667ca8030d12a2feeb9/tests/AutoReview) use these new types of tests as well.

For these checks, the options are almost endless, by using reflection, juggling some name spaces, and other methods, a lot can be
tested before a PR has even been made. You could
[test classes don't have public methods not coming from an interface](https://github.com/FriendsOfPHP/PHP-CS-Fixer/blob/aabbbc2021e2222f1d49435bc8f4e3467d08c31a/tests/AutoReview/ProjectCodeTest.php#L89),
or make sure files like `.travis.yml` and `appveyor.yml`
[contain valid yaml](https://github.com/infection/infection/blob/cdd179bfd1c6d895a2559667ca8030d12a2feeb9/tests/AutoReview/BuildConfigYmlTest.php).
You can even check if [the readme is up to date](https://github.com/webmozart/assert/pull/75).


The most important part is that your error messages inform users why a test is suddenly failing, and what they can do to fix it,
like adding another unit test, or making a property protected or private. And make sure that you cache what results you can when you run
multiple tests against the same data set.

And last but not least, add an extra test set to make sure that your providers are valid. There
are a lot of edge cases, so making sure that your lists of exceptions to the rules etc are valid,
and that your providers/exception lists are valid helps a long way to reduce harder to debug error messages.

So go out there, and make your life a little bit easier by automating (part of) your code reviews!
