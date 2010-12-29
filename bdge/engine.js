/**
 *	BDGEngine - Badly Designed Game Engine
 *
 *	Game engine intended for use with Mozilla Chromeless
 *	Be warned, there's probably lots and lots of problems. :D
 *
 *	@author Michael Kelly <Osmose1000@gmail.com>
 **/
var bdge = {};

var engine = {
	canvas: null,
	ctx: null,
	viewCanvas: null,
	viewCtx: null,
	width: 256,
	height: 240,
	scaleWidth: 256,
	scaleHeight: 240,
	scale: 1,
	fps: 30,
	bgColor: "#000000",
	title: "BDGE Game Engine",
	showFps: false,
	
	// Each cycle the first function in the process queue is grabbed and executed
	processQueue: [],
	
	// Classes contains the object classes
	classes: {},
	
	// Objects references are stored in three lists
	objects: {},	// Used for object id lookups
	groups: {},		// Used for looking up objects by group. First index is group id, second is object id
	zOrderList: new SortedArray(function(a, b) {	// Used to maintain a painting order
		return a.z - b.z;
	}),	
	
	camera: {
		x: 0,
		y: 0,
		width: 256,
		height: 240
	},
	
	isChromeless: navigator.userAgent.indexOf("Chromeless") !== -1,
	
	myprocess: null,
	mydraw: null,
	
	init: function(containerId, width, height, scale) {
		// Takeover errors ASAP
		window.onerror = function(msg, url, line) {
			alert(msg + "(" + url + ":" + line + ")");
		};
		
		this.width = width;
		this.height = height;
		this.camera.width = width;
		this.camera.height = height;
		
		this.scale = scale;
		this.scaleWidth = width * scale;
		this.scaleHeight = height * scale;
	
		var container = document.getElementById(containerId);
		
		// Buffer
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
		this.canvas.setAttribute('height', height);
		this.canvas.setAttribute('width', width);
		
		this.viewCanvas = document.createElement("canvas");
		this.viewCtx = this.viewCanvas.getContext("2d");
		this.viewCanvas.setAttribute('height', height);
		this.viewCanvas.setAttribute('width', width);
		this.viewCanvas.style.width = this.scaleWidth + "px";
		this.viewCanvas.style.height = this.scaleHeight + "px";
		
		if (this.isChromeless) {
			window.innerWidth = this.scaleWidth;
			window.innerHeight = this.scaleHeight;
		}
		
		// Bind keyboard events
		document.onkeydown = bdge.input.keydown;
		document.onkeyup = bdge.input.keyup;
		
		container.appendChild(this.viewCanvas);
	},
	
	_gameInitFunction: null,
	gameInit: function(func) {
		this._gameInitFunction = func;
	},
	
	_drawFrames: 0,
	_processFrames: 0,
	fpsMonitorDelay: new Date().getTime(),
	monitorFps: function() {
		if (new Date().getTime() - this.fpsMonitorDelay > 1000) {
			document.title = this.title + "(Proc:" + this._processFrames + ",Draw:" + this._drawFrames + ")";
			this._drawFrames = 0;
			this._processFrames = 0;
			this.fpsMonitorDelay = new Date().getTime();
		}
	},
	
	// Main game loop
	_msPerFrame: 0,
	_frameskip: 0,
	_fskid: 0,
	_frameStart: 0,
	_timing: {
		lowidle: 0,
		hiidle: 5,
		minfs: 0,
		maxfs: 5
	},
	cycle: function() {
		this._frameStart = (new Date()).getTime();
		
		// Perform process queue function if it exists
		var p = this.processQueue.shift();
		if (typeof p == "function") p(this);
	
		this.process();
		this._processFrames++;
		
		// Draw if we can afford it
		if (this._fskid >= this._frameskip) {
			this.draw(this.ctx);
			this._drawFrames++;
			this._fskid = 0;
		} else {
			this._fskid++;
		}
		
		this.monitorFps();
		
		// Timing scheme adapted from Akihabara :D
		// Set framestart to when the next frame SHOULD'VE started
		this._frameStart = this._msPerFrame - ((new Date()).getTime() - this._frameStart);
		
		// Adjust frameskip if we're moving too slow or too quickly
		if (this._frameStart < this._timing.lowidle && this._frameskip < this._timing.maxfs) this._frameskip++;
		if (this._frameStart > this._timing.hiidle && this._frameskip > this._timing.minfs) this._frameskip--;
		
		// Wait (or not if we can't afford it)
		setTimeout(this._timeoutCycle, (this._frameStart <= 0 ? 1 : this._frameStart));
	},
	
	// SetTimeout doesn't preserve the scope, so we have to use
	// this function instead because I like the this keyword :D
	_timeoutCycle: function() {
		engine.cycle();
	},
	
	start: function(fps) {
		this.fps = fps;
		this._msPerFrame = 1000 / this.fps;
		
		if (this._splashUrl != null) {
			this._splashImg = new Image();
			this._splashImg.onload = function() {
				bdge.loader.load();
				bdge.util.wait(
					function() {
						engine.ctx.drawImage(engine._splashImg, 0, 0, 256, 240, 0, 0, 256, 240);
						return bdge.loader.doneLoading;
					}, 
					function() {
						if (typeof engine._gameInitFunction == "function") engine._gameInitFunction();
						engine.cycle();
					}
				);
			};
			this._splashImg.src = this._splashUrl;
		}
	},
	
	_splashImg: null,
	_splashUrl: null,
	setSplashImage: function(url) {
		this._splashUrl = url;
	},
	
	// Game logic and drawing
	process: function() {
		// Handle animations
		var obj;
		this.zOrderList.iter(function(index, obj) {
			if (obj.graphic.anim) {
				if (obj.graphic.framesSinceLast >= obj.graphic.delay) {
					obj.graphic.framesSinceLast = 0;
					obj.graphic.curFrame = (obj.graphic.curFrame + 1) % obj.graphic.frameCount;
				} else {
					obj.graphic.framesSinceLast++;
				}
			}
			
			obj.process();
		});
		
		// Custom processing
		if (typeof this.myprocess == "function") this.myprocess();
	},
	
	draw: function(ctx) {
		// Clear background
		ctx.save();
		ctx.fillStyle = this.bgColor;
		ctx.fillRect(0, 0, this.width, this.height);
		ctx.restore();
		
		// Draw objects
		this.zOrderList.iter(function(index, obj) {
			obj.draw(ctx);
		});
		
		// Custom drawing
		if (typeof this.mydraw == "function") this.mydraw(ctx);
		
		// Draw buffer to screen
		this.viewCtx.drawImage(this.canvas, 0, 0);
	},
	
	setProcess: function(proc) {
		this.myprocess = proc;
	},
	
	setDraw: function(proc) {
		this.mydraw = proc;
	},
	
	// Objects
	lastObjId: 0,
	
	createObjClass: function (id, objClass) {
		this.mergeProps(objClass, {
			parent: id,
			group: "",
			process: function() {},
			draw: function(ctx) {
				var g = this.graphic;
				var img = bdge.loader.get(g.img);
				if (img != null && engine.inView(this.x, this.y, g.fWidth, g.fHeight)) {
					engine.ctx.save();
					engine.ctx.scale((g.hflip ? -g.scale : g.scale), (g.vflip ? -g.scale : g.scale));
					engine.ctx.drawImage(img, g.curFrame * g.fWidth, 0, g.fWidth, g.fHeight, this.x - engine.camera.x, this.y - engine.camera.y, g.fWidth, g.fHeight);
					engine.ctx.restore();
				}
			},
			graphic: {
				img: null,
				vflip: false,
				hflip: false,
				scale: 1,
				anim: false,
				curFrame: 0,
				frameCount: 0,
				fWidth: 0,
				fHeight: 0,
				delay: 0,	// NOTE: Delay is in frames, not seconds
				framesSinceLast: 0
			},
			x: 0,
			y: 0,
			z: 0,
			width: 0,
			height: 0
		});
		
		this.classes[id] = objClass;
		
		if (typeof this.groups[objClass.group] == "undefined") this.groups[objClass.group] = [];
	},
	
	createObj: function (classId, objId) {
		if (typeof objId == "undefined") objId = this.lastObjId++;
		
		var obj = $.extend(true, {}, this.classes[classId]);
		this.mergeProps(obj, {
			id: objId
		});
		
		this.groups[obj.group][objId] = obj;
		this.objects[objId] = obj;
		this.zOrderList.add(obj);
		
		return obj;
	},
	
	destroyObj: function (objId) {
		var obj = this.objects[objId];
		
		if (typeof obj != undefined) {
			delete this.objects[objId];
			delete this.groups[obj.group][objId];
			this.zOrderList.removeItem(obj, function(a, b) {
				return (a.id == b.id ? 0 : -1);
			});
			
			if (typeof obj.onDestroy == "function") {
				obj.onDestroy();
			}
		}
	},
	
	mergeProps: function (orig, add) {
		for (prop in add) {
			if (!(prop in orig)) {
				orig[prop] = add[prop];
			} else if (typeof add[prop] == "object") {
				this.mergeProps(orig[prop], add[prop]);
			}
		}
	},
	
	objCollide: function(obj1, obj2) {
		return this.boxCollide(obj1.x, obj1.y, obj1.width, obj1.height, obj2.x, obj2.y, obj2.width, obj2.height);
	},
	
	// Tilemaps
	drawTileMap: function(map, img, dx, dy, width, height, tileWidth, tileHeight) {
		var tileNum;
		for (var ty = 0; ty < height; ty++) {
			for (var tx = 0; tx < width; tx++) {
				tileNum = map[ty][tx];
				this.ctx.drawImage(img, tileNum * tileWidth, 0, tileWidth, tileHeight, dx + (tx * tileWidth), dy + (ty * tileHeight), tileWidth, tileHeight);
			}
		}
	},
	
	// Collision
	boxCollide: function(x1, y1, w1, h1, x2, y2, w2, h2) {
		var r1 = x1 + w1;	// Right side
		var r2 = x2 + w2;	
		var b1 = y1 + h1;	// Bottom side
		var b2 = y2 + h2;
		
		if (b1 < y2) return false;
		if (y1 > b2) return false;
		
		if (r1 < x2) return false;
		if (x1 > r2) return false;
		
		return true;
	},
	
	// Camera
	cameraEdgeCollide: function(x, y, width, height) {
		if (x < this.camera.x) return true;
		if (y < this.camera.y) return true;
		if (x + width > this.camera.x + this.camera.width) return true;
		if (y + height > this.camera.y + this.camera.height) return true;
		
		return false;
	},
	
	inView: function(x, y, width, height) {
		return this.boxCollide(x, y, width, height, this.camera.x, this.camera.y, this.camera.width, this.camera.height);
	},
	
	globalFont: "10px Arial",
	globalFontFill: "#000000",
	drawText: function(text, x, y, fill, font) {
		if (typeof fill == "undefined") fill = this.globalFontFill;
		if (typeof font == "undefined") font = this.globalFont;
		
		this.ctx.save();
		this.ctx.font = font;
		this.ctx.fillStyle = fill;
		this.ctx.textAlign = "left";
		this.ctx.textBaseline = "top";
		this.ctx.fillText(text, x + this.camera.x, y + this.camera.y);
		this.ctx.restore();
	},
	
	globalRectFill: "#000000",
	drawRect: function(x, y, width, height, fill) {
		if (typeof fill == "undefined") fill = this.globalRectFill;
		
		this.ctx.save();
		this.ctx.fillStyle = fill;
		this.ctx.fillRect(x, y, width, height);
		this.ctx.restore();
	}
};

bdge.input = {
	keys: {},
	map: {},
	keydown: function(e) {
		var input = bdge.input;
		if (input.map[e.keyCode] != undefined) {
			input.keys[input.map[e.keyCode]] = true;
		}
		
		if (typeof this.customKeyDown == "function") this.customKeyDown(e);
	},
	keyup: function(e) {
		var input = bdge.input;
		if (input.map[e.keyCode] != undefined) {
			input.keys[input.map[e.keyCode]] = false;
		}
		
		if (typeof this.customKeyUp == "function") customKeyDown(e);
	},
	customKeyDown: null,
	customKeyUp: null,
	map: function(name, keyCode) {
		this.map[keyCode] = name;
		this.keys[name] = false;
	},

	// Keycodes
	DOWN: 40,
	UP: 38,
	LEFT: 37,
	RIGHT: 39,
	D: 68,
	F: 70
};

bdge.loader = {
	_resources: {},
	_resourceCount: 0,
	_resourcesLoaded: 0,
	
	doneLoading: true,
	
	get: function(id) {
		return this._resources[id].data;
	},
	
	registerResource: function(id, url, type) {
		this._resources[id] = {
			url: url,
			type: type,
			loaded: false,
			data: null
		};
		
		this._resourceCount++;
		this.doneLoading = false;
	},
	
	load: function() {
		for (id in this._resources) {
			switch (this._resources[id].type) {
				case "image":
					this._resources[id].data = new Image();
					this._resources[id].data.onload = function() {
						bdge.loader._resourcesLoaded++;
						if (bdge.loader._resourceCount == bdge.loader._resourcesLoaded) bdge.loader.doneLoading = true;
					};
					this._resources[id].data.src = this._resources[id].url;
					break;
			}
		}
	}
};

bdge.util = {
	wait: function(conditionFunc, finishFunc) {
		var waitFunc = function() {
			if (conditionFunc()) {
				finishFunc();
			} else {
				setTimeout(waitFunc, 10);
			}
		};
		
		waitFunc();
	},
	
	rand: function(min, max) {
		return min + Math.floor(Math.random() * (max - min));
	},
	
	// Does a for-in and avoids prototype-added stuff
	forEach: function(object, func) {
		for (var id in object) {
			if (object.hasOwnProperty(id)) {
				func(id, object[id]);
			}
		}
	}
};

/**
 *	Maintains a sorted array and places items in the array
 *	based on a comparitor function. Ordering is smallest to
 *	largest.
 */
function SortedArray(comparitor) {
	this.array = [];
	this.comparitor = comparitor;
	
	this.add = function(item) {
		var pos = 0;
		while(pos < this.array.length && this.comparitor(item, this.array[pos]) > 0) pos++;
		this.array.splice(pos, 0, item);
	};
	
	this.removeIndex = function(index) {
		return this.array.splice(index, 1);
	};
	
	this.get = function(index) {
		return this.array[index];
	};
	
	this.set = function(index, val) {
		this.array[index] = val;
	};
	
	// Optional comparitor, uses the one from the constructor
	// if none is provided. 
	this.removeItem = function(item, comp) {
		if (typeof comp == "undefined") comp = this.comparitor;
		
		for (var k = 0; k < this.array.length; k++) {
			if (comp(item, this.array[k]) == 0) {
				return this.removeIndex(k);
			}
		}
		
		return false;
	};
	
	// First argument to func is the index, second is value
	this.iter = function(func) {
		for (var k = 0; k < this.array.length; k++) {
			func(k, this.array[k]);
		}
	};
}