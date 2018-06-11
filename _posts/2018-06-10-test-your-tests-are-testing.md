---
layout: post
title: Tests your tests are testing
tags: tests mutation-testing infection
eye_catch: /assets/img/infection-logo.png
---

Are your tests testing? Are you assertions asserting?

Let's find out how we can test that our tests are testing, with the mutation testing framework: [infection](https://github.com/infection/infection).


<!--more-->
Imagine this, you spend the last few hour refactoring a big part of the code base. You made some big changes and a lot of logic has been completely changed.
Now it's time to figure out what tests have broken due to all the refactoring. 
You open up the terminal and enter the good old `vendor/bin/phpunit` and watch the tests run.

<pre>$ vendor/bin/phpunit
PHPUnit 6.5.5 by Sebastian Bergmann and contributors.

Runtime:       PHP 7.1.18
Configuration: /home/me/Projects/Important-Project/phpunit.xml

............................................................  60 / 108 ( 55%)
................................................             108 / 108 (100%)

Time: 24 ms, Memory: 4.00MB

<span style="background-color:#859900"><font color="#073642">OK (108 tests, 187 assertions)</font></span>
</pre>


That doesn't look right, at least a few tests should have been broken by those changes. Some exceptions are no longer being thrown, return types have changed
yet, your tests don't care. According to them everything is still just as it was.

Thankfully, we have access to mutation testing, which will help you make sure that your tests are in fact, testing.

## What is mutation testing

Have you ever created a unit test, and then changed something in your code to see if it failed? Well mutation testing is exactly that, but automated.

Let's say you have the following class you are testing

```php
class Calculator 
{
    public function adds(int $a, int $b): int
    {
	    return $a + $b;
    }

    public function subtracts(int $a, int $b): int
    {
	    return $a + $b;
    }
}
```

And the following test to make sure it works

```php
class CalculatorTest extends TestCase
{
    public function test_adds()
    {
        $calc = new Calculator();
        $this->assertTrue(is_int($calc->adds(1,2)));
    }

    public function test_subtracts()
    {
        $calc = new Calculator();
        $this->assertTrue(is_int($calc->subtracts(1,2)));
    }
}
```

We have 100% coverage, tests are green, so everything works as intended, right?

Of course, the `subtracts` method has a bug, instead of a `-` there is a `+`. A simple copy paste error, but our tests aren't catching it.

So, how do we make sure our tests will catch those bugs? Through mutation testing. 
PHP has the mutation testing framework Infection, which is what we will be using for the example. 


Let's look at the interesting parts of the output:
<pre>
<b>4</b> mutations were generated:
<b>       2</b> mutants were killed
<b>       0</b> mutants were not covered by tests
<b>       2</b> covered mutants were not detected
<b>       0</b> errors were encountered
<b>       0</b> time outs were encountered

Metrics:
         Mutation Score Indicator (MSI): <font color="#B58900"><b>50%</b></font>
         Mutation Code Coverage: <font color="#859900"><b>100%</b></font>
         Covered Code MSI: <font color="#B58900"><b>50%</b></font>
</pre>

Four mutations were created, but only two were killed, while the other two escaped. Lets look at `infection-log.txt` to see what has happened:

```diff
Escaped mutants:
================

1) /home/gpagter/Projects/Randoms/calculator/src/Calculator.php:8    [M] Plus

--- Original
+++ New
@@ @@
 {
     public function adds(int $a, int $b) : int
     {
-        return $a + $b;
+        return $a - $b;
     }
     public function subtracts(int $a, int $b) : int
     {


2) /home/gpagter/Projects/Randoms/calculator/src/Calculator.php:13    [M] Plus

--- Original
+++ New
@@ @@
     }
     public function subtracts(int $a, int $b) : int
     {
-        return $a + $b;
+        return $a - $b;
     }
 }


Killed mutants:
===============

1) /home/gpagter/Projects/Randoms/calculator/src/Calculator.php:6    [M] PublicVisibility

--- Original
+++ New
@@ @@
 
 class Calculator
 {
-    public function adds(int $a, int $b) : int
+    protected function adds(int $a, int $b) : int
     {
         return $a + $b;
     }


2) /home/gpagter/Projects/Randoms/calculator/src/Calculator.php:11    [M] PublicVisibility

--- Original
+++ New
@@ @@
     {
         return $a + $b;
     }
-    public function subtracts(int $a, int $b) : int
+    protected function subtracts(int $a, int $b) : int
     {
         return $a + $b;
     }
 }

```

Let's dissect what has happened, and see what it means for us.

When looking at the Killed mutants, we see two mutants, both `PublicVisibility`. What infection has done for these methods, is change their signature from public to protected.
And then it ran all tests that are relevant for that line of code. The tests then failed, which means that the mutation was 'killed'. Our tests detected this change in the code.

But what about the two 'escaped' mutants? Our tests did not pick up on this change. 
When the `+` got changed to a `-`, our tests did not fail, all assertions were okay. This means that the mutant has 'escaped'. The tests did not pick up on the
fact that our code changed.

If a test took too long, or caused a PHP error, it is also considered killed. The last option are mutants that are not covered by tests. Infection still takes these into account for [metrics](#metrics). 

Lets go ahead and update our tests to kill these mutants.

```php
class CalculatorTest extends TestCase
{
    public function test_adds()
    {
        $calc = new Calculator();
        $result = $calc->adds(1,2);
        $this->assertTrue(is_int($result));
        $this->assertSame(3, $result);
    }

    public function test_subtracts()
    {
        $calc = new Calculator();
        $result = $calc->subtracts(1,2);
        $this->assertTrue(is_int($result));
        $this->assertSame(-1, $result);
    }
}
```

Now we find that our `subtracts` method is actually returning 3 instead of -1. So we fix the bug, and run our tests again. They all pass, so lets run infection again as well.

<pre>
<b>4</b> mutations were generated:
<b>       4</b> mutants were killed
<b>       0</b> mutants were not covered by tests
<b>       0</b> covered mutants were not detected
<b>       0</b> errors were encountered
<b>       0</b> time outs were encountered

Metrics:
         Mutation Score Indicator (MSI): <font color="#859900"><b>100%</b></font>
         Mutation Code Coverage: <font color="#859900"><b>100%</b></font>
         Covered Code MSI: <font color="#859900"><b>100%</b></font>
</pre>

We did it, we fixed the bug, killed all mutants and saved the day!

## Metrics

We have seen the Metrics in the infection output, but what does it mean?

**Mutation Score Indicator (MSI)**

Let's say our code base has a total of 100 possible mutations. 40 of those are caught by the tests, either because the tests fail or because
they cause a time out or a php error. 20 of them are not covered by tests, and another 40 don't cause the tests to fail and 'escape'.

This would give us a MSI of 40% (The amount of killed mutations divided by the total possible amount.) You generally want this number
to be close to your code coverage. If it is a lot lower it means your tests aren't as good as you think they are.

It can be enforced, for example on CI, with the `--min-msi` flag.

**Mutation Code Coverage**

This the amount of mutations that are covered by tests, if we take the numbers of the MSI example, it would be 80%.

**Covered Code MSI**

This is the same as MSI, except only for covered code. So all mutations that are not covered by tests are ignored.
If we take the numbers of the MSI example, we have a Covered Code MSI of 50%. You want this to be as close to 100% as possible.

It can be enforced, for example on CI, with the `--min-covered-msi` flag.


## Usage

**Installation**

You can install infection in a few ways:

* Through Composer as a dev dependency: `composer require infection/infection --dev`
* Through Composer as a global package: `composer global require infection/infection`
* Or as a phar: 

```bash
$ wget https://github.com/infection/infection/releases/download/0.8.2/infection.phar
$ wget https://github.com/infection/infection/releases/download/0.8.2/infection.phar.pubkey

$ chmod +x infection.phar
```

If you want to update your phar you can do so by running `$ ./infection.phar self-update`.

**Local usage**

Running infection can take a lot of time if you have a big project or if your tests are slow. One way to speed it up is to run it with the following option:
``` --threads=`nproc` ```. This will run the tests against mutations multi threaded, with as much threads as useful. **Note:** This should only be done
if your tests can be ran parallel. If they use a database or the file system this can lead to a lot of mutations being killed that are not detected by your tests.


**CI**

If you run infection during CI, its recommended to run it with the `--min-msi` and/or `--min-covered-msi`. This will force you to write better tests and keep your
MSI and Covered Code MSI as a stable rate.

If you are already generation coverage on CI, you can hand infection that coverage, so it doesn't have to generate it itself.
Infection needs xml and junit coverage to run

```bash
$ vendor/bin/phpunit --coverage-xml coverage/coverage-xml --log-junit=coverage/phpunit.junit.xml

$ vendor/bin/infection --coverage=coverage
```

If you only want to run infection against changed code, you can run it like this:

```bash
INFECTION_FILTER=$(git diff ${GIT_PREVIOUS_SUCCESSFUL_COMMIT:-origin/master} $GIT_COMMIT --name-only | grep /src/ | paste -sd "," -)

$ vendor/bin/infection --threads=4 --min-msi=70 --only-covered --filter="${INFECTION_FILTER}" --ignore-msi-with-no-mutations
```

This will only run infection against changed files that differ from the last successful commit on this branch, or master if there is none, in the `src` folder.
The `--ignore-msi-with-no-mutations` flag causes us to not error on min msi when we have 0 mutations.


For all the configuration options, you can check out [infections documentation](https://infection.github.io/guide/usage.html).