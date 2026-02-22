import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: #0a0e17;
    color: #e8e8e8;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
  }

  #root {
    width: 100%;
    height: 100%;
  }

  button {
    cursor: pointer;
    border: none;
    font-family: inherit;
  }

  a {
    color: #00d4ff;
    text-decoration: none;
  }
`;
