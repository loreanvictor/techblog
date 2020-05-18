> :Hero src=https://images.unsplash.com/photo-1518016491499-75f85ea4c86d?w=1993&h=600&fit=crop, \
> target=desktop, leak=256px, mode=light

> :Hero src=https://images.unsplash.com/photo-1518016491499-75f85ea4c86d?w=1200&h=600&fit=crop, \
> target=mobile, leak=96px, mode=light

> :Hero src=https://images.unsplash.com/photo-1536382846503-832f3d8c7742?w=1993&h=600&fit=crop, \
> target=desktop, leak=256px, mode=dark

> :Hero src=https://images.unsplash.com/photo-1536382846503-832f3d8c7742?w=1993&h=600&fit=crop, \
> target=mobile, leak=96px, mode=dark

> :PageHead lead=Yet Another Frontend Framework, shadow=0 0 8px #000000ee, color=white
>
> Part 1: Why?

> :Space space=128px, target=desktop

# TLDR;

- Implicit DOM update mechanisms of current frameworks are an overhead,
- They also take control away from the developer,
- It is pretty easy to explicitly define the change propagation flow using tools like [**RxJS**](https://learnrxjs.io),
- So the compromises of our current tools become unnecessary.

<br><br><br>

# The Status Quo

Look at a simple React counter:

```jsx
import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';


function Timer() {
/*!*/  const [count, setCount] = useState(0);                            // --> create a state
/*!*/  useEffect(() => {                                                 // --> after each render
/*!*/    const interval = setTimeout(() => setCount(count + 1), 1000);   // --> set a timeout to update the state
/*!*/    return () => clearTimeout(interval);                            // --> and clean the timeout as well
/*!*/  });
/*!*/
/*!*/  return <div>You have been here for {count} seconds!</div>
}

render(<Timer/>, document.body);
```

> :Buttons
> > :Button label=Try It, url=https://stackblitz.com/edit/react-hook-timer?file=index.js

What happens here is:
> - React will invoke the function `Timer()`.
>   - In that function, first a state is created using `useState()`, with a setter function also returned, `setCount()`.
> 
>   - Then, an _effect_ is set-up, which will invoke that `setCount()` after a second of it being called.
> 
>   - Finally, a `div element` is created and returned, which contains the value of the state created earlier, initially set to `0`.
> 
> - React will render this element, and invoke the _effect_ provided via `useEffect()` afterwards.
>   - The _effect_ invokes `setCounter()` providing a new value for our state. 
> 
>   - This triggers React to call the `Timer()` function again. 
> 
>   - However this time, the `useState()` function returns a different result, because React is keeping track of the order of what is being
>      called by who.
> 
>   - A new effect is setup (and the old one is cleaned up though not precisely at this time).
> 
>   - A new `div element` is created and returned, containing the new value of our state.
> 
> - React, instead of rendering the new element to the actual DOM, renders it to a virtual DOM, compares that virtual DOM
>   with the actual DOM, and applies the diffs.
>   - Also afterwards, it will invoke the newly defined effect, which will continue the cycle.

Why this convoluted process, you might ask? Well, we wanted to be able to define
the visual representation of our counter, i.e. the `div element`, in a simple and expressive manner:

```jsx
<div>You have been here for {count} seconds!</div>
```

But the variable `count`'s value changes, so we need to track those changes and mirror it
in the visual representation, hence this overhead. 

In other words, `count` is a _reactive value_, i.e. its value changes in reaction to stuff
(e.g. passage of time), and React needs to go through all of that trouble to be able to _mask that reactivity away_.

---

# The Problem

The problem with this convoluted process is sort of obvious: Too much complexity.
React has to go through all of this to mask the reactivity, as evident from this extremely
simple example, causing the following issues:

<br>

## Overhead
In our example, React needs to execute all of the described process _each second_. The
component code (i.e. the `Timer()` function) is being executed _every second_. A virtual DOM
is created and compared to the actual DOM _every second_. 

Now this is not a problem for a fair number of cases. A lot of the time, the data-flow of your
frontend code is not much more complicated than a simple timer. In such situations, React is, to quote
[Dan Abramov, _fast enough_](https://twitter.com/dan_abramov/status/842329893044146176?lang=en). But quite
naturally, if the data-flow complexity grows, it can easily fail to catch up.

<br>

## Control
Because of the complexity of the process, it is also pretty fragile. Which means there are a lot of stuff
that you cannot do, or you would basically broke that process.

For example, run the code snippet from earlier, and you'll see React issuing this warning:

```
Warning: render(): Rendering components directly into document.body is discouraged, 
since its children are often manipulated by third-party scripts and browser extensions. 
This may lead to subtle reconciliation issues. Try rendering into a container element 
created for your app.
```

This is simply because React needs to maintain full control over the DOM-tree it renders the components
to for all of the life-cycle of the component, as otherwise it might not be able to properly
compare the Virtual DOM and the actual one.

Similarly, React needs to be able to keep track of your component's states and hooks, so
`useState()` and `useEffect()` functions become rather weird ones: You cannot use them inside
a condition or a loop, or they might break not only the functionality of your component, but also
other components that React is handling.

<br>

Note that these are natural, unavoidable compromises in exchange for _masking the reactivity_.
So **IF** it was the case that directly dealing with the reactive nature of our timer was a really hard thing to do,
then it would make sense to adopt such a convoluted process and deal with its cons as well.

And when React was created, that indeed was the case. But is it still?

<br>

> [info](:Icon) **ABOUT OTHER FRAMEWORKS**
>
> So for this piece I picked React as a point of comparison. But the essential problems
> mentioned here are inherent to ALL well-known frameworks, as they are all
> designed around the idea of _masking the reactivity_.
>
> For example, Angular avoids using a virtual DOM and is generally faster than React.
> Its solution is basically recalculating scope variables upon a huge number of events
> (e.g. it outright overrides browser's `setTimeout()` function to hook into it)
> and then applying the necessary changes accordingly.
>
> And while that similarly works fine for simpler situations, Angular is basically
> trading a lot of the already limited control you would have with React for some marginal
> performance gain. Ironically, that strategy quickly backfires as it is much harder
> to optimize Angular's change detection in cases where you've got pretty complicated data-flows.

---

# The Alternative

Let's take a deeper look at the nice representation we want to achieve that causes so much trouble:

```jsx
<div>You have been here for {count} seconds!</div>
```

This expression is basically describing the following DOM (sub-)tree:

```
DIV
| --- TEXT:: You have been here for
| --- VAR:: {count}
| --- TEXT:: seconds!
```

If all of the child nodes of DIV were TEXT nodes (or other HTML nodes), then we could simply
use the browser's own APIs to render our `<div>`. However, `count` is a variable that changes over time.
How should it be handled? 

<br>

React's solution basically boils down to this:

- Mask `count` as a plain integer in the component scope
- Track its changes via `setCount()` setter function
- Re-run the component code everytime `count` changes, recalculating the sub-tree
- Diff the new tree with the previously rendered one to avoid unnecessary DOM manipulations

<br>

But what if instead of masking `count`'s reactive nature, we represent it with a proper reactive entity, e.g.
[**RxJS**'s Observables](https://rxjs-dev.firebaseapp.com/guide/observable)?

Well, if `count` was an Observable instead of a plain integer, we could simplify its rendering process:

- Create (and render) a TEXT node for `count`
- Subscribe that TEXT node to `count` \
  i.e. Update the contents of that TEXT node whenever `count` emits.

<br>

With this solution, we would not need to re-run the component code everytime `count`'s value changes. In fact,
we would need to execute the component code **exactly once**.

Additionally, we would not need to _diff_ the returned sub-tree with what is already rendered. We already are changing
the only place in the DOM tree that needs to change (the text content of the TEXT node we created for `count`).

<br>

Look at this modified, hypothetical code:

```jsx
import { render } from 'yet-another-frontend-framework';
import { BehaviorSubject } from 'rxjs';


function Timer() {
/*!*/  const count = new BehaviorSubject(0);                        // --> create an Observable
/*!*/  setInetrval(() => count.next(count.value + 1), 1000);        // --> emit its next value on an interval
/*!*/
/*!*/  return <div>You were here for {count} seconds!</div>;
}

render(<Timer/>, document.body);
```

> :Buttons
> > :Button label=Try the Actual Version, url=https://stackblitz.com/edit/connective-html-timer-1?file=index.tsx

Now our rendering process becomes:

> - Call the `Timer()` function
>   - It creates an Observable, `count`
>
>   - It sets up an interval, emitting the next value for `count` each second
>
>   - It returns the `div element`, which contains a TEXT node subscribed to `count`
>
> - Render that `div element` on the document.

<br>

Quite simple, isn't it?

This simple process is not just potentially much faster (less calculations), it is 
also much more stable and flexible due to its inherent simplicity. There is no virtual DOM,
and the component is rendered exactly once, so you can easily mess with all parts of the DOM
without breaking anything, which in turn brings high levels of integratibility for your
components.

Additionally, as the component code is only executed once, there is no need to keep track
of any state or hook, so you do not have the weird and easy-to-break machinery of React hooks.
I mean, you can even bring the whole process out of the scope of any component and gain
the same result:

```jsx
import { render } from 'yet-another-frontend-framework';
import { BehaviorSubject } from 'rxjs';


/*!*/const count = new BehaviorSubject(0);                        // --> create an Observable
/*!*/setInetrval(() => count.next(count.value + 1), 1000);        // --> emit its next value on an interval
/*!*/render(<div>You were here for {count} seconds!</div>, document.body);
```

<br>

To top it off, lets even use **RxJS**'s own `timer()` function which directly gives
us an Observable emitting values each second:

```jsx
import { render } from 'yet-another-frontend-framework';
import { timer } from 'rxjs';


/*!*/render(<div>You have been here for {timer(0, 1000)} seconds!</div>, document.body);
```

> :Buttons
> > :Button label=Try the Actual Version, url=https://stackblitz.com/edit/connective-html-timer

---

# Recap and The Journey Ahead ...

So to recap:

- Current frameworks and tools are designed around _masking reactivity_,
  - In exchange for performance
  - In exchange for control

- It is actually easy to do reactive logic using modern tools such as **RxJS**
- Which means there is no need for those compromises.

So with this reasoning, I embarked on creating _yet another frontend framework_ (or library).
You can checkout the result [here](https://github.com/CONNECT-platform/connective-html). The library
itself is pretty young, and in dire need of testing, benchmarking and optimization. But it has
already helped me a lot with my frontend efforts (for example it powers these blogs and all oss documentation
that I do through [**CODEDOC**](https://codedoc.cc)).

If you enjoyed this piece, stay tuned for upcoming parts where we'll go through
the story of how it was designed and created!

---

> :Author src=github

<br>

> :DarkLight
> > :InLight
> >
> > _Hero Image by [Wendy Scofield](https://unsplash.com/@gypsycompassrose) from [Unsplash](https://unsplash.com)._
>
> > :InDark
> >
> > _Hero Image by [Hafidh Satyanto](https://unsplash.com/@hafidhsatyanto) from [Unsplash](https://unsplash.com)._

> :ToCPrevNext prev=false

> :MetaOverride target=description
>
> Short-comings of React and other frontend frameworks, i.e. why CONNECTIVE HTML was created.

> :MetaOverride target=keywords, behavior=extend
>
> React, Angular, Frontend, reactive, RxJS, performance, overhead, React Hooks, web design, javascript, JSX