> :Hero src=https://images.unsplash.com/photo-1553969914-e109f9d0e171?w=1993&h=600&fit=crop&q=80, \
> target=desktop, leak=156px, mode=dark

> :Hero src=https://images.unsplash.com/photo-1553969914-e109f9d0e171?w=1200&h=600&fit=crop&q=80, \
> target=mobile, leak=96px, mode=dark

> :Hero src=https://images.unsplash.com/photo-1574334292321-4844f63aefef?w=1993&h=600&fit=crop, \
> target=desktop, leak=156px, mode=light

> :Hero src=https://images.unsplash.com/photo-1574334292321-4844f63aefef?w=1200&h=600&fit=crop, \
> target=mobile, leak=96px, mode=light

> :PageHead shadow=none
>
> Error Handling in RxJS

<br><br>

Take this little **RxJS** snippet: It looks up abilities of a given Pokémon
in the [PokéAPI](https://pokeapi.co) and logs the results to the console:

```js
import { ajax } from 'rxjs/ajax';                      // @see [RxJS](https://learnrxjs.io)
import { BehaviorSubject } from 'rxjs';                // @see [RxJS](https://learnrxjs.io)
import { switchMap } from 'rxjs/operators';            // @see [RxJS](https://learnrxjs.io)

const POKE_API = 'https://pokeapi.co/api/v2/pokemon/';

/*!*/const name = new BehaviorSubject('charizard');                      // --> Represents the name of the Pokémon
/*!*/name.pipe(switchMap(name => ajax.getJSON(POKE_API + name + '/')))   // --> Request the API
/*!*/.subscribe(d =>                                                     // --> For each response ...
/*!*/  console.log(
/*!*/    `${d.name}:: ` +                                                // --> ... Log the name of the Pokemon ...
/*!*/    `${d.abilities.map(a => a.ability.name).join(', ')}`            // --> ... And their abilities
/*!*/  )
/*!*/);
```

> :Buttons
> > :CopyButton
>
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-pokemon?devtoolsheight=100

To utilize it, we can for example feed Pokémon names directly into the `name` subject:

```js
setTimeout(() => name.next('snorlax'), 1000);      // --> Let's have a timeout so data is requested one by one
setTimeout(() => name.next('eevee'), 3000);        // --> Let's have a timeout so data is requested one by one

// Result:
// > charizard:: solar-power, blaze
// > snorlax:: gluttony, thick-fat, immunity
// > eevee:: anticipation, adaptability, run-away
```

Or we can bind the `name` subject to an HTML input so that we get an interface
for our nice console tool:

```jsx
/** @jsx renderer.create **/
import { Renderer } from '@connectv/html';      // @see [CONNECTIVE HTML](https://github.com/CONNECT-platform/connective-html)

const renderer = new Renderer();                            // --> The `Renderer` class helps us render HTML elements
renderer.render(<input _state={name}/>).on(document.body);  // --> Render an input whose state is bound to `name`
```

<br>

Either way, our code snippet works pretty fine for correct Pokémon names and logs their abilities
to the console.

But what happens when we accidentally feed `name` a non-existing Pokémon name?

```js
setTimeout(() => name.next('snorlax'), 1000);     // --> snorlax info is fetched
/*!*/setTimeout(() => name.next('ZZZ'), 1000);         // --> ZZZ does not exist
/*!*/setTimeout(() => name.next('eevee'), 3000);       // --> eevee info is also not fetched!

// Result:
// > charizard:: solar-power, blaze
// > snorlax:: gluttony, thick-fat, immunity
// No more logs
```

<br>

Nothing was logged for `'ZZZ'`, which is not unexpected since we do not have any code
to handle errors, and since `'ZZZ'` is not a correct Pokémon name, it naturally gets an error
from the PokéAPI.

The problem is that when we fed `'eevee'` to `name` afterwards,
we still don't get any logs on the console. So, what went wrong?

---

# In Depth Look

To understand the situation, lets recall what `Observable`s basically are:

> An `Observable` is sorta-kinda like a function. To be more precise, its like a _push_
> function that generates multiple values (according to [**Rxjs**'s docs](https://rxjs-dev.firebaseapp.com/guide/observable)).
>
> In contrast, a normal function is a _pull_ function that generates one value.


If an `Observable` is like a function, then a `Subscription` is its equivalent of a _function call_.
The same way you need to _call_ a function to get its value, you need to _subscribe_ to an observable
to start getting its values:

```js
name.pipe(switchMap(name => ajax.getJSON(POKE_API + name + '/')))   // --> This is the `Observable`, or the function
/*!*/.subscribe(d =>                                                     // --> This is the `Subscription`, or the function call
/*!*/  console.log(                                                      // --> This is the `Subscription`, or the function call
/*!*/    `${d.name}:: ` +                                                // --> This is the `Subscription`, or the function call
/*!*/    `${d.abilities.map(a => a.ability.name).join(', ')}`            // --> This is the `Subscription`, or the function call
/*!*/  )
/*!*/);
```

When an unhandled error happens in a function call, that particular function call terminates. \
Similarly, when an unhandled error happens in a `Subscription`, that `Subscription` terminates.

In our code, we have _ONE_ subscription to `name.pipe(...)`, so
when an error occurs in it, it _terminates_:

```js
setTimeout(() => name.next('snorlax'), 1000);
setTimeout(() => name.next('ZZZ'), 1000);
setTimeout(() => name.next('eevee'), 3000);
```

1. `name` emits `'charizard'`, its initial value, so our subscription receives charizard's info from API.

1. `name` emits `'snorlax'`, so our subscription receives snorlax's info from API.

1. `name` emits `'ZZZ'`, and our subscription receives an error and _terminates_.

1. `name` doesn't even emit `'eevee'` because there are no subscriptions to emit to.

---

# Naive Error Handling

If it was imperative programming, we would simply enclose the whole thing 
in a try/catch block, so lets do the **RxJS** equivalent of that:

```js
import { ajax } from 'rxjs/ajax';
import { BehaviorSubject, of } from 'rxjs';
/*!*/import { switchMap, catchError } from 'rxjs/operators';    // --> Also import `catchError`

const POKE_API = 'https://pokeapi.co/api/v2/pokemon/';

const name = new BehaviorSubject('charizard');
name.pipe(
  switchMap(name => ajax.getJSON(POKE_API + name + '/')),
/*!*/  catchError(() => of({                                    // --> So when there is an error ...
/*!*/    name: 'unknown',                                       // --> ... Return an `unknown` Pokemon ...
/*!*/    abilities: []                                          // --> ... With no abilities.
/*!*/  }))
).subscribe(d => 
  console.log(
    `${d.name}:: ` + 
    `${d.abilities.map(a => a.ability.name).join(', ')}`
  )
);
```

> :Buttons
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-pokemon-1?devtoolsheight=100

Now lets run it against our failing test case again:

```js
setTimeout(() => name.next('snorlax'), 1000);     // --> snorlax info is fetched
setTimeout(() => name.next('ZZZ'), 1000);         // --> ZZZ does not exist
setTimeout(() => name.next('eevee'), 3000);       // --> eevee info is also not fetched!

// Result:
// > charizard:: solar-power, blaze
// > snorlax:: gluttony, thick-fat, immunity
// No more logs
```

<br>

We get the `unknown::` log, which means we are catching the error and handling it.
However, we are still not getting any response to `'eevee'`. Why is that?

First, lets recall what **RxJS** pipes are:

> A `pipe` is simply a function that transforms one `Observable` to another. \
> `x.pipe(a, b, c)` is basically equivalent to
> ```js
> y = x.pipe(a);
> z = y.pipe(b);
> w = z.pipe(c);
> ```

So this code:

```js
name.pipe(switchMap(...), catchError(...)).subscribe(...)
```

is basically equivalent to this code:

```js
x = name.pipe(switchMap(...))
y = x.pipe(catchError(...))
y.subscibe(...)
```

Or this code:

 ```js
 x = switchMap(...)(name);
 y = catchError(...)(x);
 y.subscribe(...);
```

When you subscribe to `y`, it internally subscribes to `x` and passes down values it receives
from that _inner subscription_ to your _outer subscription_.

When an error occurs in that _inner subscription_, it will naturally _terminate_.

However, `catchError()` wants to maintain the _outer subscription_, so it calls the
factory function you provide it (`() => of(...)` in this case), and creates
another _inner subscription_ to the result of this function (which should have returned an observable),
now feeding the _outer subscription_ from this new _inner subscription_.

In other words, what happens here is:

```js
name.pipe(
  switchMap(name => ajax.getJSON(POKE_API + name + '/')),
  catchError(() => of({
    name: 'unknown',
    abilities: []
  }))
).subscribe(...);

setTimeout(() => name.next('snorlax'), 1000);
setTimeout(() => name.next('ZZZ'), 1000);
setTimeout(() => name.next('eevee'), 3000);
```

1. You are originally subscribed to `name` (and the `switchMap()`) via `catchError()`.

1. `name` emits `'ZZZ'`, `switchMap()` throws an error, the _inner subscription_ to it is terminated.

1. To mitigate, `catchError()` calls `() => of(...)` to create a new _inner subscription_ as the source
of your _outer_ subscription.

1. Now you are basically subscribed to `of(...)` which _emits once and terminates_. \
  Note that at this point, _YOU ARE NO LONGER SUBSCRIBED TO `name`_.

1. `name` doesn't even emit `'eevee'` as there are no subscriptions to emit to.


> :Space

## Why So Weird?

This might seem confusing and weird, however this is _exactly how normal functions would behave_.
Basically, `catchError()` would be a function like this if we were working with normal functions
instead of observables:
```js
function catchError(handlerFactory) {
  return function(ogFunc) {
/*!*/    return (...args) => {                       // --> the outer function call (like the outer subscription)
/*!*/      try {
/*!*/        return ogFunc(...args);                 // --> the inner function call (like the inner subscription)
/*!*/      } catch(error) {
/*!*/        return handlerFactory(error)(...args);  // --> the replacement inner function call (like the replacement inner subscription)
/*!*/      }
/*!*/    }
  }
}
```
> :Tabs
> > :Tab title=Normal Functions
> > ```js
> > x = function() { ... };       // --> the original function
> > y = catchError(...)(x);       // --> the catchError pipe
> > y(...);                       // --> the function call
> > ```
>
> > :Tab title=Observables
> > ```js
> > x = ...                       // --> the original observable
> > y = catchError(...)(x);       // --> the catchError pipe
> > y.subscribe(...);             // --> the subscription
> > ```

The difference however, is that from a normal function, we only expect _ONE_ value.
So in case of error, we can simply replace it with another _ONE_ value.

Observables on the other hand, can (and are expected to) _push multiple values_.
In our case, we literally expect our subscription to keep getting values in response to
future events, while we are replacing it with a _one-off_ subscription (to `of(...)`).

---

# The Fix

A neat solution would be to conduct the error handling closer to its source.

In our example, this source (fortunately) is not the long-living subscription to `name` itself,
but rather the short-living _one-off_ subscriptions to `ajax.getJSON(...)` that we
create for every emission of `name`.

Because these subscriptions are supposed to be short-lived themselves (each one is supposed
to respond with _ONE_ value), we can safely replace them with another _one-off_ subscription
in case of error:

```js
name.pipe(
  switchMap(
/*!*/    name => ajax.getJSON(POKE_API + name + '/').pipe(                 // --> so `catchError()` is directly piped to `ajax.getJSON()`
/*!*/      catchError(() => of({                                           // --> so `catchError()` is directly piped to `ajax.getJSON()`
/*!*/        name: 'unknown',                                              // --> so `catchError()` is directly piped to `ajax.getJSON()`
/*!*/        abilities: []                                                 // --> so `catchError()` is directly piped to `ajax.getJSON()`
/*!*/      }))                                                             // --> so `catchError()` is directly piped to `ajax.getJSON()`
/*!*/    )                                                                 // --> so `catchError()` is directly piped to `ajax.getJSON()`
  ),
).subscribe(d => 
  console.log(
    `${d.name}:: ` + 
    `${d.abilities.map(a => a.ability.name).join(', ')}`
  )
);
```

> :Buttons
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-pokemon-2?devtoolsheight=100

<br>

Now this sequence would behave like this in our test case:

```js
setTimeout(() => name.next('snorlax'), 1000);
setTimeout(() => name.next('ZZZ'), 1000);
setTimeout(() => name.next('eevee'), 3000);

// Result:
// > charizard:: solar-power, blaze
// > snorlax:: gluttony, thick-fat, immunity
// > unknown::
// > eevee:: anticipation, adaptability, run-away
```

---

# Retrying

What about situations where the source of the error **IS** a _long-living_ subscription?

In that case, when our long living subscription terminates due to an error, we could actually
replace it by another subscription to the same long living observable.

The `retry()` operator does exactly that:

```js
import { ajax } from 'rxjs/ajax';
import { BehaviorSubject } from 'rxjs';
/*!*/import { switchMap, retry } from 'rxjs/operators';      // --> Now we are importing `retry` as well

const POKE_API = 'https://pokeapi.co/api/v2/pokemon/';

const name = new BehaviorSubject('charizard');
name.pipe(
  switchMap(name => ajax.getJSON(POKE_API + name + '/')),
/*!*/  retry(),                                              // --> In case of error, simply retry
).subscribe(d => 
  console.log(
    `${d.name}:: ` + 
    `${d.abilities.map(a => a.ability.name).join(', ')}`
  )
);
```

> :Buttons
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-pokemon-3?devtoolsheight=100

<br>

> [touch_app](:Icon) **FUN FACT**
>
> You could actually replicate behavior of `retry()` using `catchError()`:
> ```js
> function myRetry(observable) {
>   return observable.pipe(catchError(() => myRetry(observable)));
> }
> ```
> ```js
> name.pipe(switchMap(...), myRetry).subscribe(...);
> ```

<br>

On the first glance, this approach seems to cleanly solve our issue:

```js
setTimeout(() => name.next('snorlax'), 1000);
setTimeout(() => name.next('ZZZ'), 1000);
setTimeout(() => name.next('eevee'), 3000);

// > charizard:: solar-power, blaze
// > snorlax:: gluttony, thick-fat, immunity
// > eevee:: anticipation, adaptability, run-away
```

<br>

However, if we add a console log before each request, we can see that we are actually messing up pretty terribly:

```js
name.pipe(
/*!*/  tap(value => console.log(`REQUEST FOR ${value}`)),
  switchMap(name => ajax.getJSON(POKE_API + name + '/')),
  retry(),
).subscribe(...);
```

```js
setTimeout(() => name.next('snorlax'), 1000);
setTimeout(() => name.next('ZZZ'), 1000);
setTimeout(() => name.next('eevee'), 3000);

// > REQUEST FOR charizard
// > charizard:: solar-power, blaze
// > REQUEST FOR snorlax
// > snorlax:: gluttony, thick-fat, immunity
// > REQUEST FOR ZZZ
// > REQUEST FOR ZZZ
// > REQUEST FOR ZZZ
// > REQUEST FOR ZZZ
// > REQUEST FOR ZZZ
// > REQUEST FOR ZZZ
// ...
// ... about 100 times or more
// ...
// > REQUEST FOR ZZZ
// > REQUEST FOR ZZZ
// > REQUEST FOR ZZZ
// > REQUEST FOR eevee
// > eevee:: anticipation, adaptability, run-away
```

> :Space

## Re-Subscription Loop

_What happened?_ 

Well, everytime our `ajax.getJSON(...)` subscription fails, `retry()` will re-subscribe
to its previous observable, which means it is indirectly re-subscribing to `name` as well. 

`name` is a `BehaviorSubject`, which means when you subscribe to it, it will immediately emit its latest value to you,
which in this case is `'ZZZ'`. 

As a result, immediately after each time we get an error, we re-subscribe
to `name`, get `'ZZZ'` again, make a request for it, fail, and repeat this cycle.

Note that after about one second, `'eevee'` is emitted by `name`, which will take us out of this loop. If it wasn't
for that emission, we would be stuck in this loop indefinitely.

> :Space

## Breaking the Loop

To break out of this cycle, we can use `retryWhen()` instead of `retry()`:

```js
name.pipe(
  tap(x => console.log(`REQUEST FOR ${x}`)),
  switchMap(name => ajax.getJSON(POKE_API + name + '/')),
/*!*/  retryWhen(() => name),                             // --> using `retryWhen()` instead of `retry()`
).subscribe(...);
```

> :Buttons
> > :Button label=Try It!, url=https://stackblitz.com/edit/rxjs-pokemon-4?devtoolsheight=100

`retryWhen()` basically retries _when_ the observable returned by the function passed to it 
emits its next value. In our case, this means we will retry (re-subscribe) _when_ `name` emits
a value:

```js
setTimeout(() => name.next('snorlax'), 1000);
setTimeout(() => name.next('ZZZ'), 1000);
setTimeout(() => name.next('eevee'), 3000);

// > REQUEST FOR charizard
// > charizard:: solar-power, blaze
// > REQUEST FOR snorlax
// > snorlax:: gluttony, thick-fat, immunity
// > REQUEST FOR ZZZ
// > REQUEST FOR ZZZ
// > REQUEST FOR eevee
// > eevee:: anticipation, adaptability, run-away
```

Note that `'ZZZ'` is still being tried two times. That is because when the first try
causes an error, `retryWhen()` subscribes to `name` as its notifier, which immediately
emits `'ZZZ'` once more, causing the second try.

<br>

Alternatively, we could keep using `retry()` and make name a `Subject` instead of a `BehaviorSubject`. 
In that case, it would emit each value _only once_ and _to subscriptions present at the time_,
so when we re-subscribe to it after an error, we won't get the problematic value again:

```js
/*!*/const name = new Subject();
name.pipe(
  tap(x => console.log(`REQUEST FOR ${x}`)),
  switchMap(name => ajax.getJSON(POKE_API + name + '/')),
/*!*/  retry(),
).subscribe(...);
```

```js
setTimeout(() => name.next('snorlax'), 1000);
setTimeout(() => name.next('ZZZ'), 1000);
setTimeout(() => name.next('eevee'), 3000);

// > REQUEST FOR snorlax
// > snorlax:: gluttony, thick-fat, immunity
// > REQUEST FOR ZZZ
// > REQUEST FOR eevee
// > eevee:: anticipation, adaptability, run-away
```

> [warning](:Icon) **CAREFUL THOUGH ...**
>
> Using `retryWhen()` in combination with `Subject` wouldn't actually work:
> ```js
> /*!*/const name = new Subject();
> name.pipe(
>  tap(x => console.log(`REQUEST FOR ${x}`)),
>  switchMap(name => ajax.getJSON(POKE_API + name + '/')),
> /*!*/ retryWhen(() => name)
>).subscribe(...)
> ```
> This is due to the fact that we do not re-subscribe until `name` emits another value after the
> problematic `'ZZZ'`. The next value is `'eevee'`, so we retry (re-subscribe) _AFTER_ it was
> emitted, meaning that we would basically miss it.

---

> :Author src=github

<br>

> :DarkLight
> > :InDark
> > 
> > _Hero Image by [Sebastian Herrmann](https://unsplash.com/@herrherrmann) from [Unsplash](https://unsplash.com)._
>
> > :InLight
> >
> > _Hero Image by [Mitchell Luo](https://unsplash.com/@mitchel3uo) from [Unsplash](https://unsplash.com)._

> :MetaOverride target=description
>
> A deep-dive in error-handling in RxJS, its solutions, pitfalls, etc.

> :MetaOverride target=keywords, behavior=extend
>
> RxJS, error handling, observable, streams, errors, reactive extensions, retry, try and catch