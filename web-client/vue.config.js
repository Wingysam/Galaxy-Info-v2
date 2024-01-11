const path = require('path')

module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: {
    resolve: {
      alias: {
        '@galaxyinfo': path.resolve(__dirname, '../shared')
      }
    }
  },
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title = "Galaxy Info";
        return args;
      })
  },

}
