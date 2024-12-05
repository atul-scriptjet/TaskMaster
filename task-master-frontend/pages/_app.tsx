import React from "react";
import { ConfigProvider } from "antd";
import type { AppProps } from "next/app";
import theme from "./theme/themeConfig";
import { GlobalStyle } from "./components/styles";

const App = ({ Component, pageProps }: AppProps) => (
  <>
    <GlobalStyle />
    <ConfigProvider theme={theme}>
      <Component {...pageProps} />
    </ConfigProvider>
  </>
);

export default App;
