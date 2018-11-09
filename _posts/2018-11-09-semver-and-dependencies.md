---
layout: post
title: Semantic versioning
tags: semver composer npm dependency
permalink: semver-dependencies
---

Chances are, if you are writing software, you have some dependencies on other peoples code.
There is no reason to reinvent the wheel, so you use the code someone else wrote.
One of your options is to copy paste it, but then you won't get any updates if they release
a new version.

This is where dependency managers come into play. With a set of instructions, they retrieve the
needed dependencies for you, and allow you to lock into specific versions, and update when you want.
Before we head into dependency managers, lets first talk about semantic versioning (semver).
<!--more-->
## Semver

There is a [website][semver] dedicated to explaining what semver entails. For now the most important
parts are the following:

1. Version numbers look as follows: MAJOR.MINOR.PATCH
2. Any 'breaking' change is a Major version up
3. Any (set of) new feature(s) is a Minor version up
4. Bug fixes and fixes with no impact (refactoring/fixing typos) are a Patch version up

This is only for project that have a public API, and is only relevant to the public API. Which means
that if you expose a class, for other developers to use, then you can change the private parts of it
without a major version bump. But removing a public method, that the users may call is a breaking change,
which requires a major version up.

## Dependency management

Lets take [symfony][symfony-web] as an example. Let say we have a project, and need the features from
`symfony/console` 3.4. In our `composer.json` we set the required version like so: `"symfony/console": "^3.4"`.
What we tell composer is the following: We need version 3.4, or higher. But not past a major.
This means that it will attempt to install the highest 3.* version possible, but at least 3.4.0. So if version
4.0.0 will be released, it will not be installed, because that can contain breaking changes.

## Before 1.0.0

Semver works a bit different before a version 1.0.0 is released. Before this version, every MINOR version up is
allowed to have breaking changes, as they are considered pre-releases. This means that if we take the same example as above
but like so: `"symfony/console": "^0.4"`, then we can only install versions of 0.4.*. Meaning that version 0.5.0 will not be
installed, as it can contain breaking changes.

This is something that is easy to forget, and may cause you to wonder why you aren't updating to the newest version of a package.
So for pre version 1.0.0 packages, be sure to check their updates. There may still be breaking changes between releases, so be sure
to keep up to date with their changes.

[semver]: https://semver.org/
[symfony-web]: https://symfony.com/
