const path = require('path');
const CommonConfigWebpackPlugin = require('common-config-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ENV = process.env.ENV;

module.exports = {
  mode: ENV === 'product' ? 'production' : 'development',
  devtool: ENV === 'dev' ? 'eval-source-map' : false,
  output: {
    path: path.resolve(__dirname, 'public'),
    publicPath: '/',
  },
  plugins: [new CommonConfigWebpackPlugin(), new HtmlWebpackPlugin({template: 'src/index.html'})],
};
