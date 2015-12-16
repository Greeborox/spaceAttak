function startSpaceAttack(){
	var gameBackground = document.getElementById("background");
	var gameBoard = document.getElementById("game");
	var game = new Game(gameBackground, gameBoard, Background, Ship, Rocket)
	game.initGame();
}

function Game(gameBackground, gameBoard, backgroundObj, shipObj, rocketObj){
	var that = this;
	this.fps = 60;
	this.gameBackground = gameBackground;
	this.backgroundHandler = new backgroundObj(this.gameBackground, this.fps) ;
	this.gameBoard = gameBoard;
	this.ctx = this.gameBoard.getContext("2d");
	this.shipPicSrc = "GFX/statek.png"
	this.rocketPicSrc = "GFX/rakieta.png"
	this.ship = new shipObj(this.shipPicSrc,this.gameBoard,this.fps)
	this.rocket = rocketObj;
	this.actors = [];
	this.initBackground = function(){
		this.backgroundHandler.initbg();
	}
	this.initGame = function() {
		this.initBackground();
		this.makeKeysWork();
		this.actors.push(this.ship);
		intervalID = setInterval(function(){
			that.drawActors();
			that.updateActors();
		},1000/that.fps)		
	}
	this.updateActors = function(){
		for (var i = 0; i < this.actors.length; i++) {
			if(this.actors[i].entityType === "ship"){
				var ship = this.actors[i]
				if(ship.onCooldown){
					ship.cooldownTimer--;
					if(ship.cooldownTimer === 0) {
						ship.onCooldown = false;
					}
				}
			}
			if(this.actors[i].entityType === "rocket") {
				var rocket = this.actors[i]
				rocket.update();
				if(rocket.offBoard){
					this.actors.splice(i,1);
				}
			}
		}
	}
	this.drawActors = function() {
		this.ctx.clearRect(0,0,this.gameBoard.width,this.gameBoard.height);
		for (var i = 0; i < this.actors.length; i++) {
			this.actors[i].draw();
		}
	}
	this.makeKeysWork = function() {
		window.addEventListener("keydown", function keydown(e) {
			var keycode = e.which || window.event.keycode;
			if(keycode == 37 /*LEFT*/ || keycode == 39 /*RIGHT*/) {
	    	e.preventDefault();
	    	that.moveShip(keycode);
			}
			if(keycode == 32 /*SPACE*/){
				e.preventDefault();
	    	that.fireRocket();
			}
		});
	}
	this.moveShip = function(code){
		this.ship.move(code);
	}
	this.fireRocket = function() {
		if(!(this.ship.onCooldown)){
			this.ship.onCooldown = true;
			this.ship.cooldownTimer = this.ship.cannonCooldownTime;
			this.actors.push(new this.rocket(this.rocketPicSrc,this.gameBoard,this.fps,this.ship.x+15));
		}
	}
}

function Ship(pic, canvas, fps){
	var that = this;
	this.onCooldown = false;
	this.cooldownTimer = 0;
	this.entityType = "ship";
	this.speed = 200;
	this.fps = fps;
	this.cannonCooldownTime = this.fps*0.6;
	this.picture = pic;
	this.size = 60;
	this.canvas = canvas;
	this.ctx = this.canvas.getContext("2d");
	this.y = this.canvas.height - this.size - 5;
	this.x = (Math.floor(this.canvas.width/2))-(this.size/2);
	this.shipPic = new Image();
	this.shipPic.src = this.picture;
	this.draw = function() {
		this.ctx.drawImage(this.shipPic, that.x, that.y)
	}
	this.move = function(code){
		switch(code){
			case 37:
				if(this.x > 10){
					this.x -= (this.speed*(1/this.fps))
				}
				break;
			case 39:
				if(this.x < canvas.width - this.size - 10){
					this.x += (this.speed*(1/this.fps))
				}
				break;
		}
	}
}

function Rocket(pic,canvas,fps,x){
	var that = this;
	this.speed = 500;
	this.entityType = "rocket";
	this.fps = fps;
	this.pic = pic;
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	this.x = x;
	this.y = this.canvas.height - 80;
	this.size = 30;
	this.offBoard = false;
	this.rocketPic = new Image();
	this.rocketPic.src = this.pic
	this.update = function(){
		this.y -= (1/this.fps) * this.speed;
		if(this.y < -20) {
			this.offBoard = true;
		}
	}
	this.draw = function(){
		this.ctx.drawImage(this.rocketPic, this.x, this.y)
	}
}

function Background(canvas, fps) {
	var that = this;
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	this.width = canvas.width;
	this.height = canvas.height;
	this.starsNum = 100;
	this.stars = [];
	this.minStarSize = 2;
	this.maxStarSize = 6;
	this.fps = fps;
	this.minStarSpeed = 10;
	this.maxStarSpeed = 75;
	this.initStars = function() {
		for(var i = 0; i<this.starsNum; i++) {
			var star = {};
			star.x = Math.floor(Math.random() * this.width);
			star.y = Math.floor(Math.random() * this.height);
			star.size = Math.floor(Math.random() * (this.maxStarSize - this.minStarSize) + this.minStarSize);
			star.speed = Math.floor(Math.random() * (this.maxStarSpeed - this.minStarSpeed) + this.minStarSpeed);
			this.stars.push(star);
		}	
	};
	this.updateStars = function(){
		var timeChange = 1/this.fps;
		for (var i = 0; i<this.stars.length; i++) {
			this.stars[i].y += timeChange * this.stars[i].speed;
			if(this.stars[i].y > this.height) {
				this.stars[i].y = 0;
			}
		}
	};
	this.drawStars = function() {
		this.ctx.clearRect(0,0,this.width, this.height);
		for(var i = 0; i<this.stars.length; i++) {
			this.ctx.beginPath();
      this.ctx.rect(this.stars[i].x, this.stars[i].y, this.stars[i].size, this.stars[i].size);
      this.ctx.fillStyle = '#E1FC44';
      this.ctx.fill();
		}
	};
	this.initbg = function() {
		this.initStars();
		var starsMovingInterval = setInterval(function(){
			that.updateStars();
			that.drawStars();
		}, 1000/that.fps);
	}
}