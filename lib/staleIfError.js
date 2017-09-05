'use strict';

const parseCacheControl = require('./parseCacheControl');
const getFromCache = require('./cache').getFromCache;
const storeInCache = require('./cache').storeInCache;

const noop = () => {};

const STALE_IF_ERROR = 'stale-if-error';
const CACHE_CONTROL = 'cache-control';
const SEGMENT = 'stale';

module.exports = (cache) => {
  cache.start(noop);

  return (ctx, next) => {
    return next()
      .then(() => {
        const cacheControl = parseCacheControl(ctx.res.headers[CACHE_CONTROL]);

        if (cacheControl[STALE_IF_ERROR]) {
          return storeInCache(cache, SEGMENT, ctx.req.getUrl(), ctx.res.body, cacheControl[STALE_IF_ERROR] * 1000);
        }
      }).catch((err) => {
        return getFromCache(cache, SEGMENT, ctx.req.getUrl())
          .then((cached) => {
            if (cached) {
              ctx.res = {
                body: cached.item
              };
              return;
            }
            return Promise.reject(err);
          });
      });
  };
};