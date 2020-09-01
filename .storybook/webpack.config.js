const path = require("path");

module.exports = {
  module: {
    rules: [
      {
        test: /\.module.css$/,
        loaders: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
              modules: true,
            },
          }
        ],
      },
    ],
  }
}