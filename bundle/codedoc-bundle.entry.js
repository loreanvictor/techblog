import { getRenderer } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/transport/renderer.js';
import { initJssCs } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/transport/setup-jss.js';initJssCs();
import { installTheme } from '/home/runner/work/techblog/techblog/.codedoc/content/theme.ts';installTheme();
import { codeSelection } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/code/selection.js';codeSelection();
import { sameLineLengthInCodes } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/code/same-line-length.js';sameLineLengthInCodes();
import { initHintBox } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/code/line-hint/index.js';initHintBox();
import { initCodeLineRef } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/code/line-ref/index.js';initCodeLineRef();
import { initSmartCopy } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/code/smart-copy.js';initSmartCopy();
import { copyHeadings } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/heading/copy-headings.js';copyHeadings();
import { contentNavHighlight } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/page/contentnav/highlight.js';contentNavHighlight();
import { loadDeferredIFrames } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/transport/deferred-iframe.js';loadDeferredIFrames();
import { smoothLoading } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/transport/smooth-loading.js';smoothLoading();
import { tocHighlight } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/page/toc/toc-highlight.js';tocHighlight();
import { postNavSearch } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/page/toc/search/post-nav/index.js';postNavSearch();
import { zoomOnFormula } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/formula/zoom-on-formula.js';zoomOnFormula();
import { ToCToggle } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/page/toc/toggle/index.js';
import { DarkModeSwitch } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/darkmode/index.js';
import { ConfigTransport } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/transport/config.js';
import { Author } from '/home/runner/work/techblog/techblog/.codedoc/components/author/index.tsx';
import { ToCPrevNext } from '/home/runner/work/techblog/techblog/.codedoc/node_modules/@codedoc/core/dist/es6/components/page/toc/prevnext/index.js';

const components = {
  'Y3CwRdEdOr4c/7giJ+aw9A==': ToCToggle,
  'RvE5o2QfOK5J3QVF7Tklvg==': DarkModeSwitch,
  'Q4JLHVOQZMeIjlyFQgRaUQ==': ConfigTransport,
  '/hWwvsguv5skVWvFh6AQIA==': Author,
  'Xup/U+o1wVN89aL9E/c4oQ==': ToCPrevNext
};

const renderer = getRenderer();
const ogtransport = window.__sdh_transport;
window.__sdh_transport = function(id, hash, props) {
  if (hash in components) {
    const target = document.getElementById(id);
    renderer.render(renderer.create(components[hash], props)).after(target);
    target.remove();
  }
  else if (ogtransport) ogtransport(id, hash, props);
}