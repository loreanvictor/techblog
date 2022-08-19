
import { configuration } from '@codedoc/core';
import { codingBlog } from '@codedoc/coding-blog-plugin';

import { theme } from './theme';


export const config = /*#__PURE__*/configuration({
  theme,
  src: {
    base: 'posts'
  },
  dest: {
    html: 'dist',
    assets: 'dist',
    styles: 'dist/styles',
    bundle: 'dist/bundle',
  },
  page: {
    title: {
      base: 'Eugene\'s Coding Blog'
    },
    favicon: '/favicon.ico',
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
  plugins: [
    codingBlog({
      assets: [
        'favicon.ico',
        'img'
      ],
      feed: {
        url: 'https://eugene.coding.blog'
      },
    })
  ],
  misc: {
    github: {
      repo: 'techblog',
      user: 'loreanvictor'
    }
  }
});
