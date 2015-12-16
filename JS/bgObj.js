BgObj = function (canvas) {
		var that = this;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.width = canvas.width;
		this.height = canvas.height;
		this.starsNum = 100;
		this.stars = [];
		this.minStarSize = 2;
		this.maxStarSize = 6;
		this.fps = 60;
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
	};