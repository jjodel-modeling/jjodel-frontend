const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/memorec/*',
        createProxyMiddleware({
            target: process.env['REACT_APP_MEMOREC'],
            changeOrigin: true
        })
    );
    app.use(
        '/persistance/*',
        createProxyMiddleware({
            target: process.env['REACT_APP_PERSISTANCE'],
            changeOrigin: true
        })
    );
    /*
    app.use(
        '/collaborative/rooms',
        createProxyMiddleware({
            target: process.env['REACT_APP_COLLABORATIVE_REST'],
            changeOrigin: true
        })
    );
    app.use(
        '/collaborative/rooms/*',
        createProxyMiddleware({
            target: process.env['REACT_APP_COLLABORATIVE_REST'],
            changeOrigin: true
        })
    );
    app.use(
        '/collaborative',
        createProxyMiddleware({
            target: process.env['REACT_APP_COLLABORATIVE_SOCKET'],
            ws: true,
            changeOrigin: true
        })
    );
    */
};
