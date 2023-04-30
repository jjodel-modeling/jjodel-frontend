module.exports = {
    /*resolve: {
        extensions: [".js", ".jsx", ".json", ".ts", ".tsx", ".webpack.js", ".web.js"]
    },*/
    fallback: {
        "buffer": require.resolve("buffer/"),
        "util": require.resolve("util/"),
        "fs": {},
        "path": require.resolve("path-browserify")
    },
    // module: { rules: [{ test: /\.ts$/, loader: "ts-loader" }] }
}
