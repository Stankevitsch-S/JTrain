const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require("path");
module.exports = {
  entry: './src/js/logic.js',
  output: {
    path: path.join(__dirname,"..","dist/js"),
    filename: 'bundle.js'
  },
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/")
    }
  },
  plugins: [
    new CopyWebpackPlugin({
        patterns: [
            { context: "src", from: 'index.html', to: "../"},
            { context: "src", from: 'css', to: "../css"},
            { context: "src", from: 'img', to: "../img"}
        ]
    })
  ]
}