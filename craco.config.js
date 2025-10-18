const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "http": false,
        "https": false,
        "util": false,
        "zlib": false,
        "stream": false,
        "assert": false,
        "crypto": false,
        "url": false
      };
      return webpackConfig;
    }
  }
};
