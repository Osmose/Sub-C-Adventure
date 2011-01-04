/*
 * Badly Designed Game Engine
 * Copyright (c) 2010, Michael Kelly <Osmose1000@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Drawing utility class for quick drawing on a canvas
 */
define(["require", "exports", "module",
    "./util"
],function(require, exports, module,
    util
) {

/**
 * SET THIS BEFORE USING. 
 * 2D Canvas Context to draw to.
 */
exports.ctx = null;

/**
 * Default styling
 */
exports.textStyle = {
    font: "10px Arial",
    fill: "#000000",
    align: "left",
    baseline: "top"
};

exports.rectStyle = {
    fill: "#000000"
};

/**
 * Draws text 
 */
exports.fillText = function(text, x, y, options) {
    var ops = this.textStyle;
    if (typeof options == "object") {
        ops = util.replaceProperties(ops, options)
    }
    
    this.ctx.save();
    this.ctx.font = ops.font;
    this.ctx.fillStyle = ops.fill;
    this.ctx.textAlign = ops.align;
    this.ctx.textBaseline = ops.baseline;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
};

/**
 * Draws a filled rectangle
 */
exports.fillRect = function(x, y, width, height, options) {
    var ops = this.rectStyle;
    if (typeof options == "object") {
        ops = util.replaceProperties(ops, options)
    }
    
    this.ctx.save();
    this.ctx.fillStyle = ops.fill;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.restore();
};

});