const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
    const isProduction = env.NODE_ENV === 'production';
    const dotenvFilename = isProduction ? '.env.production' : '.env.development';

    return {
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
        mode: 'development',
        optimization: {
            minimize: false/*
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
        module: {
            rules: [
                {
                    test   : /\.js$/,
                    include: [/src/],
                    use    : [
                        {
                            loader : 'babel-loader',
                            options: {
                                presets: ['@babel/preset-env']
                            }
                        }
                    ],
                },
            ]
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

