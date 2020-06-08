> :Hero src=https://images.unsplash.com/photo-1523286575777-21af045abec8?w=1993&h=600&fit=crop, \
> target=desktop, leak=188px

> :Hero src=https://images.unsplash.com/photo-1523286575777-21af045abec8?w=1990&h=1200&fit=crop, \
> target=mobile, leak=128px

> :Title shadow=0 0 6px #0000009e, color=white
>
> Rate Limiting An Express App

> :Space

Imagine you have an API with multiple end-points written in NodeJS and using Express. And you
want to implement a rate limit on this API for each user (pretty common for any API).

The general code-structure of that would look like this:

```ts
import * as express from 'express';


const router = express.Router();

router.all('*', (req, res, next) => {
  // TODO: apply rate limiting
});

// ...
// Rest of your API definition
// ...

export default router;
```

---

# Naive Solution

To apply a global 10 seconds rate limit, we could write the middleware code like this:

```ts
import * as express from 'express';


const router = express.Router();

/*!*/let lastReq;                                  // --> store the time of last request
/*!*/
/*!*/router.all('*', (req, res, next) => {
/*!*/  const now = new Date();
/*!*/  if (!lastReq || (lastReq - now) > 10000) {  // --> if it has been 10 seconds since last request
/*!*/    lastReq = now;                            // --> update time of last request
/*!*/    next();                                   // --> pass to next handler (rest of the API)
/*!*/  } else {
/*!*/    res.status(400).send();                   // --> otherwise, timeout
/*!*/  }
/*!*/});

// ...
// Rest of your API definition
// ...

export default router;
```

This already looks a bit hacky, since there is a global variable that is being updated by a middleware function. We could of-course
clean this up a bit by writing a custom middleware function:


> :Tabs
> > :Tab title=middleware
> >```ts
> >export function rateLimit(duration) {
> >  let last;
> >
> >  return (req, res, next) => {
> >    const now = new Date();
> >    if (!last || (last - now) > duration * 1000) {
> >      last = now;
> >      next();
> >    } else {
> >      res.status(400).send();
> >    }
> >  }
> >}
> >```
> 
> > :Tab title=router
> >```ts
> >import * as express from 'express';
> >import { rateLimit } from './rate-limit'; // @see tab:middleware
> >
> >
> >const router = express.Router();
> >
> >/*!*/router.all('*', rateLimit(10));
> >
> >// ...
> >// Rest of your API definition
> >// ...
> >
> >export default router;
> >```

<br>

Now this seems much neater, but what we have implemented is a _global rate limit for anyone accessing the API_.
In other words, if Bob access the API, then Alice cannot access it for 10 seconds as well.

To fix that, we would need to authenticate the user making each request, and for simplicity lets assume
we have an `authenticate()` function that does exactly that job for us. Also let's assume that
`authenticate()` basically populates `req._.user`, which has an id, etc.

Now our code would look like this:

> :Tabs
> > :Tab title=middleware
> >```ts
> >export function rateLimit(duration) {
> >  const last = {};                                     // --> keep a list of users with the timestamp of their last request
> >
> >  return (req, res, next) => {
> >    const now = new Date();
> >    if (
> >      !(req._.user.id in last) ||                      // --> if the user has not made a request
> >      (last[req._.user.id] - now) > duration * 1000    // --> or it has been 10 seconds since their last request
> >    ) {
> >      last[req._.user.id] = now;                       // --> update user's timestamp
> >      next();                                          // --> handle user's request
> >    } else {
> >      res.status(400).send();                          // --> otherwise, timeout
> >    }
> >  }
> >}
> >```
> 
> > :Tab title=router
> >```ts
> >import * as express from 'express';
> >import { authenticate } from './auth';
> >import { rateLimit } from './rate-limit'; // @see tab:middleware
> >
> >
> >const router = express.Router();
> >
> >/*!*/router.all('*', authenticate(), rateLimit(10));
> >
> >// ...
> >// Rest of your API definition
> >// ...
> >
> >export default router;
> >```

Besides still not being neat, we still have the issue that our `rateLimit()` middleware requires
another authentication middleware that does populate `req._.user` object. Brushing off that, it has a more pressing
practicual issue: the `last` object that the middleware creates only grows in time, means that our memory
consumption is strictly increasing over time.

To fix that, we could restructure our middleware to maintain a lock for each user and release it after a while:

```ts
export function rateLimit(duration) {
  const lock = {};
  return (req, res, next) => {
    if (req._.user.id in lock) {
      res.status(400).send();
    } else {
      next();
      lock[req._.user.id] = true;
      setTimeout(() => delete lock[req._.user.id], 1000 * duration);
    }
  }
}
```

Now our solution works (and our middleware is also pretty small), but it has the following issues:

- Our middleware is not generic, as it is bound to the middlewares before that to set some identifier
  on each request,
- Our middleware code looks weird and it is not obvious what it does on the first look. A simple thing
  like rate-limiting surely should be done in a much simpler manner.

---

# Stream-Based Solution

The main reason our approach seems to bare the aforementioned issues is that we are looking at one request
at a time, and using the middleware's closure (i.e. `lock` or `last`) as an in-mem way of communicating
between those times when we are making a decision for each request.

The nature of our goal (rate limiting per user) however has more to do with streams of request than each single
request. What we want to do is:

> - Do an authentication on each incoming request (as before)
> - Break the incoming stream of requests per user
> - Throttle each stream by a certain duration (10 seconds)

That seems extremely simply, but Express is based on handling one request at a time and not working
with streams of requests, so unfortunately we cannot have a code as neat as this simple description.

Or can't we?

Well, there is this neat library for working with streams called [RxJS](https://www.learnrxjs.io/) out
there. And there is a nice little library that creates a request stream for us based on Express's routers,
called [RxXpress](https://loreanvictor.github.io/rxxpress/). Combining the two, our rate limiting could look
more like this:

```ts
import { Router, next } from 'rxxpress';
import { throttleTime, groupBy, mergeMap } from 'rxjs/operators';

import { authenticate } from './auth';

const router = new Router();

/*!*/router.all('*').pipe(
/*!*/  use(authenticate()),                                  // --> conduct authentication
/*!*/  groupBy(({req}) => req._.user.id),                    // --> split request stream based on user
/*!*/  mergeMap(group => group.pipe(throttleTime(10000))),   // --> throttle each split stream 10 seconds, then merge them together
/*!*/  next()                                                // --> pass to next handler
/*!*/).subscribe();

// ...
// Rest of your API definition
// ...

export default router.core;
```

Ok that DOES look like our neat stream-based description, but if you are not familiar with RxJS, thats a lot
to unpack in one go. So lets break it down a bit:

<br>

```ts
/*!*/router.all('*').pipe(...).subscribe();
```

Basically with the [RxXpress router](https://loreanvictor.github.io/rxxpress/router), 
each route is a stream of requests instead of a function accepting a callback.
Here we are basically saying I want the stream of all requests (all methods, any path), and want to pipe it to some
operators (each operator is simply a function that is applied on the stream, pretty similar to piping shell commands),
and then subscribe to it (so we get those requests).

<br>

```ts
router.all('*').pipe(
/*!*/  use(authenticate())
  // ...
)
```

We simply [use](https://loreanvictor.github.io/rxxpress/operators/use) our nice `authenticate()` middleware on 
each incoming request.

<br>

```ts
router.all('*').pipe(
  // ...
/*!*/  groupBy(({req}) => req._.user.id)
  // ...
)
```

The [`groupBy`](https://www.learnrxjs.io/learn-rxjs/operators/transformation/groupby) operator splits our initial
stream of our requests based on each user. The end result is a _stream of streams_, i.e. a _master stream_, which emits
_user request streams_ (a stream of requests by that user).

<br>

```ts
router.all('*').pipe(
  // ...
/*!*/  mergeMap(group => group.pipe(throttleTime(10000)))
  // ...
)
```

Ok this is a two-parter, first look at the inner part:

```ts
group => group.pipe(throttleTime(10000))
```

Remember how `groupBy()` split our stream? Each split stream ends up here, as the `group` variable. Each stream
is the stream of requests by each user, and we wanted to throttle it 10 seconds, so here is where
[`throttleTime()`](https://www.learnrxjs.io/learn-rxjs/operators/filtering/throttletime) operator comes to play.
It simply passes on the first emission and drops the rest until given time is passed.

Now for the second part: 

```ts
router.all('*').pipe(
  // ...
/*!*/  mergeMap(...)
  // ...
)
```

well the rest of our code doesn't need to be aware that we have split the original
stream of requests to different streams based on user, so we need to _merge_ those streams after throttling them
individually again. That is where [`mergeMap()`](https://www.learnrxjs.io/learn-rxjs/operators/transformation/mergemap)
comes into play, as it simply merges all those streams into a single stream of requests again.

<br>

```ts
router.all('*').pipe(
  // ...
  next()
)
```

Well every request that gets to this point (and is not dropped by throttling), should be passed
to the next request handler in line, and that is precisely what [`next()`](https://loreanvictor.github.io/rxxpress/operators/next)
does.

---

# Pros & Cons

So lets look at our two solutions side by side:

> :Tabs
> > :Tab title=streaming solution
> > ```ts
> > import { Router, next } from 'rxxpress';
> > import { throttleTime, groupBy, mergeMap } from 'rxjs/operators';
> > 
> > import { authenticate } from './auth';
> > 
> > const router = new Router();
> > 
> > router.all('*').pipe(
> >   use(authenticate()),                                  // --> conduct authentication
> >   groupBy(({req}) => req._.user.id),                    // --> split request stream based on user
> >   mergeMap(group => group.pipe(throttleTime(10000))),   // --> throttle each split stream 10 seconds, then merge them together
> >   next()                                                // --> pass to next handler
> > ).subscribe();
> > 
> > // ...
> > // Rest of your API definition
> > // ...
> > 
> > export default router.core;
> > ```
>
> > :Tab title=naive solution
> >```ts | router code
> >import * as express from 'express';
> >import { authenticate } from './auth';
> >import { rateLimit } from './rate-limit'; // @see tab:middleware
> >
> >
> >const router = express.Router();
> >
> >router.all('*', authenticate(), rateLimit(10));
> >
> >// ...
> >// Rest of your API definition
> >// ...
> >
> >export default router;
> >```
> > ```ts | middleware code
> > export function rateLimit(duration) {
> >   const lock = {};
> >   return (req, res, next) => {
> >     if (req._.user.id in lock) {
> >       res.status(400).send();
> >     } else {
> >       next();
> >       lock[req._.user.id] = true;
> >       setTimeout(() => delete lock[req._.user.id], 1000 * duration);
> >     }
> >   }
> > }
> > ```

As you can see, the streaming solution is much more precise and elegant. However, not only
it requires more knowledge of a library like RxJS, it generally demands thinking in terms of
streams, which is not familiar for us programmers as most of our experience is with problems
that we think imparatively about, i.e. in terms of instructions that are executed one after
another.

This different paradigm of course becomes a serious barrier for a lot of people, so a lot might
actually prefer the naive solution to the stream-based one. _And that is OK_. However,
I hope seeing whats on the other side of that barrier might encourage you to try to overcome
it and embrace the reactive nature of most of what we, as web developers, do, instead of shying
away from it.

---

> :Author src=github

<br>

_Hero image by [Makarios Tang](https://unsplash.com/@makariostang) from [Unsplash](https://unsplash.com)_

> :MetaOverride target=description
>
> How to conduct a per-user rate limit on an Express-powered API? Well there is a naive solution, and there
> is a more elegant one which requires thinking in streams and reactive programming.

> :MetaOverride target=keywords, behavior=extend
>
> RxJS, Express, API, Rate Limit, Backend, Service, Stream, Reactive Programming, FRP