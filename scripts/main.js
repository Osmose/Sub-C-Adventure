/**
 * Sub-C Adventure
 * Demo game for Badly Designed Game Engine
 *
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

/*
 * This game is supposed to serve as a sort've tutorial for using BDGE to make
 * games. It's by no means a very good demo, nor is it guaranteed to show off
 * every feature of BDGE, but I think it's a decent starting point.
 * 
 * This tutorial assumes you already know how to code in Javascript to a decent
 * degree, and uses a lot of intermediate-level Javascript concepts (AKA 
 * everything I currently know and some that I don't :P).
 */

// We use RequireJS to include the engine entry point
// We also include extra functionality if we want it here
require(["bdge/bdge",
    "bdge/extra/tilemap"
], function(bdge,
    tilemap
) {

// The function passed to setGameInit will be run before the engine starts
// Most of your game logic will go inside this function
bdge.setGameInit(function() {
    // In order to access the engine, we require it's components
    var engine = require("bdge/engine");
    var input = require("bdge/input");
    var loader = require("bdge/loader");
    var util = require("bdge/util");
    var draw = require("bdge/draw");
    
    var tilemap = require("bdge/extra/tilemap");
    
    var waveDelay = 0;
    var curPhase = 0;
    var curWave = null;
    var waves = [];

    // Initialize engine and set defaults
    engine.title = "Sub-C Adventure";
    engine.showDebugInfo = true;
    engine.fps = 30;
    engine.width = 256;
    engine.height = 240;
    engine.scale = 2;
    engine.init("main"); // "main" is the id of the div container
    
    // Init draw extension for easy drawing later
    draw.ctx = engine.bufferCtx;
    draw.textStyle.font = "8px Press Start K";
    draw.textStyle.fill = "#FFFFFF";

    // We map keys to strings to let the engine know that we want to monitor
    // these keys for input, and will refer to them by the string ID later
    input.monitorKey("up", 38);
    input.monitorKey("down", 40);
    input.monitorKey("left", 37);
    input.monitorKey("right", 39);
    input.monitorKey("d", 68);
    input.monitorKey("f", 70);
    input.monitorKey("esc", 27);

    /*
     * Graphic resources in most cases have to be added to the loader
     * The arguments are:
     * id   - ID string to refer to the resource later
     * url  - URL of resource location relative to index.html
     * type - Type of resource to load.
     */
    loader.addResource("tiles", "res/tiles.png", "image");
    loader.addResource("shot", "res/shot.png", "image");
    loader.addResource("ship", "res/ship.png", "image");
    loader.addResource("slug", "res/slug.png", "image");
    loader.addResource("Press Start K", "res/prstartk.ttf", "font");
    loader.addResource("m_action", "res/action.ogg", "sound");

    // An exception to the loading rule above is the splash image
    // This image is displayed while the rest of the resources are being loaded
    engine.splashImageUrl = "res/splash.png";

    /*
     * An Entity is some sort of thing that has a position and a graphic
     * associated with it. engine.Entity defines the base class for Entities.
     * 
     * To create our own Entities, we need to extend the Entity class and 
     * add on our own behavior. 
     * 
     * Below, we are creating the Player class, which will extend the Entity
     * class.
     */
    var Player = function() {
        // First, we call the Entity constructor on our new object to inherit
        // all of its properties
        engine.Entity.call(this);
        
        // The rest of the constructor is used to define initial properties
        // Functions are defined on the prototype after the constructor
        
        this.x = 120; // Initial X/Y position upon creation
        this.y = 192;
        this.z = 100; // Z determines drawing order; higher Z = drawn on top
        this.shotDown = false;
        
        // Width and Height are used for collision information
        this.width = 16;
        this.height = 16;
        
        // Graphic contains information for drawing the object
        var g = this.graphic;
        g.img = "ship";     // Refers to the ID of the graphic we want
        g.fWidth = 16;      // Width of each animation frame
        g.fHeight = 16;     // Height of each animation frame
        g.anim = true;      // If true, this sprite is animated
        g.delay = 15;       // Delay between each frame; measured in frames
        g.frameCount = 2;   // Total number of frames in animation loop
    };
    
    // Extend copies the functions from the superclass's prototype to the 
    // child's prototype. This inherits the functions from it.
    util.extend(Player, engine.Entity);
    
    /*
     * The process function is run for each object once per frame. The
     * main logic for the object goes here.
     */
    Player.prototype.process = function() {
        // Check input and set our desired movement
        var dy = 0, dx = 0;
        if (input.keys["up"]) dy -= 2;
        if (input.keys["down"]) dy += 2;
        if (input.keys["left"]) dx -= 3;
        if (input.keys["right"]) dx += 3;
        
        // Check that we don't collide with the tilemap. If not, move!
        if (!bg.collides(this.x, this.y + dy, this.width, this.height)) {
            this.y += dy;
        }
        
        // Repeat for the x axis; this allows us to slide against walls
        if (!bg.collides(this.x + dx, this.y, this.width, this.height)) {
            this.x += dx;
        }
        
        // Check if the D key is pressed for shooting
        if (input.keys["d"]) {
            // We can only shoot once per keypress; shotdown is true if
            // the D key is being held
            if (!this.shotDown) {
                // To shoot, we create a new shot object at our current
                // position
                var shot = new Shot(this.x + 6, this.y + 4);
                engine.addEntity(shot);
                this.shotDown = true;
            }
        } else {
            // We let go of D, so we can shoot again
            this.shotDown = false;
        }
    };
    
    // Now we create the player and assign it the ID "pc"
    var pc = new Player();
    engine.addEntity(pc, "pc");
    
    /*
     * Slugs are a basic enemy that just scroll downward with the map. And die.
     */
    var Slug = function(x, y) {
        engine.Entity.call(this); // Extend Entity
        
        // This time we pass the initial position of the slug into the
        // constructor
        this.x = x;
        this.y = y;
        this.z = 90;
        this.width = 16;
        this.height = 16;
        this.group = "enemy";
        
        // We'll use parentWave later to know when the wave is complete
        this.parentWave = null;
        
        this.graphic.img = "slug";
        this.graphic.fWidth = 16;
        this.graphic.fHeight = 16;
        this.graphic.anim = true;
        this.graphic.delay = 10;
        this.graphic.frameCount = 2;
    };
    util.extend(Slug, engine.Entity); // Extend Entity
    
    Slug.prototype.process = function() {
        this.y += 1;
        
        // If we're out of view, we need to die
        if (!this.inView()) {
            // Remove entity frees up all references to the entity from within
            // the engine, allowing Javascript to trash the object
            engine.removeEntity(this.id);
        }
    };
    
    // The onRemove function is run when the entity is removed from the engine
    Slug.prototype.onRemove = function() {
        // If this slug is dead, let the wave know that it has died
        if (this.parentWave != null) this.parentWave.enemyDead();
    };
    
    var Background = function() {
        tilemap.Tilemap.call(this); // Extend Entity
        this.x = 0;
        this.y = -240;
        this.z = -1;
        
        this.tileset = "tiles";
        this.mapWidth = 16;
        this.mapHeight = 30;
        this.tileWidth = 16;
        this.tileHeight = 16;
        this.map = [
            [4,4,3,2,0,0,0,0,0,0,0,0,0,3,4,4],
            [4,3,0,0,0,0,0,0,0,0,0,1,0,0,3,4],
            [4,3,0,0,0,0,0,0,0,0,0,0,0,0,4,4],
            [4,0,0,0,2,0,0,0,0,0,0,2,0,2,4,4],
            [4,4,4,1,0,0,0,0,0,0,0,0,0,0,3,4],
            [4,4,4,4,0,0,0,0,0,0,0,0,0,1,3,4],
            [4,3,4,3,0,0,0,0,0,0,0,0,0,4,4,4],
            [4,3,3,3,0,1,0,0,0,1,0,1,4,4,4,4],
            [4,0,3,0,0,0,0,0,0,0,0,0,4,4,4,4],
            [4,2,0,0,0,0,0,0,0,0,0,0,3,4,4,4],
            [4,0,1,0,0,0,0,0,0,0,0,0,3,3,4,4],
            [4,4,4,0,0,0,0,0,0,2,0,0,0,3,3,4],
            [4,4,4,0,0,0,0,0,0,0,0,0,1,4,3,4],
            [4,4,4,0,0,0,2,0,0,0,0,0,0,4,4,4],
            [4,4,3,0,1,0,0,0,0,0,0,0,2,3,4,4],
            [4,4,3,2,0,0,0,0,0,0,0,0,0,3,4,4],
            [4,3,0,0,0,0,0,0,0,0,0,1,0,0,3,4],
            [4,3,0,0,0,0,0,0,0,0,0,0,0,0,4,4],
            [4,0,0,0,2,0,0,0,0,0,0,2,0,2,4,4],
            [4,4,4,1,0,0,0,0,0,0,0,0,0,0,3,4],
            [4,4,4,4,0,0,0,0,0,0,0,0,0,1,3,4],
            [4,3,4,3,0,0,0,0,0,0,0,0,0,4,4,4],
            [4,3,3,3,0,1,0,0,0,1,0,1,4,4,4,4],
            [4,0,3,0,0,0,0,0,0,0,0,0,4,4,4,4],
            [4,2,0,0,0,0,0,0,0,0,0,0,3,4,4,4],
            [4,0,1,0,0,0,0,0,0,0,0,0,3,3,4,4],
            [4,4,4,0,0,0,0,0,0,2,0,0,0,3,3,4],
            [4,4,4,0,0,0,0,0,0,0,0,0,1,4,3,4],
            [4,4,4,0,0,0,2,0,0,0,0,0,0,4,4,4],
            [4,4,3,0,1,0,0,0,0,0,0,0,2,3,4,4]
        ];
    };
    util.extend(Background, tilemap.Tilemap); // Extend Tilemap
    
    Background.prototype.process = function() {
        this.y++;
        if (this.y >= 0) this.y = -240;
        
        // Move player backwards
        if (this.collides(pc.x, pc.y, pc.graphic.fWidth, pc.graphic.fHeight)) pc.y++;
    };
    
    Background.prototype.isSolid = function(x, y) {
        switch (this.map[y][x]) {
            case 3:
            case 4:
                return true;
            default:
                return false;
        }
    };
    
    // Instantiate Background
    var bg = new Background();
    engine.addEntity(bg);
    
    var Shot = function(x, y) {
        engine.Entity.call(this); // Extend Entity
        this.group = "shots";
        this.x = x;
        this.y = y;
        this.z = 99;
        this.width = 4;
        this.height = 8;
        
        this.graphic.img = "shot";
        this.graphic.fWidth = 4;
        this.graphic.fHeight = 8;
    };
    util.extend(Shot, engine.Entity); // Extend Entity
    
    Shot.prototype.process = function() {
        var oldY = this.y;
        this.y -= 8;
        
        // Shot check
        var shot = this;
        util.forEach(engine.groups["enemy"], function(enemyId, enemy) {
            if (util.boxCollide(
                shot.x, shot.y, shot.width, shot.height + (oldY - shot.y), 
                enemy.x, enemy.y, enemy.width, enemy.height)
            ) {
                engine.removeEntity(enemyId);
                engine.removeEntity(shot.id);
                return;
            }
        });
        
        if (!this.inView()) {
            engine.removeEntity(this.id);
        }
    };
    
    /**
     * An EnemyWave, as the name suggests, defines a preset wave of enemies.
     */
    var EnemyWave = function(props) {
        this.phaseCount = props.phaseCount;
        this.delay = props.delay;
        this.action = props.action;
        this.waveDone = false;
    
        if (typeof props.enemyCount != "undefined") {
            this.enemyCount = props.enemyCount;
        }
    };
    
    EnemyWave.prototype.enemyDead = function() {
        this.enemyCount--;
        if (this.enemyCount <= 0) this.waveDone = true;
    };
    
    // Spawns 10 slugs every 32 frames and waits for them to be gone
    var slugWave = new EnemyWave({
        phaseCount: 10,
        delay: 32,
        enemyCount: 10,
        action: function(phase) {
            var slug = new Slug(util.rand(4, 13) * 16, -12);
            slug.graphic.hflip = util.rand(0, 100) > 50;
            slug.parentWave = this;
            engine.addEntity(slug);
        }
    });
    
    waves.push(slugWave);
    
    var drawScore = function () {
        draw.fillRect(0, 0, 256, 16);
        draw.fillText("SCORE:", 8, 4);
    };
    
    /**
     * Waves work in phases. Each phase lasts a certain amount of time,
     * and when they're all done, we wait for the wave to be marked as
     * over, and move onto the next wave. 
     *
     * A phase typically corresponds to spawning a single enemy at a set
     * delay. 
     */
    engine.setCustomProcess(function() {
        // Grab the next wave if the current wave is done. 
        // If there are no more waves, game over!
        if (curWave == null) {
            curWave = waves.shift();
            
            if (typeof curWave == "undefined") {
                engine.setCustomDraw(function() {
                    drawScore();
                   // bg.drawCollision(pc.x, pc.y, pc.width, pc.height, engine.bufferCtx);
                    
                    draw.fillRect(88, 112, 80, 16);
                    draw.fillText("GAME OVER", 92, 116);
                });
                engine.setCustomProcess(function() {});
                return;
            } else {
                curPhase = 0;
                waveDelay = curWave.delay;
            }
        }
        
        // If the phases are done, wait until the wave ends and kill it
        // Otherwise, continue the current phase or move to the next one.
        if (curWave.phaseCount <= curPhase) {
            if (curWave.waveDone) curWave = null;
        } else if (waveDelay >= curWave.delay) {
            curWave.action(curPhase);
            curPhase++;
            waveDelay = 0;
        } else {
            waveDelay++;
        }
    });
    
    engine.setCustomDraw(function() {
        drawScore();
        //bg.drawCollision(pc.x, pc.y, pc.width, pc.height, engine.bufferCtx);
    });
});

/* 
 * Now we start the loader, which in turn loads all of our resources and starts
 * the engine. If a function is passed to start, it is run after the resources
 * are loaded, before the first engine cycle.
 * 
 * Here we use it to start the music.
 */
bdge.start(function() {
    var music = require("bdge/loader").getData("m_action");
    music.setLooping(true);
    music.play();
});

});