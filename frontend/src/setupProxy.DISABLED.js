const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/memorec/*',
        createProxyMiddleware({
            target: process.env['JODEL_MEMOREC'],
            changeOrigin: true
        })
    );
    app.use(
        '/persistance/*',
        createProxyMiddleware({
            target: process.env['JODEL_PERSISTANCE'],
            changeOrigin: true
        })
    );
    app.use(
        '/collaborative',
        createProxyMiddleware({
            target: process.env['JODEL_COLLABORATIVE'],
            ws: true,
            changeOrigin: true
        })
    );
};

