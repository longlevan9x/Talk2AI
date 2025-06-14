const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // chuyển sang 'production' khi build thật
  entry: {
    background: path.resolve(__dirname, 'src/background.ts'),
    content: path.resolve(__dirname, 'src/content.ts'),
    popup: path.resolve(__dirname, 'src/popup/index.tsx'), // popup React entry
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // background.js, content.js, popup.js
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'src/popup/index.html', to: 'popup/index.html' },
        { from: 'assets/logo', to: 'assets/logo' },
      ],
    }),
  ],
  watchOptions: {
    ignored: /node_modules/,
  },
};
