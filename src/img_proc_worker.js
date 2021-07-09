
self.onmessage = function(e) {
    var { img, width, height, lut } = e.data;

    for (var i = 0; i < height; ++i) {
        for (var j = 0; j < width; ++j) {
            let pixIdx = 4 * (i * width + j);
            let pix = { r: img[pixIdx + 0], g: img[pixIdx + 1], b: img[pixIdx + 2] };
            let luma = Math.min(199, parseInt(pix.r * 0.299 + pix.g * 0.587 + pix.b * 0.114 / 255 * 199));
            let color = lut[luma];
            img[pixIdx + 0] = parseInt(color.red);
            img[pixIdx + 1] = parseInt(color.green);
            img[pixIdx + 2] = parseInt(color.blue);
        }
    }

    self.postMessage({ img });
};
