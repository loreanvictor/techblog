> :Hero src=https://images.unsplash.com/photo-1516640710924-c982f6b6ff2a?w=1993&h=600&fit=crop,
>       target=desktop,
>       leak=192px

> :Hero src=https://images.unsplash.com/photo-1516640710924-c982f6b6ff2a?w=1993&h=1200&fit=crop,
>       target=mobile,
>       leak=128px

> :Title shadow=0 0 6px #0000009e, color=white
>
> How RxJS groupBy() Works

> :Space

When working with streams of data, sometimes you want to group incoming data
from a particular stream, lets call it the _main stream_. For example,
imagine our _main stream_ is a stream of incoming HTTP requests:

```ts
import { Router } from 'rxxpress';    // @see [RxXpress](https://loreanvictor.github.io/rxxpress/)

const router = new Router();          // --> this is an HTTP router that gives us streams of requests

/*!*/router.all('*').pipe(                 // --> this is our stream
/*!*/  ...                                 // --> this is our stream
/*!*/).subscribe();                        // --> this is our stream

export default router.core;
```

If you are not familiar with [RxXpress](https://loreanvictor.github.io/rxxpress/), its a library quite
like [Express](https://expressjs.com/) for handling incoming HTTP requests (it even works with Express
under the hood and [integrates neatly with Express](https://loreanvictor.github.io/rxxpress/#inter-operability)).
In Express, you register a callback for each route, looking at one request at a time. In RxXpress however,
you get a _stream of requests_ for each route instead, in form of an [RxJS Observable](https://rxjs.dev/guide/observable).

This allows us to manipulate the stream itself instead of dancing around with one request at a time.
For example, we can authenticate incoming requests, and then group them based on the user making the request:

```ts
import { Router, use } from 'rxxpress';    // @see [RxXpress](https://loreanvictor.github.io/rxxpress/)
import { groupBy } from 'rxjs/operators';      // --> use groupBy() to group incoming requests

import { authenticate } from './my-auth-code'; // --> a typical Express authentication middleware

const router = new Router();                   // --> this is an HTTP router that gives us streams of requests

/*!*/router.all('*').pipe(                          // --> get the stream of all requests
/*!*/  use(authenticate),                           // --> this allows using Express middlewares on a stream
/*!*/  groupBy(({req}) => req._.user.id)            // --> group incoming requests by user id
/*!*/).subscribe();

export default router.core;
```

For this example, we have assumed that `authenticate()` is a typical Express middleware, authenticating
each request and populating `req._.user`. This line simply allows us to use an Express middleware on a stream
of requests:

```ts
  use(authenticate)
```

And this line allows us to group incoming requests based on the user making the request:

```ts
  groupBy(({req}) => req._.user.id)
```

Our _main stream_ is now split into multiple _user request streams_, each being the stream of requests by a particular user.

How many streams do we need? That is not determinable, and it will even change over time. For each new user, i.e. a user
who is making their first request, we would need a new _user request stream_, while we need requests from returning users,
i.e. users who have already made at least one request before, to be channeled into their corresponding _user request stream_.

Due to this dynamic nature of stream-splitting, `groupBy()` operator basically turns our _main stream_ from a _stream of requests_
to a _stream of streams_, to be more precisely a _stream of user request streams_. For each new user, it will create a new
_user request stream_ and emit that stream, channeling the request to that stream. For returning users, it will not emit anything,
it will just channel their requests to their corresponding _user request stream_.

---

## A Stream of Streams?

To get a better grasp of the _stream of streams_ nature of `groupBy()` operator, lets take a look at a simpler example:

```ts
import { interval } from 'rxjs'; 
import { groupBy } from 'rxjs/operators';


interval(1000)               // --> our main stream
.pipe(groupBy(x => x % 3))   // --> grouping by modulo of 3
.subscribe(console.log);     // --> log the main stream
```

> :Buttons
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-group-by-example-1?embed=1&file=index.ts&hideExplorer=1&devtoolsheight=100


In this case, our main stream is one that emits numbers `0, 1, 2, 3, 4, ...` every second.
We then split the stream based on their modulo of 3. If you run this code, you will get a console output
like this:

```bash
> GroupedObservable ...
> GroupedObservable ...
> GroupedObservable ...
```

Each of these are being logged one second after another, and after the third log you have no further logs. Basically,
when 0 is emitted, the first _sub-stream_ is created, emitted and subsequently logged (as the `GroupedObservable`),
and the same thing happens for 1 and 2. However, when 4 is emitted, since `3 % 3 === 0 % 3`, then the first
_sub-stream_ is used again, instead of creating a new stream, and so nothing more is logged.

Now if we wanted to get the numbers logged, paired with their group, we could for example
[`tap`](https://www.learnrxjs.io/learn-rxjs/operators/utility/do) into this _stream of streams_, and
log contents of each _sub-stream_:

```ts
import { interval } from 'rxjs'; 
import { groupBy, tap } from 'rxjs/operators';


interval(1000)
.pipe(
  groupBy(x => x % 3),
/*!*/  tap(group => {
/*!*/    group.subscribe(v => console.log(`${group.key}:: ${v}`));
/*!*/  })
)
.subscribe(console.log);
```

> :Buttons
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-group-by-example-2?embed=1&file=index.ts&hideExplorer=1&devtoolsheight=100

Running this code would yield something like this:

```bash
> GroupedObservable ...
0:: 0
> GroupedObservable ...
1:: 1
> GroupedObservable ...
2:: 2
0:: 3
1:: 4
2:: 5
...
```

Note how we used `group.key` to identify each group. This is the same value that identifies data of each group,
i.e. the result of `x => x % 3`.

The cool part of RxJS is that it also allows us to merge these split streams back into one stream.
For example, we can use [`mergeMap()`](https://www.learnrxjs.io/learn-rxjs/operators/transformation/mergemap)
to simply merge all of the streams:

```ts
import { interval } from 'rxjs'; 
import { groupBy, mergeMap, map } from 'rxjs/operators';


interval(1000)
.pipe(
  groupBy(x => x % 3),
/*!*/  mergeMap(group =>                                  // --> merge all sub-streams
/*!*/    group.pipe(map(v => `${group.key}:: ${v}`))      // --> turn each sub-stream to a stream of strings, also including the sub-stream key
/*!*/  )                                                  // --> merge all sub-streams
)
.subscribe(console.log);
```

> :Buttons
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-group-by-example-3?embed=1&file=index.ts&hideExplorer=1&devtoolsheight=100

Now we are back to a _single stream of strings_ (instead of a _stream of streams_), and running code would look like this:

```bash
0:: 0
1:: 1
2:: 2
0:: 3
1:: 4
2:: 5
...
```
---

## Sub-Stream Life Cycle

Getting back to our _stream of user request streams_ example, what is the purpose of this stream-splitting?
Well it is useful for situations where you would want to do something on each particular stream. For example,
if you want to rate limit each user, you could simply [_throttle_](https://www.learnrxjs.io/learn-rxjs/operators/filtering/throttletime)
their request stream:

```ts
import { Router, use, next } from 'rxxpress'
import { groupBy, mergeMap, throttleTime } from 'rxjs/operators';

import { authenticate } from './my-auth-code';

const router = new Router();

/*!*/router.all('*').pipe(                                   // --> the request stream
/*!*/  use(authenticate),                                    // --> authenticate each request
/*!*/  groupBy(({req}) => req._.user.id),                    // --> split the stream per-user
/*!*/  mergeMap(group => group.pipe(throttleTime(10000))),   // --> throttle each user-stream individually
/*!*/  next(),                                               // --> pass to the next handler
/*!*/).subscribe();

export default router.core;
```

In this example, the `next()` operator simply passes requests that are yet to be responded to
to the next request handler (it is similar to calling `next()` inside an Express middleware).
We are basically splitting the stream per user, throttling each _sub-stream_ 10 seconds,
then merging them back and letting someone else handle the rest. In effect, this code describes
a nice _per-user rate-limiting_ middleware that can be mounted on any Express router / app.

The issue here is that, if there is a _sub-stream_ created for each user, slowly but surely
we will fill up the memory with these _sub-streams_.

Fortunately, `groupBy()` also accepts a _duration selector_ argument, with which you can control
how long each _sub-stream_ should be kept alive. In our example, we simply need to keep each
_user request stream_ alive for a bit more than 10 seconds after its last request, which would
look like this:

```ts
import { Router, use, next } from 'rxxpress'
import { groupBy, mergeMap, throttleTime, debounceTime } from 'rxjs/operators';

import { authenticate } from './my-auth-code';

const router = new Router();

router.all('*').pipe(                                   // --> the request stream
  use(authenticate),                                    // --> authenticate each request
/*!*/  groupBy(
/*!*/    ({req}) => req._.user.id,                           // --> group by user id
/*!*/    undefined,
/*!*/    group => group.pipe(debounceTime(11000))            // --> keep each group around 11 seconds after last request
/*!*/  ),
  mergeMap(group => group.pipe(throttleTime(10000))),   // --> throttle each user-stream individually
  next(),                                               // --> pass to the next handler
).subscribe();

export default router.core;
```

The _duration selector_ works like this: When a group is created, the provided function is called,
and it is expected to return an observable. When that observable emits its first value, then the _sub-stream_
(or the _group_) is disposed, and when a new emission comes from the _main stream_ that would have belonged
to that particular _sub-stream_, a new _sub-stream_ is created.

To see that in action, take a look at this example:

```ts
import { interval, timer } from 'rxjs'; 
import { groupBy, mergeMap, tap, scan } from 'rxjs/operators';


// In this example, since each group is only kept around for 4 seconds,
// the number of emissions of each group doesn't exceed 2.

interval(1000).pipe(
  groupBy(
    v => v % 3,                                    // --> group by modulo 3
    undefined,
/*!*/    () => timer(4000)                              // --> keep each group around for 4 seconds
  ),
  mergeMap(
/*!*/    group => group.pipe(
/*!*/      scan(count => count + 1, 0),                 // --> count emissions of each group
/*!*/      tap(v => console.log(`${group.key}:: ${v}`)) // --> log that count
/*!*/    )
  )
)
.subscribe();
```

> :Buttons
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-group-by-duration-selector-ex1?embed=1&file=index.ts&devtoolsheight=100

Here we count the emissions of each _sub-stream_ and log them. Each _sub-stream_ emits a new value every 3 seconds,
but it is allowed to live only for 4 seconds, so we cannot get to a count higher than 2:

```bash
0:: 1
1:: 1
2:: 1
0:: 2
1:: 2
2:: 2
0:: 1
1:: 1
2:: 1
...
```

However, we could make each _sub-stream_ live for _4 seconds after its last emission_, using the
[`debounceTime()`](https://www.learnrxjs.io/learn-rxjs/operators/filtering/debouncetime) operator:

```ts
import { interval, timer } from 'rxjs'; 
import { groupBy, mergeMap, tap, scan, debounceTime } from 'rxjs/operators';


// In this example, each group is kept around 3.1 seconds after its last
// emissions. Since each group emits every 3 seconds, this means that each group
// is going to remain around indefinitely.

interval(1000).pipe(
  groupBy(
    v => v % 3,                                    // --> group by modulos 3
    undefined,
    group => group.pipe(debounceTime(4000))        // --> keep each group around for ...
                                                   // --> ... 4 seconds after last emission
  ),
  mergeMap(
    group => group.pipe(
      scan(count => count + 1, 0),                 // --> count emissions of each group
      tap(v => console.log(`${group.key}:: ${v}`)) // --> log that count
    )
  )
)
.subscribe();
```

> :Buttons
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-group-by-duration-selector-ex2?embed=1&file=index.ts&devtoolsheight=100

---

If you are interested in rate-limiting Express apps, specifically using RxJS and RxXpress, you can also
take a look at this blog post:

> :ArticleCard src=/rate-limiting-an-express-app

---

> :Author src=github

<br>

_Hero image by [Suganth](https://unsplash.com/@suganth) from [Unsplash](https://unsplash.com)_

> :MetaOverride target=description
>
> RxJS groupBy() operator is a useful but nuanced tool. In last post we used it to
> easily and descriptively rate-limit an API, here we will dig more into its specification
> in the context of same example.

> :MetaOverride target=keywords, behavior=extend
>
> RxJS, Express, groupBy, API, Rate Limit, RxXpress, Stream, Events, Reactive Programming, FRP