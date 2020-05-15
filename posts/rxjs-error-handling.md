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

Take this **RxJS** snippet, which logs the list of abilities of each given Pokemon to the console:

```js
import { ajax } from 'rxjs/ajax';                      // @see [RxJS](https://learnrxjs.io)
import { BehaviorSubject } from 'rxjs';                // @see [RxJS](https://learnrxjs.io)
import { switchMap } from 'rxjs/operators';            // @see [RxJS](https://learnrxjs.io)

const POKE_API = 'https://pokeapi.co/api/v2/pokemon/';

/*!*/const name = new BehaviorSubject('charizard');                      // --> Represents the name of the Pokemon
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

How can we use it? Well for example we can manually feed names into `name` subject:

```js
setTimeout(() => name.next('snorlax'), 1000);      // --> Let's have a timeout so data is requested one by one
setTimeout(() => name.next('eevee'), 3000);        // --> Let's have a timeout so data is requested one by one

// Result:
// > charizard:: solar-power, blaze
// > snorlax:: gluttony, thick-fat, immunity
// > eevee:: anticipation, adaptability, run-away
```

Or we can for example bind the `name` subject to an HTML input so that we get an interface
for our nice console tool:

```jsx
import { Renderer } from '@connectv/html';      // @see [CONNECTIVE HTML](https://github.com/CONNECT-platform/connective-html)

const renderer = new Renderer();                            // --> The `Renderer` class helps us render HTML elements
renderer.render(<input _state={name}/>).on(document.body);  // --> Render an input whose state is bound to `name`
```

<br>

Either way, what happens when we accidentally feed `name` a non-existing Pokemon name?

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

_Well thats not good ..._

---

# Naive Error Handling

Well we didn't have any measures for error-handling in our code, so it is not
surprising that an error caused it to malfunction. If it was imperative programming,
we would simply enclose the whole thing in a `try { ... } catch { ... }` block,
so lets do the **RxJS** equivalent of that:

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

We got the `unknown::` message for `ZZZ`, but still didn't get information on `eevee`.
What went wrong?

---

# In Depth Look

To understand what went wrong, we should re-iterate on the concept of `Observable`s again:

> An `Observable` is sorta-kinda like a function. To be more precise, its like a _push_
> function that generates multiple values (according to [**Rxjs**'s docs](https://rxjs-dev.firebaseapp.com/guide/observable)).

In contrast, a normal function is a _pull_ function that generates one value.

Now if an `Observable` is like a function, then a `Subscription` is basically like a particular
function call:

```js
name.pipe(switchMap(name => ajax.getJSON(POKE_API + name + '/')))   // --> This is the `Observable`, or the function
/*!*/.subscribe(d =>                                                     // --> This is the `Subscription`, or the function call
/*!*/  console.log(                                                      // --> This is the `Subscription`, or the function call
/*!*/    `${d.name}:: ` +                                                // --> This is the `Subscription`, or the function call
/*!*/    `${d.abilities.map(a => a.ability.name).join(', ')}`            // --> This is the `Subscription`, or the function call
/*!*/  )
/*!*/);
```

> When an unhandled error happens in a function call, that particular function call terminates.
> Similarly, when an unhandled error happens in a `Subscription`, that `Subscription` terminates.

So in our first example, we basically had _ONE_ subscription to `name.pipe(...)`, so
when an error occured in it, that subscription terminated:

```js
setTimeout(() => name.next('snorlax'), 1000);
setTimeout(() => name.next('ZZZ'), 1000);
setTimeout(() => name.next('eevee'), 3000);
```

1. `name` emits `'charizard'`, its initial value, so our subscription receives charizard's info from API.

1. `name` emits `'snorlax'`, so our subscription receives snorlax's info from API.

1. `name` emits `'ZZZ'`, and our subscription receives an error and _terminates_.

1. `name` doesn't even emit `'eevee'` because there are no subscriptions to emit to.

> :Space

## The `catchError()` issue

_But what about our naive error handling?_

Well, to understand that better, we need to recall what **RxJS** pipes are really:

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

> [touch_app](:Icon) **FUN FACT**
>
> You could also literally rewrite that code like this:
> ```js
> x = switchMap(...)(name);
> y = catchError(...)(x);
> y.subscribe(...);
>```

When you subscribe to `y`, it internally subscribes to `x` and passes down those values.
When an error occurs in that internal subscription, it will _terminate_, which, if you were directly
subscribed to `x`, would mean your subscription would _terminate as well_. 

However, in that case,
`catchError()` will call the function you provided it, and re-subscribe to the `Observable` it returns,
maintaining your subscription while feeding it from the new `Observable` (the new internal subscription
to that `Observable`).

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

1. When `name` emits `'ZZZ'`, the `switchMap()` throws an error, and your subscription to it is _terminated_.

1. To mitigate, `catchError()` calls `() => of(...)` to create a new internal subscription as the source
of your subscription.

1. Now you are basically subscribed to `of(...)` which _emits once and terminates_.

1. `name` doesn't even emit `'eevee'` cause there are no subscriptions to emit to.

---

# The Fix

Well the fix is pretty context-based. For this particular example, our error is actually
caused by short-lived observables created by `switchMap()`. Basically for each name, a new observable is created using `ajax.getJSON(...)` 
and it is subscribed to internally and discarded when a new emission comes from `name`.

So in case of error, we can safely switch that inner-subscription with one to a _one-off observable_ such as `of()`,
since _terminating_ that inner-subscription doesn't affect our long-term subscription to `name` (for each emission
of `name` we are creating a new inner-subscription, via `switchMap()`):

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

> [touch_app](:Icon) **SIDE NOTE**
>
> Note that this solution works seamlessly for our particular case
> becase the source of the error is an inner-observer (inner-subscription)
> that is _one-off_ as well (it is supposed to emit one value and _terminate_).
>
> Combined with the fact that `switchMap()` ensures we are maintaining
> only one such subscription at any given time, replacing the errorneous subscription
> with one to an `of()` is pretty safe.
>
> However, if for some reason we were using `mergeMap()` alongside longer-living
> inner-subscriptions, then replacing one with a _one-off_ subscription might have
> caused additional side-effects.

---

# Retrying

What if, in our naive approach, instead of replacing the erroneous subscription with
a short-living one, we just replaced it with another subscription to the same observable?

Well **RxJS** provides the `retry()` operator exactly for that purpose:

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

However if we were to add a console log before each request, we would realize that we are actually messing up pretty terribly:

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

_What happened?_ Well, everytime our `ajax.getJSON(...)` subscription fails, `retry()` will re-subscribe
to its previous observable, which means it is indirectly re-subscribing to `name` as well. `name`
is a `BehaviorSubject`, which means when you subscribe to it, it will immediately emit its latest value to you,
which in this case is `'ZZZ'`. 

As a result, immediately after each time we get an error, we re-subscribe
to `name`, get `'ZZZ'` again, make a request for it, fail, and repeat this cycle.

However, after about one second, `'eevee'` is emitted by `name`, which will take us out of this loop. If it wasn't
for that emission, we would be stuck in this loop indefinitely.

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

> :Space

## Breaking the Loop

To break out of this cycle, we could use `retryWhen()` instead of `retry()`:

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

We could also make name a `Subject` instead of a `BehaviorSubject`. In that case,
it would emit each value _only once_ and _to subscriptions present at the time_,
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

> [touch_app](:Icon) **SIDE NOTE**
>
> Note that using `retryWhen()` in combination with `Subject` wouldn't actually work:
> ```js
> const name = new Subject();
> name.pipe(
>  tap(x => console.log(`REQUEST FOR ${x}`)),
>  switchMap(name => ajax.getJSON(POKE_API + name + '/')),
>  retryWhen(() => name)
>).subscribe(...)
> ```
> This is due to the fact that we do not re-subscribe until `name` emits another value after the
> problematic `'ZZZ'`. The next value is `'eevee'`, however because we are re-subscribing after
> it was emitted, we will not get it in our sequence.

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