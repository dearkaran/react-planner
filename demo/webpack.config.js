const OpenBrowserPlugin = require('open-browser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

/**
 * --env.production
 * --env.port port
 */

const PAGE_TITLE = "React Planner";
const VENDORS_LIBRARIES = ['immutable', 'react', 'react-dom', 'react-redux', 'redux', 'three'];

module.exports = function (env) {
  let isProduction = env && env.hasOwnProperty('production');
  let port = env && env.hasOwnProperty('port') ? env.port : 8080;

  if (isProduction) console.info('Webpack: Production mode'); else console.info('Webpack: Development mode');

  let config = {
    context: path.resolve(__dirname),
    entry: {
      'webpack-dev-server/client?http://0.0.0.0:80',
      app: './src/renderer.jsx',
      vendor: VENDORS_LIBRARIES
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[chunkhash].[name].js',
    },
    performance: {
      hints: isProduction ? 'warning' : false
    },
    devtool: isProduction ? 'source-map' : 'eval',
    devServer: {
      port: 8080,
	  host: 'ec2-52-54-134-39.compute-1.amazonaws.com',
      //port: port,
      contentBase: path.join(__dirname, './dist'),
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        'react-planner': path.join(__dirname, '../src/index')
      }
    },
    module: {
      rules: [{
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            "compact": false,
            "plugins": [
              "transform-object-rest-spread"
            ],
            "presets": [
              "es2015-webpack2",
              "react"
            ]
          }

        }]
      }, {
        test: /\.(jpe?g|png|gif|mtl|obj)$/i,
        use: [{
          loader: 'file-loader',
          options: {
            hash: 'sha512',
            digest: 'hex',
            name: '[path][name].[ext]',
            context: 'demo/src'
          }
        }]
      }]
    },
    plugins: [
      new webpack.optimize.CommonsChunkPlugin({
        names: ['vendor', 'manifest'],
        minChunks: Infinity,
        filename: '[chunkhash].[name].js'
      }),

      new HtmlWebpackPlugin({
        title: PAGE_TITLE,
        template: './src/index.html.ejs',
        filename: 'index.html',
        inject: 'body',
      })
    ]
  };

  if (isProduction) {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin());

    config.plugins.push(new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }));
  }

  if (!isProduction) {
    //config.plugins.push(new OpenBrowserPlugin({url: `http://localhost:${port}`}))
    config.plugins.push(new OpenBrowserPlugin({url: 'http://ec2-52-54-134-39.compute-1.amazonaws.com:8080'}))
  }

  return config;
};
