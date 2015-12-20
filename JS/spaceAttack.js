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
		this.config = {
			score: 0,
			level: 1,
			toKill: 10,
			lives: 3,
			width: canvas.width,
			height: canvas.height,
			fps: 50,
			shipPicSrc: "GFX/statek.png",
			rocketPicSrc: "GFX/rakieta.png",
			dronePicSrc: "GFX/alien.png",
			bomberPicSrc: "GFX/bomber.png",
			explosionPicSrc: "GFX/explosion.png",
			plasmaPicSrc: "GFX/plasma.png",
			fighterPicSrc: "GFX/fighter.png",
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
				this.stateStack.pop();
			}
			if(state.enter){
				state.enter();
			}
			this.stateStack.push(state);
		};
		this.removeState = function() {
			if(this.returnState) {
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
		this.drones = [];
		this.bombers = [];
		this.fighters = [];
		this.explosions = [];
		this.plasmas = [];
		this.droneTillSpawn = 0.6;
		this.droneSpawnTime;
		this.bomberTillSpawn = 2.3;
		this.bomberSpawnTime;
		this.fighterTillSpawn = 1.5;
		this.fighterSpawnTime;
		this.aliensLeft;
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
		this.Plasma = function(x, y){
			this.size = 20;
			this.speed = 300;
			this.x = x;
			this.y = y;
			this.plasmaPic = new Image();
			this.plasmaPic.src = game.config.plasmaPicSrc;
			this.draw = function() {
				ctx.drawImage(this.plasmaPic, this.x, this.y);
			}
		}
		this.Drone = function(x,speed){
			this.size = 60;
			this.speed = speed;
			this.value = 7;
			this.x= x;
			this.y = -60;
			this.vector = {x:0,y:1};
			this.dronePic = new Image();
			this.dronePic.src = game.config.dronePicSrc;
			this.draw = function() {
				ctx.drawImage(this.dronePic, this.x, this.y);
			};
		};
		this.Bomber = function(x,speed){
			this.size = 60;
			this.speed = speed*0.8;
			this.value = 12;
			this.x = x;
			this.y = -60;
			this.vector = {x:0,y:1};
			this.lastBombed = 2;
			this.bombInterval = 2;
			this.bomberPic = new Image();
			this.bomberPic.src = game.config.bomberPicSrc;
			this.draw = function() {
				ctx.drawImage(this.bomberPic, this.x, this.y);
			};
		};
		this.Fighter = function(x,speed){
			size = 40;
			this.speed = speed;
			this.value = 20;
			this.x = x;
			this.y = -60;
			this.vector = {x:1,y:1};
			this.lastBombed = 2
			this.bombInterval = 2;
			this.fighterPic = new Image();
			this.fighterPic.src = game.config.fighterPicSrc;
			this.draw = function() {
				ctx.drawImage(this.fighterPic, this.x, this.y);
			};
		}

		this.Explosion = function(x,y){
			this.size = 45;
			this.x = x;
			this.y= y;
			this.visibleTime = 0.5;
			this.visibleFor = 0;
			this.explosionPic = new Image();
			this.explosionPic.src = game.config.explosionPicSrc;
			this.draw = function() {
				ctx.drawImage(this.explosionPic, this.x, this.y);
			}
		}
		//main methods
		this.enter = function(){
			game.pressedKeys = {};
			this.ship = new this.Ship;
			this.aliensKilled = 0;
			this.rockets = [];
			this.drones = [];
			this.explosions = [];
			this.bombers = [];
			this.plasmas = [];
			this.fighters = [];
			this.droneSpawnTime = 2-((game.config.level/10)*2);
			this.bomberSpawnTime = 5-((game.config.level/10));
			this.fighterSpawnTime = 4-((game.config.level/10));
		};
		this.draw = function(){
			//clearing
			ctx.clearRect(0,0, game.config.width, game.config.height);
			//drawing actors
			this.ship.draw();
			for (var i = 0; i < this.rockets.length; i++) {
				this.rockets[i].draw();
			}
			for (var i = 0; i < this.explosions.length; i++) {
				this.explosions[i].draw();
			}
			for (var i = 0; i < this.drones.length; i++) {
				this.drones[i].draw();
			}
			for (var i = 0; i < this.bombers.length; i++) {
				this.bombers[i].draw();
			}
			for (var i = 0; i < this.fighters.length; i++) {
				this.fighters[i].draw();
			}
			for (var i = 0; i < this.plasmas.length; i++) {
				this.plasmas[i].draw();
			}
			//drawing UI
			ctx.font="20px Arial";
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = "left";
			ctx.fillText("score: "+game.config.score, 10, 20);
			ctx.fillText("level: "+game.config.level, 10, 38);
			for(i=1;i<=game.config.lives;i++){
				ctx.drawImage(this.ship.shipPic, 0, 0, 60, 60, game.config.width-(15*i), 5, 15, 15);
			};
			ctx.textAlign = "right";
			ctx.font="10px Arial";
			ctx.fillText("aliens left: "+this.aliensLeft, game.config.width-10, game.config.height - 10);
		};
		this.update = function(){
			this.aliensLeft = game.config.toKill-this.aliensKilled;
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
			this.updateDrones();
			this.updateBombers();
			this.updateFighters();
			this.updatePlasmas();
			this.updateExplosions();
			this.checkShipCannons();
			this.spawnDrone();
			if(game.config.level > 2) {
				this.spawnBomber();
			}
			if(game.config.level > 4) {
				this.spawnFighter();
			}
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
		//explosion methods
		this.updateExplosions = function(){
			for(var i = 0;i<this.explosions.length;i++) {
				this.explosions[i].visibleFor += 1/game.config.fps;
				if(this.explosions[i].visibleFor >= this.explosions[i].visibleTime) {
					this.explosions.splice(i,1);
				}
			}
		}
		//drone methods
		this.spawnDrone = function(){
			if(this.droneTillSpawn <= 0) {
				var x = Math.floor(Math.random()*(game.config.width-60))
				var speed = 100*((game.config.level/10*2)+1)
				this.drones.push(new this.Drone(x,speed));
				this.droneTillSpawn = this.droneSpawnTime;
			} else {
				this.droneTillSpawn -= 1/game.config.fps
			}
		};
		this.updateDrones = function() {
			for(var i = 0;i<this.drones.length;i++) {
				this.drones[i].x += this.drones[i].speed * this.drones[i].vector.x * 1/game.config.fps;
				this.drones[i].y += this.drones[i].speed * this.drones[i].vector.y * 1/game.config.fps;
				if(this.drones[i].y>game.config.height-50){
					game.config.lives--;
					this.drones.splice(i,1);
				}
			}
		};
		//bomber methods
		this.spawnBomber = function() {
			if(this.bomberTillSpawn <= 0) {
				var x = Math.floor(Math.random()*(game.config.width-60));
				var speed = 50*((game.config.level/10*2)+1);
				this.bombers.push(new this.Bomber(x, speed));
				this.bomberTillSpawn = this.bomberSpawnTime;
			} else {
				this.bomberTillSpawn -= 1/game.config.fps;
			}
		};
		this.updateBombers = function() {
			for(var i = 0;i<this.bombers.length;i++){
				var bomber = this.bombers[i];
				bomber.x += bomber.speed * bomber.vector.x * 1/game.config.fps;
				bomber.y += bomber.speed * bomber.vector.y * 1/game.config.fps;
				if(bomber.y >= (game.config.height-100)){
					bomber.vector.y = -1;
				}
				if(bomber.vector.y === -1 && bomber.y <= 10){
					bomber.vector.y = 1;
				}
				if(bomber.lastBombed <= 0) {
					this.plasmas.push( new this.Plasma(bomber.x+20,bomber.y+60))
					bomber.lastBombed = bomber.bombInterval;
				} else {
					bomber.lastBombed -= 1/game.config.fps;
				}
			};
		};

		//figher methods
		this.spawnFighter = function(){
			if(this.fighterTillSpawn <= 0){
				var x = Math.floor(Math.random()*(game.config.width-60));
				var speed = 350;
				this.fighters.push(new this.Fighter(x,speed))
				this.fighterTillSpawn = this.fighterSpawnTime;
			} else {
				this.fighterTillSpawn -= 1/game.config.fps
			}
		}
		this.updateFighters = function(){
			for(var i = 0; i<this.fighters.length;i++){
				var fighter = this.fighters[i];
				fighter.x += fighter.speed * fighter.vector.x * 1/game.config.fps;
				fighter.y += fighter.speed * fighter.vector.y * 1/game.config.fps;
				if(fighter.lastBombed <= 0) {
					this.plasmas.push( new this.Plasma(fighter.x+10,fighter.y+40))
					fighter.lastBombed = fighter.bombInterval	
				} else {
					fighter.lastBombed -= 1/game.config.fps
				}
				if(fighter.x <= 10 && fighter.vector.x === -1){
					fighter.vector.x = 1;
				}
				if(fighter.x >= game.config.width - 50 && fighter.vector.x === 1){
					fighter.vector.x = -1;
				}
				if(fighter.y <= 10 && fighter.vector.y === -1) {
					fighter.vector.y = 1;
				}
				if(fighter.y >= game.config.height-100 && fighter.vector.y === 1){
					fighter.vector.y = -1
				}
			}
		}

		this.updatePlasmas = function(){
			for(var i = 0;i<this.plasmas.length;i++) {
				this.plasmas[i].y += this.plasmas[i].speed * 1/game.config.fps;
				if(this.plasmas[i].y > game.config.height+20){
					this.plasmas.splice(i,1);
				}
			}
		};

		//collision method
		this.checkCollisions = function() {
			for(var i = 0;i<this.rockets.length;i++) {
				var rocket = this.rockets[i];
				for(var j = 0;j<this.drones.length;j++) {
					var drone = this.drones[j];
					if(rocket.x >= drone.x-(0.5*rocket.size) && rocket.x <= drone.x+45){
						if(rocket.y >= drone.y && rocket.y <= drone.y+(0.5*rocket.size)){
							this.drones.splice(j,1);
							this.rockets.splice(i,1);
							game.config.score += drone.value;
							this.aliensKilled++;
							this.explosions.push(new this.Explosion(drone.x, drone.y))
						}
					} 
				}
				for(var k = 0;k<this.bombers.length;k++) {
					var bomber = this.bombers[k];
					if(rocket.x >= bomber.x-(0.5*rocket.size) && rocket.x <= bomber.x+45){
						if(rocket.y >= bomber.y && rocket.y <= bomber.y+(0.5*rocket.size)){
							this.bombers.splice(k,1);
							this.rockets.splice(i,1);
							game.config.score += bomber.value;
							this.aliensKilled++;
							this.explosions.push(new this.Explosion(bomber.x, bomber.y))
						}
					} 
				}
				for(var m = 0;m<this.fighters.length;m++) {
					var fighter = this.fighters[m];
					if(rocket.x >= fighter.x-(0.5*rocket.size) && rocket.x <= (fighter.x+40)){
						console.log("wchodzi x")
						if(rocket.y >= fighter.y && rocket.y <= fighter.y+(0.5*rocket.size)){
							console.log("wchodzi y")
							this.fighters.splice(m,1);
							this.rockets.splice(i,1);
							game.config.score += fighter.value;
							this.aliensKilled++;
							this.explosions.push(new this.Explosion(fighter.x, fighter.y))
						}
					}
				}
			}
			for(var i = 0;i<this.plasmas.length;i++) {
				var plasma = this.plasmas[i];
				var ship = this.ship;
				if(plasma.x >= ship.x+5 && plasma.x <= ship.x+55){
					if(plasma.y-15 >= ship.y && plasma.y <= ship.y+60){
						game.config.lives--;
						this.plasmas.splice(i,1);
					}
				}
			}
		};
	};

	// game state end

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
			ctx.fillText("GAME OVER", game.config.width / 2, game.config.height/2 - 80);
			ctx.font="23px Arial";
			ctx.fillText("Aliens have invaded the Earth :(", game.config.width / 2, game.config.height/2-50);
			ctx.fillText("Press 'Space' to continue.", game.config.width / 2, game.config.height/2);
		};
		this.enter = function(){
			game.config.level = 1;
			game.config.score = 0;
			game.config.toKill = 10;
			game.config.lives = 3;
		};
		this.keyDown = function(key){
			if(key === 32 ){ // Spacja
				game.changeState(game.gameStates.menuState);
			} 
		};
	}
}