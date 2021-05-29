/*app.js*/
const Koa = require('koa');
const app = new Koa();
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { parseStatic, parseMime } = require('./utils.js').utils;


/*************************** 常规 ******************************/
// app.use(async (ctx) => {
//   const url = ctx.request.url;
//   console.log('类型', url);
//   if (url === '/') {
//     // 访问根路径返回index.html
//     ctx.set('Content-Type', 'text/html')
//     ctx.body = await parseStatic('./index.html')
//   } else {
//     ctx.set('Content-Type', parseMime(url))
//     ctx.body = await parseStatic(path.relative('/', url))
//   }
// })

/*************************** 强缓存 Cache-Control/Pragma 与 Expire ******************************/

/**
 * 个人理解：
 *  1、Expire是http1.0的产物，Cache-Control是http1.1的产物
 *  2、Cache-Control 通过设置 max-age时间来设置缓存有效时间是多久，单位是秒
 *  3、Expires通过设置 max-age时间来设置缓存有效时间是多久，单位是毫秒
 *  4、同时设置，优先级cache-control比Expire高
 *  5、Cache-Control有5个类型
 *    （1）no-cache
 *    （2）no-store
 *    （3）public
 *    （4）provate
 * 
 * 缓存的位置：
 *  浏览器是如何决定把一个资源缓存到disk中还是memory中，是根据当前的内存使用率决定的
 * 
 * 场景：
 *  缺点：文件在短时间内经常变动，如果用强缓存设置单位时间缓存失效来更新，时间颗粒度不好把握
 * 
*/

app.use(async (ctx) => {
  const url = ctx.request.url
  if (url === '/') {
    // 访问根路径返回index.html
    ctx.set('Content-Type', 'text/html')
    ctx.body = await parseStatic('./index.html')
  } else {
    ctx.set('Content-Type', parseMime(url));
    /**
     * 设置过期时间在30000毫秒，也就是30秒后（强缓存）
     * 同时设置，优先级cache-control比expire高
     * 
     * Expires 设new Date(Date.now() + 30000)指30秒
     * Cache-Control 设max-age=30指30s
    */
    // ctx.set('Expires', new Date(Date.now() + 30000))
    ctx.set('Cache-Control', 'max-age=30');

    ctx.body = await parseStatic(path.relative('/', url))
  }
})

/*************************** 协商缓存 if-modified-since 与 Last-modified ******************************/

/**
 * 个人理解：
 *  首次浏览器请求时，服务器会在静态文件的响应头返回一个 Last-modified: time，
 *  当浏览器下一次再次请求该资源时，请求头会带上 If-modified-since: time，其中time为上次 Last-modified 的时间
 *  服务器会对本次该静态资源的请求头中的 If-modified-since 时间与最近这个 服务器上这个静态文件修改的时间做对比，如果不一样则返回最新改动的静态资源，并返回状态200，否则继续用浏览器本地缓存，并返回状态304
 * 
 * 缓存的位置：
 *  浏览器是如何决定把一个资源缓存到disk中还是memory中，是根据当前的内存使用率决定的
 * 
 * 场景：
 *  根据修改后的时间决定
*/

// app.use(async (ctx) => {
//   const url = ctx.request.url
//   const filePath = path.resolve(__dirname, `.${url}`);
//   // 浏览器回传的 if-modified-since
//   const ifModifiedSince = ctx.request.header['if-modified-since'];
//   // 当前静态文件的状态（目前是根据时间，也可以根据stat中其他指标，不过stat其他指标也不太好做判断，一般还是用修改时间作为指标）
//   const stat = fs.statSync(filePath);


//   if (url === '/') {
//     // 访问根路径返回index.html
//     ctx.set('Content-Type', 'text/html')
//     ctx.body = await parseStatic('./index.html')
//   } else {
//     ctx.set('Cache-Control', 'no-cache');
//     ctx.set('Content-Type', parseMime(url));
//     if (ifModifiedSince === stat.mtime.toGMTString()) {
//       ctx.status = 304
//     } else {
//       ctx.set('Last-Modified', stat.mtime.toGMTString())
//       ctx.body = await parseStatic(filePath)
//     }

//   }
// })

/*************************** 协商缓存 Etag 与 If-None-Match ******************************/

/**
 * 个人理解：
 *  首次浏览器请求时，服务器会在静态文件的响应头返回一个 Etag: hash （这个hash是使用crypto产生的）
 *  当浏览器下一次再次请求该资源时，请求头会带上 If-None-Match: hash，其中hash为上次 Etag 携带的
 *  服务器会对本次该静态资源的请求头中的 If-None-Match 的hash与最近这个 服务器上这个静态文件修改后的hash做对比，如果不一样则返回最新改动的静态资源，并返回状态200，否则继续用浏览器本地缓存，并返回状态304
 * 
 * 缓存的位置：
 *  浏览器是如何决定把一个资源缓存到disk中还是memory中，是根据当前的内存使用率决定的
 * 
 * 场景：
 *  文件在短时间内经常变动
*/

// app.use(async (ctx) => {
//   const url = ctx.request.url
//   const filePath = path.resolve(__dirname, `.${url}`);

//   if (url === '/') {
//     // 访问根路径返回index.html
//     ctx.set('Content-Type', 'text/html')
//     ctx.body = await parseStatic('./index.html')
//   } else {
//     ctx.set('Cache-Control', 'no-cache'); 
//     ctx.set('Content-Type', parseMime(url));

//     const fileBuffer = await parseStatic(filePath);
//     const ifNoneMatch = ctx.request.headers['if-none-match'];
//     const hash = crypto.createHash('md5');
//     hash.update(fileBuffer);
//     const etag = `"${hash.digest('hex')}"`

//     if (ifNoneMatch === etag) {
//       ctx.status = 304
//     } else {
//       ctx.set('Etag', etag)
//       ctx.body = fileBuffer
//     }
//   }
// })

app.listen(3000, () => {
  console.log('starting at port 3000')
})