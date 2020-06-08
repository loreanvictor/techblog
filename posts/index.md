> :Hero src=https://images.unsplash.com/photo-1480506132288-68f7705954bd?w=1993&h=600&fit=crop&q=80, \
> target=desktop, mode=dark, leak=208px

> :Hero src=https://images.unsplash.com/photo-1480506132288-68f7705954bd?w=1200&h=600&fit=crop&q=80, \
> target=mobile, mode=dark, leak=96px

> :Hero src=https://images.unsplash.com/photo-1544133065-4c9fe678b4dd?w=1993&h=600&fit=crop&q=80, \
> target=desktop, mode=light, leak=208px

> :Hero src=https://images.unsplash.com/photo-1544133065-4c9fe678b4dd?w=1200&h=600&fit=crop&q=80, \
> target=mobile, mode=light, leak=96px

> :Title color=white, shadow=0 0 12px black
>
> Eugene's Coding Blog

> :Author src=github

<br>

So this is my personal blog where I talk about tech stuff I encounter. Right now I am working on
[`coding.blog`](https://coding.blog) and [**CODEDOC**](https://codedoc.cc), and trying to push
capabilities of JAMStack blogs to their limits.

<br>

# Latest Posts

> :ArticleCard src=/why-medium-doesnt-work-for-programmers, style=box

> :ArticleCard src=/rxjs-error-handling, style=box

> :Space

# Yet Another Frontend Framework

So a while back, I was working on [CONNECT-platform](https://connect-platform.com). The web-based
editor for connect platform is built using Angular, and I had a lot of headache optimizing it
to a marginally acceptable level of performance. The issue was Angular's change detection,
as it got pretty confused due to the rather complicated flow of data in the editor.

I ended up doing more work for pushing Angular out of my way, along with the fact that explicitly
controlling the change propagation flow simply meant a lot of the benefits of Angular were already
gone. As a result, I decided to create [_Yet Another Frontend Framework_](https://github.com/CONNECT-platform/connective-html), 
built around explicit description of flow of change.

<br>

> :ArticleCard src=/yaff/part1

> :ArticleCard src=/yaff/part2

> :Space

# A Place to Blog Coding

Medium was not the best place to write blogs on programming to begin with, but with the paywall-or-promote-it-yourself
policy, it is not the place for proper coding blogs anymore.

This drove me to start working on [`coding.blog`](https://coding.blog), which is a semi-centralized blog-platform
for programming: 

- You write markdown and use [an open-source stack](https://codedoc.cc) to build your blog.
  This means you maintain full ownership of your content, can publish it anywhere, move it anytime, etc, while
  being able to create elegant and feature-rich blogs for programming with the same convenience of Medium.

- You can then publish your blog also to [`coding.blog`](https://coding.blog), which gives you a nice domain
  `<your>.coding.blog`, and spreads the word about your writings so that you can keep focused on writing
  quality pieces. It will also provide features for direct financial support by the community and revenue
  sharing through curation subscriptions.

<br>

The blog you are reading now is (rather obviously) a `coding.blog` blog. We are scaling up our operation
to allow everyone to seamlessly create their own coding blog, but for now you can enlist in our 
[prospective creators list](https://coding.blog/creators) and reserve your preferred subdomain.

> :Buttons
> > :Button label=Learn More, url=https://coding.blog


> :Space

# Project CODEDOC

Doing lots of open-source projects, I felt the need for a proper modern and convenient
but extremely customizable documentation tool, so I created [**CODEDOC**](https://codedoc.cc).

> :Buttons
> > :Button label=Learn More, url=https://codedoc.cc

> :Space

# Pokemon Fun

Just for the fun of it, have this snippet of a simple frontend that gets pokemon information
from their name, using [**CONNECTIVE HTML**](https://github.com/CONNECT-platform/connective-html)
and [**RxJS**](https://learnrxjs.io):

```tsx
/** @jsx renderer.create */

import { Renderer, ref } from '@connectv/html';        // @see [CONNECTIVE HTML](https://github.com/CONNECT-platform/connective-html)
import { ajax } from 'rxjs/ajax';                      // @see [RxJS](https://learnrxjs.io)
import { BehaviorSubject, merge } from 'rxjs';         // @see [RxJS](https://learnrxjs.io)
import { switchMap, debounceTime, mapTo, map, share } from 'rxjs/operators';  // @see [RxJS](https://learnrxjs.io)
import { not } from 'rxmetics';                        // @see [RxMetics](https://loreanvictor.github.io/rxmetics)


const POKE_API = 'https://pokeapi.co/api/v2/pokemon/';

/*!*/const name = new BehaviorSubject('charizard');
/*!*/const data = name.pipe(
/*!*/  debounceTime(300),                                                     // --> wait a bit until typing is finished
/*!*/  switchMap(name => ajax.getJSON(POKE_API + name + '/')),                // --> get pokemon info
/*!*/  map(res => JSON.stringify(res, null, 2)),                              // --> make it presentable
/*!*/  share(),                                                               // --> share it so we don't do multiple requests
/*!*/);
/*!*/const loading = merge(name.pipe(mapTo(true)), data.pipe(mapTo(false)));  // --> when typing, loading is true, when data is here, its false

const renderer = new Renderer();
renderer.render(
/*!*/  <fragment>
/*!*/    <input type="text" placeholder="pokemon name" _state={name}/>
/*!*/    <pre hidden={loading}>{data}</pre>
/*!*/    <div hidden={not(loading)}>Loading ...</div>
/*!*/  </fragment>
)
.on(document.body);
```

> :Buttons
> > :Button label=Try It, url=https://stackblitz.com/edit/late-night-pokemon-fun
>
> > :CopyButton

> :Space

> :DarkLight
> > :InDark
> >
> > _Hero Image by [Anas Alshanti](https://unsplash.com/@otenteko) from [Unsplash](https://unsplash.com)._
>
> > :InLight
> >
> > _Hero Image by [Monika Pot](https://unsplash.com/@ramoni) from [Unsplash](https://unsplash.com)._

