const CommonConfigWebpackPlugin = require('common-config-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ENV = process.env.ENV;

module.exports = {
  mode: ENV === 'product' ? 'production' : 'development',
  devtool: ENV === 'dev' ? 'eval-source-map' : '#source-map',
  plugins: [new CommonConfigWebpackPlugin(), new HtmlWebpackPlugin({title: '九宫格🧩'})],
};
