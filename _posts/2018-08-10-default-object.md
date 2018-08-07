---
layout: post
title: What is a default object?
tags: php error-handling edge-cases
permalink: default-objects
---

What is a clean solution to display a 'default' message to the user, when something they try to access isn't there (anymore)?
We could let the our repository throw an exception, catch it somewhere, and then let our controller handle it. Maybe we could
return null, and pass that all the way up and add a fall back message for the content in the view somewhere?
Why not try a better solution and work with a default object.
<!--more-->

A default object (or null object) should come from business requirements. Lets say you are writing a website for bloggers.
If the user goes to see a blog post that doesn't exist(anymore), it should display the error message:
`Sorry, no blog post was found on this url`. There are multiple ways to do this, so lets first look at doing this the
'old fashioned' way and throw an exception somewhere:

```php
//Blog.php

class Blog
{
    public static function fromDB(Entity $blogEntity)
    {
        //logic
        return new Blog($title, $content));
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getContent(): string
    {
        return $this->content;
    }
}

//BlogService.php

class BlogService
{
    /**
     * @param int $id
     *
     * @throws BlogNotFoundException
     *
     * @return Blog
     */
    public function getBlog(int $id): Blog
    {
        $blogEntity = $this->db->getById($id);

        if($blogEntity === null) {
            throw BlogNotFoundException::notFoundById($id);
        }
        return Blog::fromDB($blogEntity);
    }
}

//BlogController.php

class BlogController
{
    public function showBlog(int $blogId)
    {
        try {
            return $this-render('blog.show.html', [
                'title' => $blog->getTitle(),
                'content' => $blog->getContent(),
            ]
        )
            $blog = $this->blogService->getBlog($blogId)
        } catch (BlogNotFoundException $e) {
            return $this-render('blog.show.html', [
                'title' => 'Sorry, no blog post was found on this url'
                'content' => '',
            ]
        }
    }
}
```
Chances are that you've seen code like this before. Or maybe the service would return null, and then the logic of displaying the title or the default text was
placed somewhere in the view. This means that multiple places must 'care' about whether or not the blog post exists. It also causes the requirements to be
hidden somewhere within your infrastructure. It may make it harder in case the business decides they want a different fall back message.

Now lets refactor the code to use a default object, and see what that looks like.

```php
//Blog.php

class Blog
{
    public static function fromDB($blogEntity)
    {
        //logic
        return new Blog($title, $content);
    }

    public static function fromNotFound()
    {
        return new Blog('Sorry, no blog post was found on this url');
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getContent(): string
    {
        return $this->content;
    }
}

//BlogService.php

class BlogService
{
    public function getBlog(int $id): Blog
    {
        $blogEntity = $this->db->getById($id);

        return $blogEntity ? Blog::fromDB($blogEntity) : Blog::fromNotFound($id);
    }
}

//BlogController.php

class BlogController
{
    public function showBlog(int $blogId)
    {
        return $this-render('blog.show.html', [
            'title' => $blog->getTitle(),
            'content' => $blog->getContent(),
        ]
    }
}
```
Now to me, this looks a lot cleaner. The Controller no longer knows if the blog was found or not, and when you read the code it is still clear what is
happening. We use a named constructor here, which makes it clear what is going on. We could also opt to use a separate class entirely.
One of the benefits of doing so is that you could place in your `Domain` namespace since this deals with domain logic (if you are separating into domain
and infrastructure). I personally prefer to make all classes final or abstract, so i use a named constructor.

An implementation with a separate class may look something like this:


```php
//NotFoundBlog.php

class NotFoundBlog extends Blog
{
    public function getTitle(): string
    {
        return 'Sorry, no blog post was found on this url';
    }

    public function getContent(): string
    {
        return '';
    }
}

//BlogService.php

class BlogService
{
    public function getBlog(int $id): Blog
    {
        $blogEntity = $this->db->getById($id);

        return $blogEntity ? Blog::fromDB($blogEntity) : new NotFoundBlog();
    }
}
```

If you enjoyed this post, have comments, feedback, or anything else, feel free to comment, or hit me up on [twitter][my-twitter]

[my-twitter]: https://twitter.com/backendtea
