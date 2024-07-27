const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: {
    main: './app.js'
  },
  output: {
    path: path.join(__dirname, 'prod-build'),
    publicPath: '/',
    filename: '[name].js',
    clean: true
  },
  mode: 'production',
  target: 'node', // Ensures webpack handles node built-in modules correctly
  externals: [nodeExternals()], // Exclude node_modules from the bundle
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  stats: {
    errorDetails: true, // Show error details
  },
  ignoreWarnings: [
    {
      module: /node_modules\/express\/lib\/view\.js/,
      message: /the request of a dependency is an expression/,
    },
  ],
};
