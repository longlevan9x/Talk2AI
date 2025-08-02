const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'inline-source-map',

    entry: {
      background: path.resolve(__dirname, 'src/background/index.ts'),
      content: path.resolve(__dirname, 'src/content/index.ts'),
      popup: path.resolve(__dirname, 'src/popup/index.tsx'),
      settings: path.resolve(__dirname, 'src/pages/settings/index.tsx'),
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
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
        {
          test: /\.(scss|sass)$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
      ],
    },

    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', to: '.' },
          { from: 'src/popup/index.html', to: 'popup/index.html' },
          { from: 'src/pages/settings/index.html', to: 'settings/index.html' },
          { from: 'assets/logo', to: 'assets/logo' },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: 'styles.css',
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
