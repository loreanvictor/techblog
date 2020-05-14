
import { configuration, 
  DefaultMarkdownCustomComponents,
} from '@codedoc/core';

import { theme } from './theme';
import { Hero } from './components/hero';
import { Author$ } from './components/author';
import { Big } from './components/big';
import { Space } from './components/space';
import { PageHead } from './components/page-head';


export const config = /*#__PURE__*/configuration({
  theme,
  src: {
    base: 'posts'
  },
  dest: {
    namespace: '/techblog',
    html: 'dist',
    assets: process.env.GITHUB_BUILD === 'true' ? 'dist' : '.',
    bundle: process.env.GITHUB_BUILD === 'true' ? 'bundle' : 'dist/bundle',
    styles: process.env.GITHUB_BUILD === 'true' ? 'styles' : 'dist/styles',
  },
  page: {
    title: {
      base: 'Eugene\'s Coding Blog'
    },
    favicon: '/favicon.ico',
    fonts: {
      text: {
        url: 'https://fonts.googleapis.com/css2?family=Oxanium:wght@400;700&display=swap',
        name: 'Oxanium',
        fallback: 'cursive',
      }
    },
    meta: {
      subject: 'The Coding Blog of Eugene Ghanizadeh Khoub',
      description: 'The Coding Blog of Eugene Ghanizadeh Khoub',
      keywords: [
        'programming',
        'blog', 'journal',
        'coding',
        'eugene',
        'Eugene Ghanizadeh Khoub',
        'open-source',
        'open source',
        'software',
        'development',
        'developer',
      ]
    }
  },
  markdown: {
    customComponents: {
      ...DefaultMarkdownCustomComponents,
      Hero, Author: Author$, Big, PageHead, Space
    },
  },
  misc: {
    github: {
      repo: 'techblog',
      user: 'loreanvictor'
    },
    coding_blog: {
      assets: [
        'favicon.ico',
        'img'
      ]
    }
  }
});
