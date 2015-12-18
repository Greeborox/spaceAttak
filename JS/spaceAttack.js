function startSpaceAttack(){
	var gameBackground = document.getElementById("background");
	var gameBoard = document.getElementById("game");
	var game = new SpaceAttack(gameBoard, gameBackground, BgObj);
	game.initSpaceAttack();
}

//MAIN OBIEKT

var SpaceAttack = function(canvas, background, bgObj){
	var that = this;
	// POLA
	this.bgBoard = background;
	this.canvas = canvas;
	this.background = new bgObj(this.bgBoard);
	this.gameStates = {};

	// METODY
	this.initSpaceAttack = function(){
		this.game = new this.GameEngine(canvas, this.gameLoop, this.gameStates);
		this.gameStates.gameState = new this.GameState(this.game);
		this.gameStates.menuState = new this.MenuState(this.game);
		this.gameStates.pauseState = new this.PauseState(this.game);
		this.background.initbg();
		this.game.start();
		this.activateKeyboard();	
	};
	this.activateKeyboard = function() {
		window.addEventListener("keydown", function keydown(e) {
			var keycode = e.which || window.event.keycode;
			if(keycode == 37 || keycode == 39 || keycode == 32) {
				e.preventDefault();
			}
			that.game.keyDown(keycode);
		});
		window.addEventListener("keyup", function keydown(e) {
			var keycode = e.which || window.event.keycode;
			that.game.keyUp(keycode);
		});
	};
	this.gameLoop = function(game){
		var currentState = game.returnState();
		if(currentState) {
			if(currentState.update) {
				currentState.update();
			}
			if(currentState.draw) {
				currentState.draw();
			}
		}
	}

	// OBIEKTY

	this.GameEngine = function(gameBoard, gameLoop, gameStates){
		// POLA
		var that = this;
		this.gameBoard = gameBoard;
		this.gameLoop = gameLoop;
		this.gameStates = gameStates;
		this.config = {
			width: canvas.width,
			height: canvas.height,
			fps: 50,
			shipPicSrc: "GFX/statek.png",
			rocketPicSrc: "GFX/rakieta.png",
			alienPicSrc: "GFX/alien.png",
		};
		this.stateStack = [];
		this.pressedKeys = {};

		// METODY
		this.returnState = function() {
			if(this.stateStack.length < 0) {
				return null;
			} else {
				return this.stateStack[this.stateStack.length-1];
			}
		};
		this.changeState = function(state) {
			if(this.returnState) {
				if(this.returnState.leave){
					this.returnState.leave();
				}
				this.stateStack.pop();
			}
			if(state.enter){
				state.enter();
			}
			this.stateStack.push(state);
		};
		this.removeState = function() {
			if(this.returnState) {
				if(this.returnState.leave){
					this.returnState.leave();
				}
				this.stateStack.pop();
			}
		};
		this.addState = function(state) {
			console.log(state)
			if(state.enter){
				state.enter();
			}
			this.stateStack.push(state);
		};
		this.start = function() {
			this.changeState(this.gameStates.menuState);
			this.intervalID = setInterval(function(){that.gameLoop(that)},1000/that.config.fps);
		};
		this.keyDown = function(key){
			this.pressedKeys[key] = true;
			if(this.returnState() && this.returnState().keyDown){
				this.returnState().keyDown(key);
			}
		};
		this.keyUp = function(key){
			delete this.pressedKeys[key];
		};
	};

	this.MenuState = function(game){
		var ctx = game.gameBoard.getContext("2d");
		this.draw = function(){
			ctx.clearRect(0,0, game.config.width, game.config.height);
			ctx.font="40px Arial";
	    ctx.fillStyle = '#ffffff';
	    ctx.textBaseline="center";
	    ctx.textAlign="center";
	    ctx.fillText("WELCOME TO THE GAME", game.config.width / 2, game.config.height/2 - 50);
	    ctx.font="23px Arial";
	    ctx.fillText("Press 'Space' to start.", game.config.width / 2, game.config.height/2);
		};
		this.keyDown = function(key){
			if(key === 32 ){ // Spacja
				game.changeState(game.gameStates.gameState);
			} 
		};
	};

	this.GameState = function(game){
		var ctx = game.gameBoard.getContext("2d");
		this.rockets = [];
		this.aliens = [];
		this.alienTillSpawn = 1;
		this.alienSpawnTime = 1.4;
		//objects
		this.Ship = function(){
			this.size = 60;
			this.speed = 250;
			this.y = game.config.height - this.size - 5;
			this.x = (Math.floor(game.config.width/2))-(this.size/2);
			this.shipPic = new Image();
			this.shipPic.src = game.config.shipPicSrc;
			this.cooldownTime = 0.4;
			this.coolingDown = 0;
			this.onCooldown = false;
			this.draw = function() {
				ctx.drawImage(this.shipPic, this.x, this.y)
			};
		};
		this.Rocket = function(x){
			this.size = 30;
			this.speed = 500;
			this.x = x;
			this.y = game.config.height - 80;
			this.rocketPic = new Image();
			this.rocketPic.src = game.config.rocketPicSrc;
			this.draw = function() {
				ctx.drawImage(this.rocketPic, this.x, this.y)
			};
		};
		this.Alien = function(x){
			this.size = 60;
			this.speed = 200;
			this.x= x;
			this.y = -60;
			this.alienPic = new Image();
			this.alienPic.src = game.config.alienPicSrc;
			this.draw = function() {
				ctx.drawImage(this.alienPic, this.x, this.y)
			};
		};
		//main methods
		this.enter = function(){
			game.pressedKeys = {};
			this.ship = new this.Ship
		};
		this.draw = function(){
			ctx.clearRect(0,0, game.config.width, game.config.height);
			this.ship.draw();
			for (var i = 0; i < this.rockets.length; i++) {
				this.rockets[i].draw();
			}
			for (var i = 0; i < this.aliens.length; i++) {
				this.aliens[i].draw();
			}
		};
		this.update = function(){
			if(game.pressedKeys[37]) {
				if(this.ship.x > 0){
					this.ship.x -= this.ship.speed * 1/game.config.fps;
				}
			}
			if(game.pressedKeys[39]) {
				if(this.ship.x < game.config.width - this.ship.size){
					this.ship.x += this.ship.speed * 1/game.config.fps;
				}
			}
			if(game.pressedKeys[32]) {
				if(!this.ship.onCooldown){
					this.fireRocket(this.ship.x+15);
					this.ship.onCooldown = true;
				}
			}
			if(game.pressedKeys[80]) {
				game.addState(game.gameStates.pauseState)
			}
			this.updateRockets();
			this.updateAliens();
			this.checkShipCannons();
			this.spawnAlien();
			this.checkCollisions();
		};
		//rocket methods
		this.fireRocket = function(x){
			this.rockets.push(new this.Rocket(x))
			console.log(this.rockets.length);
		};
		this.updateRockets = function(){
			for(var i = 0;i<this.rockets.length;i++) {
				this.rockets[i].y -= this.rockets[i].speed * 1/game.config.fps;
				if(this.rockets[i].y <= -40){
					this.rockets.splice(i,1);
				}
			}
		};
		this.checkShipCannons = function(){
			if(this.ship.onCooldown){
				this.ship.coolingDown += 1/game.config.fps;
				if(this.ship.coolingDown > this.ship.cooldownTime){
					this.ship.onCooldown = false;
					this.ship.coolingDown = 0;
				}
			}
		};
		//alien methods
		this.spawnAlien = function(){
			if(this.alienTillSpawn <= 0) {
				var x = Math.floor(Math.random()*(game.config.width-60))
				this.aliens.push(new this.Alien(x));
				this.alienTillSpawn = this.alienSpawnTime;
				console.log("alien incoming!")
			} else {
				this.alienTillSpawn -= 1/game.config.fps
			}
		};
		this.updateAliens = function() {
			for(var i = 0;i<this.aliens.length;i++) {
				this.aliens[i].y += this.aliens[i].speed * 1/game.config.fps;
			}
		};
		//collision method
		this.checkCollisions = function() {
			for(var i = 0;i<this.rockets.length;i++) {
				var rocket = this.rockets[i];
				for(var j = 0;j<this.aliens.length;j++) {
					var alien = this.aliens[j];
					if(rocket.x >= alien.x && rocket.x <= alien.x+alien.size){
						if(rocket.y >= alien.y && rocket.y <= alien.y+alien.size){
							this.aliens.splice(j,1);
							this.rockets.splice(i,1);
						}
					} 
				}
			}
		}
	};

	this.PauseState = function(game){
		var ctx = game.gameBoard.getContext("2d");
		this.draw = function(){
			ctx.font="40px Arial";
	    ctx.fillStyle = '#ffffff';
	    ctx.textBaseline="center";
	    ctx.textAlign="center";
	    ctx.fillText("GAME PAUSED", game.config.width / 2, game.config.height/2 - 50);
	    ctx.font="23px Arial";
	    ctx.fillText("Press 'Space' to continue.", game.config.width / 2, game.config.height/2);
		};
		this.keyDown = function(key){
			if(key === 32 ){
				game.removeState();
			} 
		};
	};
}