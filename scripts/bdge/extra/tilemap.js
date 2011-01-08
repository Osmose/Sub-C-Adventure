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
 * Class for including a tilemap in your game
 */
define(["require", "exports", "module",
    "bdge/engine",
    "bdge/loader",
    "bdge/util"
],function(require, exports, module,
    engine,
    loader,
    util
) {

var Tilemap = function() {
    engine.Entity.call(this); // Extend Entity
    
    // The ID of this tileset's image in the loader
    this.tileset = null;
    
    // Map dimensions (in tiles, e.g. 15 tiles wide)
    this.mapWidth = 0;
    this.mapHeight = 0;
    
    // Tile dimensions
    this.tileWidth = 16;
    this.tileHeight = 16;
    
    // map should be an array of arrays, containing the tile indexes
    this.map = [];
};
util.extend(Tilemap, engine.Entity); // Extend Entity

/**
 * Draws the entire tilemap
 */
Tilemap.prototype.draw = function(ctx) {
    // TODO: Draw only tiles that are visible
    var tile;
    for (var ty = 0; ty < this.mapHeight; ty++) {
        for (var tx = 0; tx < this.mapWidth; tx++) {
            tile = this.map[ty][tx];
            ctx.drawImage(loader.getData(this.tileset), 
                tile * this.tileWidth, 
                0, 
                this.tileWidth, 
                this.tileHeight,
                this.x + (tx * this.tileWidth), 
                this.y + (ty * this.tileHeight), 
                this.tileWidth, 
                this.tileHeight
            );
        }
    }
};

/**
 * Return true if the tile at the given x/y grid position is a solid tile
 */
Tilemap.prototype.isSolid = function(x, y) {
    return false;
};

/**
 * Returns true if the given box collides with a solid tile
 */
Tilemap.prototype.collides = function(x, y, width, height) {
    // Box coordinates relative to tilemap
    var left = x - this.x;
    var top = y - this.y;
    var right = left + width - 1;
    var bottom = top + height - 1;
    
    // Now, find the coordinates of every tile this touches
    var tLeft = Math.floor(left / 16);
    var tTop = Math.floor(top / 16);
    var tRight = Math.ceil(right / 16);
    var tBottom = Math.ceil(bottom / 16);
    
    // Check those tiles to see if they are solid
    for (var cx = tLeft; cx < tRight; cx++) {
        for (var cy = tTop; cy < tBottom; cy++) {
            if (this.isSolid(cx, cy)) {
                return true;
            }
        }
    }
    
    return false;
};

/**
 * Used for debugging collision, draws boxes where collision is checked
 */
Tilemap.prototype.drawCollision = function(x, y, width, height, ctx) {
    // Box coordinates relative to tilemap
    var left = x - this.x;
    var top = y - this.y;
    var right = left + width - 1;
    var bottom = top + height - 1;
    
    // Now, find the coordinates of every tile this touches
    var tLeft = Math.floor(left / 16);
    var tTop = Math.floor(top / 16);
    var tRight = Math.ceil(right / 16);
    var tBottom = Math.ceil(bottom / 16);
    
    // Check those tiles to see if they are solid
    for (var cx = tLeft; cx < tRight; cx++) {
        for (var cy = tTop; cy < tBottom; cy++) {
            ctx.save();
            ctx.fillStyle = "#000000";
            ctx.fillRect((cx * 16) + this.x, (cy * 16) + this.y, 16, 16);
            ctx.restore();
        }
    }
};

// Expose class
exports.Tilemap = Tilemap;

});