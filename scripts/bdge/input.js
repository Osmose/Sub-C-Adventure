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
 * Monitors keyboard state
 */
define(["require", "exports", "module"],
function(require, exports, module) {

var input = exports; // Readability

/**
 * Keys maps a key id to the state of a key: true = down, false = up
 */
exports.keys = {};

/**
 * Maps a keyCode to a string id
 */
exports.map = {};

/**
 * Event handler for keydown events
 */
exports.onkeydown = function(e) {
    if (input.map[e.keyCode] != undefined) {
        input.keys[input.map[e.keyCode]] = true;
    }
};

/**
 * Event handler for keyup events
 */
exports.onkeyup = function(e) {
    if (input.map[e.keyCode] != undefined) {
        input.keys[input.map[e.keyCode]] = false;
    }
};

/**
 * Registers a key to be monitored
 */
exports.monitorKey = function(id, keyCode) {
    this.map[keyCode] = id;
    this.keys[id] = false;
};

});