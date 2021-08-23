var path = require('path');
module.exports = {
    mode: "production",
    entry: {
        bundle: './lib/app',
        worker_mjpeg: './lib/mjpeg',
        worker_opus_dec: './lib/opus_dec',
        worker_opus_enc: './lib/opus_enc',
        worker_wsocket: './lib/wsocket',
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: ["style-loader", "css-loader"]
        }]
    },
    node: {
        fs: 'empty'
    },
    performance: {
        maxAssetSize: 400000,
        maxEntrypointSize: 4000000
    }
};