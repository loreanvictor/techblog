> :Hero src=https://images.unsplash.com/photo-1560075370-f3a7718a5e75?w=1993&h=600&fit=crop, \
> target=desktop, leak=256px, mode=dark

> :Hero src=https://images.unsplash.com/photo-1560075370-f3a7718a5e75?w=1200&h=600&fit=crop, \
> target=mobile, leak=96px, mode=dark

> :Hero src=https://images.unsplash.com/photo-1518514491163-911fee1b725c?w=1993&h=600&fit=crop, \
> target=desktop, leak=256px, mode=light

> :Hero src=https://images.unsplash.com/photo-1518514491163-911fee1b725c?w=1200&h=600&fit=crop, \
> target=mobile, leak=96px, mode=light

> :Title lead=Yet Another Frontend Framework, color=white, shadow=0 0 20px black
>
> Part 2: JSX

> :Space space=128px, target=desktop

# Previously ...

So in [part 1](/yaff/part1), I described why I decided to embark on coding _yet another frontend framework_.
If you haven't checked it out, I highly recommend reading it first, as it outlines our goals for
this (and subsequent parts).

> :ArticleCard src=/yaff/part1

---

# The Question

The most essential part of any frontend framework is describing the frontend elements (_duh_), which
in our case means HTML trees. While HTML itself is a really appropriate syntax for describing those trees (_again, duh_),
its own syntax does not support incorporation of a separate data-source, which is essential for creating dynamic
UIs.

So, to get started with our awesome _Yet Another Frontend Framework_, we need an easy way of describing
HTML imbued with dynamic data. Additionally our solution should be:

- Composable and extensible \
  i.e. it doesn't unnecessarily limit you, \
  i.e. you can re-use stuff,

- Pretty easy to learn

---

# Templating

The classic answer to that question is **templating**. If you don't know what templating is,
think of it as an HTML file with some holes (called a _template_). You can fill those holes
with your data, getting a final, static HTML the browser can display.

For example, this is an HTML template:

```html
<div>Hellow {{ name }}!</div>
```

Now if you combine it with

```js
{ name: 'World' }
```

You get

```html
<div>Hellow World!</div>
```

<br>

If you have ever seen [Angular](https://angular.io/tutorial/toh-pt1#show-the-heroescomponent-view),
[Vue.js](https://vuejs.org/v2/guide/#Declarative-Rendering), or [Svelte](https://svelte.dev),
they are all based on templating, using actually pretty similar templating syntax:

> :Tabs
> > :Tab title=Angular
> > ```html
> > <div>Hellow {{name}}!</div>
> > ```
>
> > :Tab title=Vue.js
> > ```html
> > <div>Hellow {{name}}!</div>
> > ```
>
> > :Tab title=Svelte
> > ```html
> > <div>Hellow {name}!</div>
> > ```

<br>

There are a wide variety of templating languages out there, but to keep the chase short,
let's just go ahead with [Nunjucks](https://mozilla.github.io/nunjucks/)'s syntax:

- Its mostly HTML, so relatively easy to learn

- It allows for template re-use, and custom filters, which means it also satisfies our
  composability and extensibility requirements.

> We are not going to actually use Nunjucks, since it is designed for rendering HTML strings
> while we need to create our elements using DOM APIs, as [discussed in part 1](/yaff/part1#the-alternative).
> We are just going to assume a templating solution with Nunjuck's syntax.

With such a design, our sample timer code from part 1 would look like this:

> :Tabs
> > :Tab title=timer.js
> > ```ts | timer.js
> > import { render, fromTemplate } from 'yet-another-frontend-framework';
> > import { timer } from 'rxjs';
> >
> > render(
> >   fromTemplate(
> >     'timer.html',              // @see tab:timer.html
> >     { count: timer(0, 1000 )}
> >   ), 
> >   document.body
> > );
> > ```
>
> > :Tab title=timer.html
> > ```html | timer.html
> > <div>You have been here for {{count}} seconds!</div>
> > <!-- thats it folks! -->
> > ```

---

# Issues With Templating

Before going through the practical issues with templating, lets get the philosophical discussion out
of the way. The main argument in favor of templating vs non-templating solutions (i.e. language
extensions such as JSX), is [Rule of Least Power](https://en.wikipedia.org/wiki/Rule_of_least_power).

Simply put, the rule says _web stuff_ should be described using the _least powerful_ description
syntax possible (to avoid unnecessarily complicating it). 
The argument then goes: _HTML trees imbued with data_ are _web stuff_, 
and Javascript is in the most powerful class of languages, so we should avoid using it for
describig HTML trees and instead use a less powerful but _powerful enough_ syntax.

While the rule itself is a respectible sentiment that I personally subscribe to, it is hard to
pin-point what does _powerful enough_ mean, at least for our use case. For example, all of the frameworks and templating
tools described above have given up on stringently enforcing that limitation, by supporting
custom filters and arbitrary Javascript functions.

So instead of delving into such hypothetical musings of what should things be idealistically,
lets focus on how things do work with different solutions and how does that look like in practice:


> :Space

## Parallel Module Resolution

In the example code above, we are referring to `timer.html`:

```js
render(
  fromTemplate(
/*!*/    'timer.html',
    { count: timer(0, 1000 )}
  ), 
  document.body
);
```

Since we want our templates to be re-usable, we must also be able to refer (and include) templates
from within templates as well:

```html
{% include 'some-other.html' %}
```

This simply means we are introducing another module system to our framework (alongside Javascript's) with
its own module resolution strategy. This problem is further compounded by the fact that we need to (somehow) 
include Javascript functions within our templates as well (to satisfy the extensibility requirement).

We can of-course shift this additional complexity from our code
to our tool-chain, for example using some Webpack loaders, but the complexity is still there, now in form
of tool-chain the framework is dependent on.

> :Space

## Unclear Separation

A 'pro' of templating is that it separated the _view_ from the _logic_. However, that separation is not
as clear-cut as some like to believe. For example, imagine we want to display a text that alters between `Even`
and `Odd` every second:

> :Tabs
> > :Tab title=alter.js
> > ```ts | alter.js
> > import { render, fromTemplate } from 'yet-another-frontend-framework';
> > import { timer } from 'rxjs';
> > import { map } from 'rxjs/operators';
> >
> > render(
> >   fromTemplate(
> >     'alter.html',              // @see tab:alter.html
> >     { parity: timer(0, 1000).pipe(map(x => x % 2 === 0 ? 'Even' : 'Odd')) }
> >   ),
> >   document.body
> > );
> > ```
>
> > :Tab title=alter.html
> > ```html | alter.html
> > <div>{{parity}} seconds have passed since you've been here!</div>
> > <!-- thats it folks! -->
> > ```

It looks like the strings `'Even'` and `'Odd'` are _view stuff_ that belong to `alter.html`,
but we would need to make this code much more complicated to move them there.

Also, its not clear whether the `x % 2 === 0` part is _view_ or _logic_.
The separation brings a constant cognitive burden of deciding what is _view_ and what is
_logic_ when writing code, or makes it hard to find something when debugging, because you
do not know whether the person who wrote the code thought of it as _view_ or as _logic_.

> :Space

## Unclear Scope

Ok what if there is a typo in the template, e.g. writing `counter` instead of `count`?

```html
/*!*/<div>You have been here for {{counter}} seconds!</div> <!--> ERRR, counter is not defined? -->
```

Well the default Javascript linter doesn't provide any hints by default,
so best case scenario I will get an error for this after I've written the template and executed it.
Furthermore, when I'm consuming the template in Javascript, I need to constantly go
back to the template to check whether I am providing all the needed variables with correct names or not.

We can also create a linter that fixes these issues, but again, we're just shifting the
complexity from the code to the tool-chain our nice framework is going to be dependent on.

> :Space

## Extra Stuff To Learn

If you want to loop over an array in Nunjucks syntax, you should do something like this:

```html
{% for item in items %}
<p>{{item.name}}</p>
{% endfor %}
```

Each of the frameworks mentioned above also have their own special syntax for this:

> :Tabs
> > :Tab title=Angular
> > ```html
> > <p *ngFor="let item in items">{{item.name}}</p>
> > ```
>
> > :Tab title=Vue.js
> > ```html
> > <p v-for="item in items">{{item.name}}</p>
> > ```
>
> > :Tab title=Svelte
> > ```html
> > {# each items as item}
> > <p>{item.name}</p>
> > {/each}
> > ```

Additionally, the code between `{{` and `}}` is not Javascript, so what happens if I wanted
to call a method on each `item` instead of just accessing a property?

Well, someone needed to know Javascript and HTML to be able to work with our nice framework,
now they also need to learn these extra syntaxes and find the specific answers to these questions.

---

# JSX To The Rescue

To resolve all these issues, we would need a solution that:

- Natively uses Javascript's own module resolution
- Allows defining the HTML tree interleaved with Javascript
- Uses Javascript scopes and functions
- Its syntax is not much more than Javascript + HTML

Well, there is this extension of Javascript called [**JSX**](https://reactjs.org/docs/introducing-jsx.html),
which specifically satisfies all of these requirements. It is basically a syntactic sugar for
Javascript that allows creating objects (for example, DOM Objects) using HTML syntax:

```jsx
const myDiv = <div>Hellow there!</div>;
```

This would make our timer code look like this:

```jsx
import { render } from 'yet-another-frontend-framework';
import { timer } from 'rxjs';


render(<div>You have been here for {timer(0, 1000)} seconds!</div>, document.body);
```

<br>

_But doesn't JSX itself require additional tooling on top?_

<br>

It does. However:

- It is just one tool in the tool-chain that solves all of the problems (i.e. module resolution, scopes, etc),
  instead of multiple ones.

- It is just a syntactic sugar, meaning that people could use our framework without it, without getting any of
  the aforementioned issues (though it will be less convenient),

- [TypeScript](https://www.typescriptlang.org/) supports it (almost) out of the box, which means zero
  additional tooling for anyone using Typescript.

> :Space

## Separation

As mentioned above, enforcing a _general_ separation between description of the DOM tree and the logic behind
it can cause more problems than it solves.

However, there are valid concerns about unchecked mixing of HTML tree representation and Javascript code, as it
can lead to code that is pretty difficult to read/understand/debug (simply because there are two interwoven syntaxes
instead of one).

With **JSX**, we are _NOT_ enforcing a separation strategy, but we are also not barring it by any means.
If anything, people can actually be much more flexible on how they split their codes, depending on their project's
needs, and how they re-use _view code_ or integrate it into _logic code_, while still benefiting from explicit
scoping, a unified module resolution strategy, and a familiar syntax.

For example, we can still break our timer code into _view_ and _logic_ bits:

> :Tabs
> > :Tab title=Logic Code
> > ```js | timer.logic.js
> > import { render } from 'yet-another-frontend-framework';
> > import { timer } from 'rxjs';
> > /*!*/import view from './timer.view'; // @see tab:View Code
> > 
> > render(view(timer(0, 1000))).on(document.body);
> > ```
>
> > :Tab title=View Code
> > ```jsx | timer.view.jsx
> > export const counter => (
> >   <div>You have been here for {counter} seconds!</div>
> > );
> > ```

---

# A JSX/TSX Renderer

**JSX** (or **TSX**, the TypeScript version) code is converted to some straight-forward function
calls based on your configurations. Since it was introduced alongside React, JSX code is by
default converted to React function calls. So this:

```jsx
const myDiv = <div>Hellow World!</div>
```

is by default translated to this:

```js
const myDiv = React.createElement('div', {}, 'Hellow World!');
```

React by default doesn't create HTML Elements directly, as it first renders to a virtual DOM
and diffs that with the actual DOM. However, as discussed in [Part 1](/yaff/part1), one of
the main goals of our framework was to render everything once and instead subscribe the changing
nodes to the changing values. 

To that end, we need to provide a replacement for `React.createElement()`
that works with the same interface (so TypeScript or Babel can convert JSX to its invokations)
but produces DOM Objects using browser's own APIs:

```js
export class Renderer {
/*!*/  public create(tag, props, ...children) {                                                   // --> So this is our main function
/*!*/    // --> STEP 1: create the element
/*!*/    const el = document.createElement(tag);                                                   // --> STEP 1: create the element
/*!*/
/*!*/    // --> STEP 2: set its properties
/*!*/    if (props)                                                                               // --> STEP 2: set its properties
/*!*/      Object.entries(props)                                                                  // --> STEP 2: set its properties
/*!*/            .forEach(([prop, target]) => this.setprop(prop, target, el));                    // --> STEP 2: set its properties
/*!*/
/*!*/    // --> STEP 3: add its children
/*!*/    children.forEach(child => this.append(child, el));                                       // --> STEP 3: add its children
/*!*/
/*!*/    return el;
/*!*/  }

  public setprop(prop, target, host) {
    if (typeof target === 'boolean' && target) host.setAttribute(prop, '');                  // --> Yep boolean attributes are a bit different
    else host.setAttribute(prop, target.toString());                                         // --> Set other attributes normally
  }

  public append(target, host) {
    if (target instanceof Node) host.appendChild(target);                                    // --> So append another Node casually
    else if (Array.isArray(target)) target.forEach(_ => this.append(_, host));               // --> Append each member of an array
    else host.appendChild(document.createTextNode(target.toString()));                       // --> Append the string value for other stuff
  }
}
```

<br>

Now we can use this class to have JSX that uses browser's APIs to directly creat DOM Elements:

```jsx
/** @jsx renderer.create */     // --> So this line tells our JSX parser how to work with JSX. It is typically configurable globally for a project as well
import { Renderer } from 'yet-another-frontend-framework';
const renderer = new Renderer();

/*!*/const myDiv = <div>Hellow World!</div>;
```

Which will be converted to:

```js
import { Renderer } from 'yet-another-frontend-framework';
const renderer = new Renderer();

/*!*/const myDiv = renderer.create('div', {}, 'Hellow World!');
```

> [touch_app](:Icon) **NOTE**
>
> In React, `React` itself is a singleton object and `React.createElement()` a static
> function. In our case however, we are not using a singleton renderer, but instead binding
> the _JSX create_ function (sometimes called the _JSX factory function_) to a variable (`renderer`)
> that must be defined in each scope.
>
> This might seem like more work (import and create instead of just import), but it gives
> us the additional flexibility to use different renderers in different scopes. For example,
> a component can use a scoped renderer that applies some implicit styling. Since that renderer
> is limited to the scope of that component, the styles it applies would also naturally be scoped,
> which means we've solved style scoping simply using Javascript scopes.

---

# The Show Must Go On ...

With our brand new `Renderer`, our timer component would look like this:

```jsx
/** @jsx renderer.create */
import { Renderer } from 'yet-another-frontend-framework';
import { timer } from 'rxjs';

const renderer = new Renderer();
renderer.append(<div>You have been here for {timer(0, 1000)} seconds!</div>, document.body);
```

Well this actually would not render our beloved timer, but instead it would
render something like this:

> You have been here for [object Object] seconds!

Why? Because our `Renderer` uses `.toString()` method to render all objects, and

```js
console.log(timer(0, 1000).toString());
// > [object Object]
```

In other words, our `Renderer` class is a _static_ renderer, as it cannot render dynamic content on the DOM tree.

There is still much work to be done to complete our _Yet Another Frontend Framework_.
In the next part, we'll design a mechanism that allows extending the behaviour of our `Renderer`,
for example to allow it to properly render `Observable`s. You can check the actual, final code of
the _static_ (or _raw_) renderer [here](https://github.com/CONNECT-platform/connective-html/blob/master/src/renderer/renderer.ts),
and stay tuned for upcoming parts!

---

> :Author src=github

<br>

_Hero Image by [Zbysiu Rodak](https://unsplash.com/@zbigniew) from [Unsplash](https://unsplash.com)._

> :ToCPrevNext

> :MetaOverride target=description
>
> Templating vs JSX, which one is the best option for our frontend framework?

> :MetaOverride property=og:title
>
> Part 2: JSX

> :MetaOverride target=keywords, behavior=extend
>
> React, Angular, Vue.js, Svelte, Nunjucks, Templates, JSX, Templating, Frontend, Javascript, TypeScript