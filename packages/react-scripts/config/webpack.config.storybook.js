'use strict';

const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const TsCheckerWebpackPlugin = require('ts-checker-webpack-plugin');
const getClientEnvironment = require('./env');
const paths = require('./paths');

// Options for PostCSS as we reference these options twice
// Adds vendor prefixing to support IE9 and above
const postCSSLoaderOptions = {
  ident: 'postcss', // https://webpack.js.org/guides/migrating/#complex-options
  sourceMap: true,
  plugins: () => [
    require('postcss-flexbugs-fixes'),
    autoprefixer({
      browsers: [
        '>1%',
        'last 4 versions',
        'Firefox ESR',
        'not ie < 9', // React doesn't support IE8 anyway
      ],
      flexbox: 'no-2009',
    }),
  ],
};

module.exports = function(storybookBaseConfig) {
  const publicPath = storybookBaseConfig.output.publicPath;
  // `publicUrl` is just like `publicPath`, but we will provide it to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_PATH%/xyz looks better than %PUBLIC_PATH%xyz.
  const publicUrl = publicPath.replace(/\/+$/, '');

  const env = getClientEnvironment(publicUrl);

  // Point sourcemap entries to original disk location
  storybookBaseConfig.output.devtoolModuleFilenameTemplate = info =>
    path.resolve(info.absoluteResourcePath);

  // This allows you to set a fallback for where Webpack should look for modules.
  // We placed these paths second because we want `node_modules` to "win"
  // if there are any conflicts. This matches Node resolution mechanism.
  // https://github.com/facebookincubator/create-react-app/issues/253
  storybookBaseConfig.resolve.modules = [
    'node_modules',
    paths.appNodeModules,
  ].concat(
    // It is guaranteed to exist because we tweak it in `env.js`
    process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
  );

  // Add typescript extensions as a common filename extension
  storybookBaseConfig.resolve.extensions = [
    '.ts',
    '.tsx',
    '.js',
    '.json',
    '.jsx',
  ];

  // Overwrite alias config
  storybookBaseConfig.resolve.alias = {
    // @remove-on-eject-begin
    // Resolve Babel runtime relative to react-scripts.
    // It usually still works on npm 3 without this but it would be
    // unfortunate to rely on, as react-scripts could be symlinked,
    // and thus babel-runtime might not be resolvable from the source.
    'babel-runtime': path.dirname(
      require.resolve('babel-runtime/package.json')
    ),
    // @remove-on-eject-end
    // Support React Native Web
    // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
    'react-native': 'react-native-web',
  };

  // Register custom resolve plugins
  storybookBaseConfig.resolve.plugins = [
    // Prevents users from importing files from outside of src/ (or node_modules/).
    // This often causes confusion because we only process files within src/ with babel.
    // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
    // please link the files into your node_modules/ and let module-resolution kick in.
    // Make sure your source files are compiled, as they will not be processed in any way.
    new ModuleScopePlugin(paths.appSrc),
  ];

  // Register loaders
  storybookBaseConfig.module.rules = [
    {
      test: /\.js$/,
      loader: require.resolve('source-map-loader'),
      enforce: 'pre',
      include: paths.appSrc,
    },
    // ** ADDING/UPDATING LOADERS **
    // The "file" loader handles all assets unless explicitly excluded.
    // The `exclude` list *must* be updated with every change to loader extensions.
    // When adding a new loader, you must add its `test`
    // as a new entry in the `exclude` list for "file" loader.

    // "file" loader makes sure those assets get served by WebpackDevServer.
    // When you `import` an asset, you get its (virtual) filename.
    // In production, they would get copied to the `build` folder.
    {
      exclude: [
        /\.html$/,
        // We have to write /\.(js|jsx)(\?.*)?$/ rather than just /\.(js|jsx)$/
        // because you might change the hot reloading server from the custom one
        // to Webpack's built-in webpack-dev-server/client?/, which would not
        // get properly excluded by /\.(js|jsx)$/ because of the query string.
        // Webpack 2 fixes this, but for now we include this hack.
        // https://github.com/facebookincubator/create-react-app/issues/1713
        /\.(js|jsx)(\?.*)?$/,
        /\.(ts|tsx)(\?.*)?$/,
        /\.css$/,
        /\.scss$/,
        /\.json$/,
        /\.bmp$/,
        /\.gif$/,
        /\.jpe?g$/,
        /\.png$/,
      ],
      loader: require.resolve('file-loader'),
      options: {
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
    // "url" loader works like "file" loader except that it embeds assets
    // smaller than specified limit in bytes as data URLs to avoid requests.
    // A missing `test` is equivalent to a match.
    {
      test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
      loader: require.resolve('url-loader'),
      options: {
        limit: 10000,
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
    // Compile .tsx?
    {
      test: /\.(ts|tsx)$/,
      include: paths.appSrc,
      loader: require.resolve('ts-loader'),
      options: {
        transpileOnly: true,
      },
    },
    // "postcss" loader applies autoprefixer to our CSS.
    // "sass" loader compiles scss to css.
    // "css" loader resolves paths in CSS and adds assets as dependencies.
    // "style" loader turns CSS into JS modules that inject <style> tags.
    // In production, we use a plugin to extract that CSS to a file, but
    // in development "style" loader enables hot editing of CSS.
    {
      test: /\.css$/,
      exclude: /\.module\.css$/,
      use: [
        require.resolve('style-loader'),
        {
          loader: require.resolve('css-loader'),
          options: {
            importLoaders: 1,
            sourceMap: true,
          },
        },
        {
          loader: require.resolve('postcss-loader'),
          options: postCSSLoaderOptions,
        },
      ],
    },
    {
      test: /\.module\.css$/,
      use: [
        require.resolve('style-loader'),
        {
          loader: require.resolve('typings-for-css-modules-loader'),
          options: {
            importLoaders: 1,
            sourceMap: true,
            modules: true,
            namedExport: true,
            camelCase: true,
            localIdentName: '[name]__[local]___[hash:base64:5]',
          },
        },
        {
          loader: require.resolve('postcss-loader'),
          options: postCSSLoaderOptions,
        },
      ],
    },
    {
      test: /\.scss$/,
      exclude: /\.module\.scss$/,
      use: [
        require.resolve('style-loader'),
        {
          loader: require.resolve('css-loader'),
          options: {
            importLoaders: 2,
            sourceMap: true,
          },
        },
        {
          loader: require.resolve('postcss-loader'),
          options: postCSSLoaderOptions,
        },
        {
          loader: require.resolve('sass-loader'),
          options: {
            sourceMap: true,
          },
        },
      ],
    },
    {
      test: /\.module\.scss$/,
      use: [
        require.resolve('style-loader'),
        {
          loader: require.resolve('typings-for-css-modules-loader'),
          options: {
            importLoaders: 2,
            sourceMap: true,
            modules: true,
            namedExport: true,
            camelCase: true,
            localIdentName: '[name]__[local]___[hash:base64:5]',
          },
        },
        {
          loader: require.resolve('postcss-loader'),
          options: postCSSLoaderOptions,
        },
        {
          loader: require.resolve('sass-loader'),
          options: {
            sourceMap: true,
          },
        },
      ],
    },
    // ** STOP ** Are you adding a new loader?
    // Remember to add the new extension(s) to the "url" loader exclusion list.
  ];

  // Add common plugins
  storybookBaseConfig.plugins = storybookBaseConfig.plugins.concat([
    // Makes some environment variables available to the JS code, for example:
    // if (process.env.NODE_ENV === 'development') { ... }. See `./env.js`.
    new webpack.DefinePlugin(env.stringified),
    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // Tell webpack to ignore the generated typings for css modules -> faster rebuilds
    new webpack.WatchIgnorePlugin([
      /module\.css\.d\.ts$/,
      /module\.scss\.d\.ts$/,
    ]),
    // Type check the files
    new TsCheckerWebpackPlugin({
      tsconfig: path.join(paths.appPath, 'tsconfig.json'),
      tslint: path.join(paths.appPath, 'tslint.json'),
      memoryLimit: 2048,
    }),
  ]);

  return storybookBaseConfig;
};
