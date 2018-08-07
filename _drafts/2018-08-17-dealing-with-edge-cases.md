---
layout: post
title: Dealing with edge cases
tags: php error-handling exceptions edge-cases
permalink: dealing-with-edge-cases
---
It feels like the 80/20 rule applies to almost everything. We can create 80% of the functionality with 20% of the time, while the last 20% will
take up 80% of the time. Thats because that last 20% are the edge cases no one thought about until you ran into them.
But what is the 'best' way of dealing with these edge cases? How do we deal with things not going the way we expect them to go?

If we want to open a file, but the file is not readable, do we return an empty string, false, null, a default value, or throw an exception?
Lets take a closer look at these edge cases and how to deal with them.
<!--more-->

Lets say we have an interface for classes that retrieve some kind of resource for us. We could write that method in two ways:

```php
/**
 * Gets Resource for ID, or null if the current user is not allowed, or if the resource is not found
 *
 * @param int $resourceId
 * @return null|Resource
 */
public function getResourceById(int $resourceId): ?Resource;

/**
 * @param int $resourceId
 *
 * @throws AccessDeniedException
 * @throws ResourceNotFoundException
 *
 * @return Resource
 */
public function getResourceById(int $resourceId): Resource;
```

If we use the first solution, every time we would use it, there would be a `=== null` check. And we would have to make a decision, do we
pass along `null` as well? Or do we return something else? If we return `null` again, we would have another `=== null` check in the method that retrieves
that value, and so on.

The second method allows us to intercept at any level of abstraction with a try catch.
Without having to worry about a random `TypeError` somewhere because we forgot one `null` check.
The second option follows 'tell don't ask'. We tell the people using the interface what to expect. They don't have to
try different options or read documentation. They don't have to 'ask'. Another upside is that you can easily
figure out what the 'issue' is that causes this opperation to fail.

Of course, returning 'null' can also be vaLid. Especially for an internal API, where a method is only called from one place, in one
context. Lets say we have a configuration class that checks multiple configuration sources, in order, and returns correct setting.

An implementation could look like
```php
public function getFooConfig(): Foo
{
    return $this->input->getFoo() ?? $this->yamlConfig->getFoo() ?? $this->dbConfig->getFoo() ?? self::FOO_DEFAULT;
}
```

If every method could throw an exception, we would have to do something like this.
```php
public function getFooConfig(): Foo
{
    try {
        return $this->input->getFoo();
    } catch (NotConfiguredException $e) {
        try {
            return $this->yamlConfig->getFoo();
        } catch (NotConfiguredException $e) {
            //etc...
        }
    }
    return self::FOO_DEFAULT;
}
```
