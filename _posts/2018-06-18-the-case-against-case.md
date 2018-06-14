---
layout: post
title: The case against case
tags: php switch case comparison
permalink: the-case-against-case
---

Chances are you have written a switch case statement or two. Aren't they much 'cleaner' than a bunch of if else statements?
Today i would like to convince you that using switch case, in modern php, is a bad practice.
<!--more-->

Lets take a look at the following code snippet.

```php
<?php 
//test.php
declare(strict_types=1);

class One
{
    public function __toString()
    {
        return '1';
    }
}

function foo($value)
{
    switch ($value) {
        case '1':
            echo "got 1 \n";
            break;

        default:
            echo "did not get 1\n";
            break;
    }
}

foo(new One());
foo(1);
foo('1');
```
```bash
$ php test.php
got 1
got 1
got 1
```

As we can see, switch case checks if its value is equal rather than the same, it uses `==` instead of `===`.
This means switch case will juggle types, in order to see if the values it has are 'equal'. Even the `declare(strict_types=1)` doesn't change anything about that.

Our code bases are filled with `===` checks, we use `declare(strict_types=1)` in our php 7+ projects. If possible we enforce both of those in our code standards.
Yet, we still use switch and case, while very case is an equal check rather than a same check. Which means its a potential for bugs/ unexpected behavior.

So, if you are using switch case, refactor it into an if/else statement like so:

```php
<?php 
//test.php
declare(strict_types=1);

class One
{
    public function __toString()
    {
        return '1';
    }
}

function foo($value)
{
    if ($value === '1') {
        echo "got 1 \n";
    } else {
    	echo "did not get 1\n";
    }
}

foo(new One());
foo(1);
foo('1');
```
```bash
$ php test.php  
did not get 1
did not get 1
got 1 
```

And suddenly, we are checking that the input is actually the string '1', rather than something that is roughly the same.
Of course, this is a rather simple example, but any switch case statement can be changed into an if else that will not type juggle.
Another benefit of this is that magic methods like `__toString()` will not be called, just in case, god forbid, those have side effects.

Maybe if we are lucky we'll see strict switch statements in [future php versions](https://github.com/sgolemon/php-src/commit/65afc5fbe53b56dff54b0ccf51a747ce1d561534). 
But until that day, lets stay away from switch case.