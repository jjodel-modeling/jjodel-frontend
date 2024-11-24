module.exports = function override(config, env) {
    //do stuff with the webpack config...
    config.mode = 'development'; // always dev to prevent minimization
    config.optimization = { minimize: false };
    return config;
}
