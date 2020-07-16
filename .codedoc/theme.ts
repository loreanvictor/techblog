import { createTheme } from '@codedoc/core/transport';


export const theme = /*#__PURE__*/createTheme({
  light: {
    primary: '#202040',
    border: '#75757548',
    background: '#f1e7dc',
  },
  dark: {
    primary: '#ffdcb4',
    border: '#eeeeee48',
    background: '#202040',
  },
  quote: {
    light: {
      background: '#f3e1c6',
      border: '#f6d198',
    },
    dark: {
      background: '#110133',
      border: '#202040',
    }
  },
  toc: {
    dark: {
      background: '#3630629e',
    },
    light: {
      background: '#e3d9cd9e',
      border: 'none',
    }
  },
  code: {
    wmbar: false,
    light: {
      shadow: '',
      background: '#202040',
      lineHighlight: '#363062'
    },
    dark: {
      shadow: '',
      background: '#202040',
      lineHighlight: '#363062'
    }
  }
});
