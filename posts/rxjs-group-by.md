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

So in [this post](rate-limiting-an-express-app), we used [RxJS](https://rxjs.dev)
and [RxXpress](https://https://loreanvictor.github.io/rxxpress/) to conduct rate-limiting
on an [Express](https://expressjs.com/) API, in a fairly descriptive and reactive
manner. You should checkout that post if you want to know more details, but here
is how to achieve that in a nut-shell:

> - Do authentication on each incoming request
> - Split the incoming stream of requests per user
> - Throttle each user-request stream by a certain duration (10 seconds)

We used [RxXpress](https://https://loreanvictor.github.io/rxxpress/) 
to get a _stream_ of incoming requests ([Express](https://expressjs.com/) itself just allows you to
submit a callback that acts per-request), split the main stream into per-user streams
using [RxJS's `groupBy()`](https://www.learnrxjs.io/learn-rxjs/operators/transformation/groupby) operator,
throttled each stream using [`throttleTime()`](https://www.learnrxjs.io/learn-rxjs/operators/filtering/throttletime),
and then merged them back for the rest of the API to handle:

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

// To be continued ...

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
> RxJS, Express, groupBy, API, Rate Limit, RxXpress, Backend, Service, Stream, Reactive Programming, FRP