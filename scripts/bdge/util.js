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
 * Utility functions and classes
 */
define(["require", "exports", "module"],
function(require, exports, module) {

/**
 * Waits until conditionFunc returns true, then performs finishFunc
 *
 * Javascript will freeze if you use a loop to wait. This function provides a 
 * method for waiting on another "thread"
 */
exports.wait = function(conditionFunc, finishFunc) {
    var waitFunc = function() {
        if (conditionFunc()) {
            finishFunc();
        } else {
            setTimeout(waitFunc, 10);
        }
    };
    
    waitFunc();
};

/**
 *  Generates a random number between min and max.
 */
exports.rand = function(min, max) {
    return min + Math.round(Math.random() * (max - min));
};

/**
 * Enumerates over the true properties of object (avoiding things added via
 * prototype) and runs func on each of them, passing the id and property as
 * arguments.
 */
exports.forEach = function(object, func) {
    for (var id in object) {
        if (object.hasOwnProperty(id)) {
            func(id, object[id]);
        }
    }
};

/**
 * Returns true if the boxes collide with each other.
 */
exports.boxCollide = function(x1, y1, w1, h1, x2, y2, w2, h2) {
    var r1 = x1 + w1;   // Right side
    var r2 = x2 + w2;   
    var b1 = y1 + h1;   // Bottom side
    var b2 = y2 + h2;
    
    if (b1 < y2) return false;
    if (y1 > b2) return false;
    
    if (r1 < x2) return false;
    if (x1 > r2) return false;
    
    return true;
};

/**
 * Returns true if the point (x,y) is within a box whose top left corner is at
 * (bx, by) and whose width and height are bw and bh respectively.
 */
exports.inBounds = function(x, y, bx, by, bw, bh) {
    if (x < bx || x >= bx + bw) return false;
    if (y < by || y >= by + bh) return false;
    
    return true;
}

/**
 * Creates a new object with all the properties of base, and replaces matching
 * properties from replace.
 * 
 * If base and replace both have matching properties that are not undefined, 
 * the value in the new object 
 * 
 * The primary use of this is to have an "options" argument to a function. base
 * contains default values, replace contains the options to be overridden.
 */
exports.replaceProperties = function(base, replace) {
    var newObj = {};
    
    this.forEach(base, function(id, val) {
        if (replace.hasOwnProperty(id)) {
            newObj[id] = replace[id];
        } else {
            newObj[id] = base[id];
        }
    });
    
    return newObj;
};

/**
 * Copies properties from the prototype of super to the prototype of child.
 */
exports.extend = function(child, super){
    for (var property in super.prototype) {
        if (typeof child.prototype[property] == "undefined") {
            child.prototype[property] = super.prototype[property];
        }
    }
    return child;
};

/**
 *	Maintains a sorted array and places items in the array
 *	based on a comparitor function. Ordering is smallest to
 *	largest.
 */
var SortedArray = function(comparitor) {
    this.array = [];
    this.comparitor = comparitor;
};

SortedArray.prototype.add = function(item) {
    var pos = 0;
    while(pos < this.array.length && this.comparitor(item, this.array[pos]) > 0) pos++;
    this.array.splice(pos, 0, item);
};

SortedArray.prototype.removeIndex = function(index) {
    return this.array.splice(index, 1);
};

SortedArray.prototype.get = function(index) {
    return this.array[index];
};

SortedArray.prototype.set = function(index, val) {
    this.array[index] = val;
};

// Optional comparitor, uses the one from the constructor
// if none is provided. 
SortedArray.prototype.removeItem = function(item, comp) {
    if (typeof comp == "undefined") comp = this.comparitor;
    
    for (var k = 0; k < this.array.length; k++) {
        if (comp(item, this.array[k]) == 0) {
            return this.removeIndex(k);
        }
    }
    
    return false;
};

// First argument to func is the index, second is value
SortedArray.prototype.iter = function(func) {
    for (var k = 0; k < this.array.length; k++) {
        func(k, this.array[k]);
    }
};

// Expose class
exports.SortedArray = SortedArray;

});