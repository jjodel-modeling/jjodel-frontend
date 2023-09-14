const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/memorec/*',
        createProxyMiddleware({
            target: process.env['REACT_APP_MEMOREC'],
            changeOrigin: true
        })
    );
};
