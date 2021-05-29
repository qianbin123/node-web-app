const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const options = {
  target: 'http://127.0.0.1:8888', // target host
  changeOrigin: true, // needed for virtual hosted sites
  pathRewrite: {'^/api' : ''},      // 转发时，例如：/api/test => /test
};

// use代理中间件       对“/api”开头的请求接口走 proxyServer 
app.use('/api', createProxyMiddleware(options));

// client目录下的静态文件放在代理服务器上       对“/”接口走本地静态文件
app.use('/', express.static('./client', {
  cacheControl: false,
  etag: false,
  lastModified: false
}))

app.listen(8081);