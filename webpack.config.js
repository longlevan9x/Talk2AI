const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'inline-source-map',

    entry: {
      background: path.resolve(__dirname, 'src/background.ts'),
      content: path.resolve(__dirname, 'src/content.ts'),
      popup: path.resolve(__dirname, 'src/popup/index.tsx'),
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true, // xóa file cũ mỗi lần build
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

    optimization: {
      minimize: isProd,
      minimizer: isProd
        ? [new TerserPlugin({
          terserOptions: {
            mangle: true,
            compress: true,
          },
        })]
        : [],
    },

    watchOptions: {
      ignored: /node_modules/,
    },
  };
};
