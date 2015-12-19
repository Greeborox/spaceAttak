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
		this.gameStates.levelAnnounce = new this.LevelAnnouncement(this.game);
		this.gameStates.gameOver = new this.GameOver(this.game);
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
		this.score = 0;
		this.config = {
			level:1,
			toKill: 10,
			lives: 3,
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
				game.changeState(game.gameStates.levelAnnounce);
			} 
		};
	};

	this.LevelAnnouncement = function(game){
		var ctx = game.gameBoard.getContext("2d");
		this.displayTime = 1.2;
		this.timer = 0;
		this.draw = function() {
			ctx.clearRect(0,0, game.config.width, game.config.height);
			ctx.font="40px Arial";
	    ctx.fillStyle = '#ffffff';
	    ctx.textBaseline="center";
	    ctx.textAlign="center";
	    ctx.fillText("Entering Level: "+game.config.level, game.config.width / 2, game.config.height/2 - 50);
	    ctx.font="23px Arial";
	    ctx.fillText("Get Ready!", game.config.width / 2, game.config.height/2);
		};
		this.update = function() {
			if(this.timer >= this.displayTime) {
				game.changeState(game.gameStates.gameState);
			} else {
				this.timer += 1/game.config.fps;
			}
		};
		this.enter = function() {
			this.timer = 0;
		};
	}

	this.GameState = function(game){
		var ctx = game.gameBoard.getContext("2d");
		this.aliensKilled = 0;
		this.rockets = [];
		this.aliens = [];
		this.alienTillSpawn = 1;
		this.alienSpawnTime = 1.4-((game.config.level/10)*2);
		//objects
		this.Ship = function(){
			this.size = 60;
			this.speed = 350;
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
			this.speed = 400;
			this.x = x;
			this.y = game.config.height - 80;
			this.rocketPic = new Image();
			this.rocketPic.src = game.config.rocketPicSrc;
			this.draw = function() {
				ctx.drawImage(this.rocketPic, this.x, this.y)
			};
		};
		this.Alien = function(x,speed){
			this.size = 60;
			this.speed = speed;
			this.value = 7
			this.x= x;
			this.y = -60;
			this.alienPic = new Image();
			this.alienPic.src = game.config.alienPicSrc;
			this.draw = function() {
				ctx.drawImage(this.alienPic, this.x, this.y);
			};
		};
		//main methods
		this.enter = function(){
			game.pressedKeys = {};
			this.ship = new this.Ship;
			this.aliensKilled = 0;
			this.rockets = [];
			this.aliens = [];	
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
			ctx.font="20px Arial";
	    ctx.fillStyle = '#ffffff';
	    ctx.fillText("score: "+game.score, 60, 18);
	    ctx.fillText("level: "+game.config.level, 50, 38);
	    for(i=1;i<=game.config.lives;i++){
				ctx.drawImage(this.ship.shipPic, 0, 0, 60, 60, game.config.width-(15*i), 5, 15, 15);
	    };
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
			if(this.aliensKilled >= game.config.toKill) {
				game.config.level++;
				game.config.toKill+=5;
				game.changeState(game.gameStates.levelAnnounce);
			}
			if(game.config.lives <= 0) {
				game.changeState(game.gameStates.gameOver);
			}
		};
		//rocket methods
		this.fireRocket = function(x){
			this.rockets.push(new this.Rocket(x))
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
				var speed = 100*((game.config.level/10*2)+1)
				this.aliens.push(new this.Alien(x,speed));
				this.alienTillSpawn = this.alienSpawnTime;
			} else {
				this.alienTillSpawn -= 1/game.config.fps
			}
		};
		this.updateAliens = function() {
			for(var i = 0;i<this.aliens.length;i++) {
				this.aliens[i].y += this.aliens[i].speed * 1/game.config.fps;
				if(this.aliens[i].y>game.config.height-50){
					game.config.lives--;
					this.aliens.splice(i,1);
				}
			}
		};
		//collision method
		this.checkCollisions = function() {
			for(var i = 0;i<this.rockets.length;i++) {
				var rocket = this.rockets[i];
				for(var j = 0;j<this.aliens.length;j++) {
					var alien = this.aliens[j];
					if(rocket.x >= alien.x-(0.5*rocket.size) && rocket.x <= alien.x+45){
						if(rocket.y >= alien.y && rocket.y <= alien.y+(0.5*rocket.size)){
							this.aliens.splice(j,1);
							this.rockets.splice(i,1);
							game.score += alien.value;
							this.aliensKilled++;
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

	this.GameOver = function(game){
		var ctx = game.gameBoard.getContext("2d");
		this.draw = function(){
			ctx.clearRect(0,0, game.config.width, game.config.height);
			ctx.font="40px Arial";
	    ctx.fillStyle = '#ffffff';
	    ctx.textBaseline="center";
	    ctx.textAlign="center";
	    ctx.fillText("GAME OVER", game.config.width / 2, game.config.height/2 - 50);
	    ctx.font="23px Arial";
	    ctx.fillText("Aliens have invaded the Earth :(", game.config.width / 2, game.config.height/2);
		}
	}
}