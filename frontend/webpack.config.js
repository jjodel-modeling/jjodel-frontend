const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
    const isProduction = env.NODE_ENV === 'production';
    const dotenvFilename = isProduction ? '.env.production' : '.env.development';

    return {
        resolve: {
            fallback: {
                //path: require.resolve("path-browserify"),
                fs: require.resolve('browserify-fs'),
            }

        },
        stats: {// disables console.warn with eslint-like messages in browser
            logging: 'none'//'error',
        },
        infrastructureLogging: {// disables console.warn with eslint-like messages in browser
            //appendOnly: true,
            level: 'none'// 'error',
        },
        devServer: {
            clientLogLevel: 'none' // disables console.warn with eslint-like messages in browser
        },
        entry: './src/index.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'main.bundle.js',
        },
        plugins: [
            new Dotenv({
                path: dotenvFilename,
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
            }),
        ],
        mode: 'development', // always dev to prevent minimization
        optimization: {
            minimize: false
            /*
            minimizer  : [
                new UglifyJSPlugin({
                    cache        : true,
                    parallel     : true,
                    uglifyOptions: {
                        compress: true,
                        ecma    : 6,
                        mangle  : false
                    },
                    sourceMap    : true
                })

            ]*/
        },
    };
};

/*
const path = require('path');
module.exports = {
    entry: "./src/index.ts",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".js"]
    },
    module: {
        rules: [{ test: /\.ts$/, loader: "ts-loader" }]
    }
}
*/
/*
const million = require('million/compiler');
module.exports = {
    webpack: {
        plugins: { add: [million.webpack()] }
    }
};
*/

