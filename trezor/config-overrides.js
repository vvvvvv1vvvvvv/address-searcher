const {
  override,
  addWebpackAlias,
  addWebpackPlugin,
} = require("customize-cra");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

module.exports = override(
  addWebpackAlias({
    stream: require.resolve("stream-browserify"),
    crypto: require.resolve("crypto-browserify"),
    url: require.resolve("url"),
    zlib: require.resolve("browserify-zlib"),
    https: require.resolve("https-browserify"),
    http: require.resolve("stream-http"),
  }),
  // addWebpackPlugin(new NodePolyfillPlugin()),
  addWebpackPlugin(new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
    process: 'process',
  }))
);
