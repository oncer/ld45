class Bar extends Phaser.Sprite
{
	constructor(target)
	{
		super(game, 0, 0);
		this.target = target;
		this.bg = target.addChild(game.make.sprite(target.width/2 - 32, - 26, 'bar_bg'));
		this.fg = target.addChild(game.make.sprite(target.width/2 - 32 + 2, -24, 'bar_fg'));
		this.barWidth = this.fg.width;
		this.barHeight = this.fg.height;
		this.setVisible(false);
		this.cropRect = new Phaser.Rectangle(0, 0, this.barWidth, this.barHeight);
		this.hideTime = 1000;
		this.hideCountdown = 0;
		this.targetPercent = 0;
		this.percent = 0;
	}

	setDirection(dir)
	{
		this.fg.scale.x = dir;
		if (dir < 0) {
			this.fg.x = this.target.width / 2 + 30;
		} else {
			this.fg.x = this.target.width / 2 - 30;
		}
	}

	update()
	{
		this.fg.scale.x = this.target.scale.x;

		if (this.visible) {
			var delta = game.time.elapsed / 2000;
			var tp = this.targetPercent > 0 ? this.targetPercent : 1;
			if (this.percent < tp)
			{
				this.percent = Math.min(this.percent + delta, tp);
			} else if (this.percent > tp)
			{
				this.percent = Math.max(this.percent - delta, tp);
			}
		}

		this.cropRect = new Phaser.Rectangle(0, 0, this.barWidth * this.percent, this.barHeight);
		if (!this.fg._frame) {
			this.destroy();
			return;
		}
		this.fg.crop(this.cropRect);

		if (this.hideCountdown > 0) {
			this.hideCountdown -= game.time.elapsed;
			if (this.hideCountdown <= 0) {
				this.setVisible(false);
			} else {
				this.setAlpha(this.hideCountdown / this.hideTime);
			}
		} else if (this.visible && this.alpha < 1) {
			this.setAlpha(Math.min(1, this.alpha + game.time.elapsed / 1000));
		}
	}

	setPercent(percent)
	{
		this.targetPercent = percent;
		if (percent == 0) {
			this.hide();
		} else if (!this.visible && this.targetPercent > 0) {
			this.show();
		}
	}

	setVisible(visible)
	{
		this.visible = this.bg.visible = this.fg.visible = visible;
	}

	setAlpha(alpha)
	{
		this.alpha = this.bg.alpha = this.fg.alpha = alpha;
	}

	show()
	{
		this.setAlpha(0);
		this.setVisible(true);
	}

	hide()
	{
		this.hideCountdown = this.hideTime;
	}
}

class InteractiveObject extends Phaser.Sprite
{
	constructor(x, y, sprite, cWidth, cHeight, cX, cY)
	{
		super(game, x, y, sprite)
		game.physics.p2.enable(this);
		this.body.clearShapes();
		this.body.addRectangle(cWidth, cHeight, cX, cY);

		this.bar = game.add.existing(new Bar(this));
		this.setDirection(1);
	}

	setDirection(dir)
	{
		this.direction = dir;
		this.scale.x = dir;
		this.bar.setDirection(dir);
	}
}

class StaticObject extends InteractiveObject
{
	constructor(x, y, sprite, cWidth, cHeight, cX, cY)
	{
		super(x, y, sprite, cWidth, cHeight, cX, cY)
		var gstate = game.state.getCurrentState();
		this.body.cg = gstate.staticCG;
		this.body.setCollisionGroup(this.body.cg);
		if (sprite === 'vampirebat') {
			gstate.livingGroup.add(this); // exception for vampirebat
		} else {
			gstate.staticGroup.add(this);
		}
		this.body.collides([gstate.bgCG, gstate.draggedCG]);
		this.animations.add('idle', [0,1,2,3], 4, true);
		this.animations.play('idle');
	}
}

class Corpse extends StaticObject
{
	constructor(x, y)
	{
		super(x, y, 'corpse', 32, 16, 0, 8);
		this.decayAnim = this.animations.add('decay', [1,2,3,4,5,6,7], 1, false);
		this.decayAnim.onComplete.add(this.decay, this);
		this.animations.play('idle');
		this.decayed = false;
		this.countdown = 4000;
	}

	update()
	{
		if (this.decayed) {
			this.alpha -= game.time.elapsed / 5000;
			if (this.alpha < 0) {
				this.alpha = 0;
				this.destroy();
			}
		} else if (this.countdown > 0) {
			this.countdown -= game.time.elapsed;
			if (this.countdown <= 0) {
				this.decayAnim.play();
			}
		}
	}

	decay()
	{
		game.state.getCurrentState().spawnMaggot(this);
		//game.state.getCurrentState().spawnPoof(this.x, this.y);
		this.decayed = true;
	}
}

class CorpseZombie extends StaticObject
{
	constructor(x, y)
	{
		super(x, y, 'corpsezombie', 32, 16, 0, 8);
		this.totemAnim = this.animations.add('spawntotem', [4,5,6,7], 10, false);
		this.totemAnim.onComplete.add(this.spawnTotem, this);
		this.animations.play('idle');
		this.canGet = true;
	}
	
	spawnTotem()
	{		
		new BirdTotem(this.x, this.y, 'birdtotem');
		this.destroy();
		//game.state.getCurrentState().spawnPoof(this.x, this.y);
	}
}

class CorpsePumpkin extends StaticObject
{
	constructor(x, y)
	{
		super(x, y, 'corpsepumpkin', 32, 16, 0, 8);
		this.saladAnim = this.animations.add('spawnsalad', [4,5,6,7], 1, false);
		this.saladAnim.onComplete.add(this.spawnSalad, this);
		this.canGet = true;
	}
	
	spawnSalad()
	{
		new Salad(this.x, this.y+10);
		this.destroy();
	}
}

class CorpseVampire extends StaticObject
{
	constructor(x, y)
	{
		super(x, y, 'corpsevampire', 32, 16, 0, 8);
		this.tomatoAnim = this.animations.add('spawntomato', [4,5,6,7], 1, false);
		this.tomatoAnim.onComplete.add(this.spawnTomato, this);
		this.animations.play('idle');
		this.canGet = true;
	}
	
	spawnTomato()
	{
		new Tomato(this.x, this.y+10);
		this.destroy();
	}
}

class BirdTotem extends StaticObject
{
	constructor(x, y, type)
	{
		super(x, y, type, 32, 32, 0, 0);
		this.type = type;
		this.maggotCount = 0;
		this.setDirection(Math.random() < 0.5 ? -1 : 1);
		this.animations.add('eat', [4,5,6,7], 8, true);
		this.eatTimer = 0;
		this.seedTimer = 0;

		if (type === 'birdtotemblood') {
			this.canGet = true;
			this.eatTimer = 2000 + Math.random() * 1000;
			this.animations.play('eat');
			this.maxMaggots = 2;
			this.bar.setPercent(this.maggotCount / this.maxMaggots);
		} else {
			this.canGet = false;
			this.spawnAnim = this.animations.add('spawn', [10,11,12,13], 8, false);
			this.spawnAnim.onComplete.add(this.spawnAnimEnd, this);
			this.animations.play('spawn');
			this.maxMaggots = 4;
		}
	}
	
	spawnAnimEnd()
	{
		this.animations.play('idle');
		this.canGet = true;
	}

	isEating()
	{
		return this.eatTimer > 0;
	}

	update()
	{
		if (this.eatTimer > 0) {
			this.eatTimer -= game.time.elapsed;
			if (this.eatTimer <= 0) {
				this.maggotCount++;
				this.bar.setPercent(this.maggotCount / this.maxMaggots);
				this.animations.play('idle');

				if (this.maggotCount >= this.maxMaggots) {
					this.seedTimer = 2000;
					this.maggotCount = 0;
					this.bar.setPercent(0);
				}
			}
		}

		if (this.seedTimer > 0) {
			this.seedTimer -= game.time.elapsed;
			if (this.seedTimer <= 0) {
				var x = this.x + 20 * this.direction;
				var y = this.y;
				if (this.type === 'birdtotem') {
					new Seed(x, y);
				} else if (this.type === 'birdtotemblood') {
					new SeedTriangle(x, y);
				}
				game.state.getCurrentState().spawnPoof(x, y);
			}
		}
	}

	eatMaggot(obj)
	{
		obj.destroy();
		if (this.type === 'birdtotem' && obj.type === 'maggotblood') {
			// bird totem turns into blood totem
			new BirdTotem(this.x, this.y, 'birdtotemblood');
			game.state.getCurrentState().spawnPoof(this.x, this.y);
			this.destroy();
		} else {
			this.eatTimer = 2000 + Math.random() * 1000;
			this.animations.play('eat');
		}
	}
}

// not really "static" because it will fly around
class VampireBat extends StaticObject
{
	constructor(x, y)
	{
		super(x, y, 'vampirebat', 32, 32, 0, 0);
		this.animations.stop();
		this.animations.play('idle', 20);
		this.cow = null;
		this.state = 0; // wait and search
		this.stateCountdown = 8000;
		var gstate = game.state.getCurrentState();
	}

	findCow()
	{
		var gstate = game.state.getCurrentState();
		var cows = [];
		for (let obj of gstate.livingGroup.children) {
			if (obj instanceof Cow && obj.type === 'cow'
					&& obj.x > 32 && obj.y < game.world.width - 32) {
				cows.push(obj);
			}
		}
		if (cows.length == 0) return null;
		return cows[Math.floor(Math.random() * cows.length)];
	}

	update()
	{
		this.body.angularVelocity = 0;

		if (this.cow && !this.cow._frame && this.state !== 0) { // cow has been destroyed!!!
			// retreat!
			this.state = 0;
			this.stateCountdown = 8000;
			this.cow = null;
		}

		this.stateCountdown -= game.time.elapsed;
		if (this.state === 0) { // wait and search
			if (this.y > 70) {
				this.body.velocity.y = -200;
				this.body.velocity.x = 100 * Math.sin(game.time.now / 500);
			}
			if (this.stateCountdown <= 0) {
				this.cow = this.findCow();
				if (this.cow != null) {
					this.state = 1;
					this.stateCountdown = 5000;
					this.bringToTop();
				}
			}
		} else if (this.state === 1) { // catch a cow
			this.body.velocity.x = 50 * Math.sin(game.time.now / 500);
			if (this.x > this.cow.x) this.body.velocity.x -= 100;
			if (this.x < this.cow.x) this.body.velocity.x += 100;
			if (Math.abs(this.x - this.cow.x) > 32 && this.y > 150) {
				this.body.velocity.y = -100;
			} else {
				if (this.y > this.cow.y) {
					this.body.velocity.y = -100;
				}
			}
			if (Phaser.Math.distance(this.x, this.y, this.cow.x, this.cow.y) < 16) {

				var gstate = game.state.getCurrentState();
				gstate.spawnCowVampire(this.cow.x, this.cow.y, this.cow.direction);
				gstate.spawnPoofBlood(this.x, this.y);
				if (gstate.draggedBody && gstate.draggedBody.parent.sprite === this.cow) {
					console.log("dragged cow vampire");
					gstate.draggedBody = undefined;
					if (gstate.mouseSpring !== undefined) {
						game.physics.p2.removeConstraint(gstate.mouseSpring);
						gstate.mouseSpring = undefined;
					}
				}
				this.cow.destroy();
				this.destroy();
			}
		}
	}
}

class DraggableObject extends InteractiveObject
{
	constructor(x, y, sprite, cWidth, cHeight, cX, cY)
	{
		super(x, y, sprite, cWidth, cHeight, cX, cY);
		var gstate = game.state.getCurrentState();
		this.body.cg = gstate.livingCG;
		this.body.setCollisionGroup(this.body.cg);
		gstate.livingGroup.add(this);
		this.body.collides(gstate.bgCG, gstate.draggableCollides, gstate);
		this.body.collides(gstate.draggedCG);
		//this.body.collides(gstate.bgSidesCG);
		this.body.angularDamping = 0.995;

		//this.body.addRectangle(32, 32, 0, 0);
		this.animations.add('idle', [0,1,2,3], 4, true);
		if (this.animations.frameTotal > 4) {
			this.animations.add('walk', [4,5,6,7], 4, true);
		} else {
			this.animations.add('walk', [0], 1, true);
		}
		if (this.animations.frameTotal > 8) {
			this.animations.add('drag', [8], 1, true);
		} else {
			this.animations.add('drag', [0], 1, true);
		}
		if (this.animations.frameTotal > 9) {
			this.animations.add('highlight', [9], 1, true);
		} else {
			this.animations.add('highlight', [0], 1, true);
		}
		this.animations.play('idle');
		
		this.isOnGround = true;
		this.justSpawned = true;		
		this.canBeDragged = true;
	}

	update()
	{
		if (this.isOnGround)
		{
			this.body.rotation = 0;
		}
		this.prevY = this.body.velocity.y;
		
		if (!this.justSpawned && (this.x < -40 || this.x > game.world.width + 40)) {
			console.log("draggable out of bounds, destroyed");
			this.destroy();
		}
		if (this.justSpawned && (this.x > 32 && this.x < game.world.width - 32)) {
			this.justSpawned = false;
		}
	}

	deadlyImpact()
	{
		console.log("deadlyImpact not implemented!");
	}
}

class Seed extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'seed', 18, 18, 0, 0);
	}
}

class SeedTriangle extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'seedtriangle', 18, 18, 0, 0);
	}
}

class Tomato extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'tomato', 15, 15, 0, 0);
	}
}

class Pumpkin extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'pumpkin', 20, 12, 0, 0);
	}
}

class PumpkinSalad extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'pumpkinsalad', 32, 21, 0, 0);
		this.transformAnim = this.animations.add('transform', [10,11,12,13], 10, false);
		this.transformAnim.onComplete.add(this.transformAnimEnd, this);
		this.animations.play('idle');
	}
	
	transformAnimEnd()
	{
		// create bat
		new VampireBat(this.x, this.y);
		this.destroy();
	}
}

class Salad extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'salad', 18, 18, 0, 0);
	}
}

class Maggot extends DraggableObject
{
	constructor(x, y, type)
	{
		super(x, y, type, 20, 10, 0, 0);
		this.type = type;
		this.state = 0; // wait
		this.setDirection(1); // right
		this.stateTimer = 1000;
		this.animations.getAnimation('idle').onLoop.add(this.animationLooped, this);
		this.animations.getAnimation('walk').onLoop.add(this.animationLooped, this);
		
		if (type === 'maggot') {
			this.alpha = 0;
			game.add.tween(this).to( { alpha: 1 }, 1000, Phaser.Easing.Linear.None, true);
		}
	}

	animationLooped(sprite, anim)
	{
		if (!this.isOnGround) return;
		switch (this.state)
		{
			case 0: 
				if (this.stateTimer <= 0) {
					this.state = 1;
					this.stateTimer = Math.random() * 2000 + 1000;
					if (this.x <= 100) {
						this.setDirection(1);
					} else if (this.x >= game.world.width - 100) {
						this.setDirection(-1);
					} else {
						this.setDirection(Math.random() < 0.5 ? -1 : 1);
					}
					this.animations.play('walk', 8);
				}
				break;
			case 1:
				if (this.stateTimer <= 0) {
					this.state = 0;
					this.stateTimer = Math.random() * 4000 + 1500;
					this.animations.play('idle');
					this.body.velocity.x = 0;
				}
				break;
		}
	}

	update()
	{
		super.update();
		if (!this.isOnGround) return;
		this.stateTimer -= game.time.elapsed;
		if (this.state == 1) {
				this.body.velocity.x = 16 * this.direction;
		}
	}

	deadlyImpact()
	{
		// nothing happens...
	}
}

////// pumpkin zombie (copy maggot, but change a bit)
class PumpkinZombie extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'pumpkinzombie', 20, 14, 0, 0);
		this.state = 0; // wait
		this.setDirection(1); // right
		this.stateTimer = 1000;
		this.animations.getAnimation('idle').onLoop.add(this.animationLooped, this);
		this.animations.getAnimation('walk').onLoop.add(this.animationLooped, this);
		this.saladCounter = 0;
	}
	
	eatSalad()
	{
		if (this.saladCounter < 4)
			this.saladCounter += 1;
		else
		{
			// change to PumpkinSalad
			new PumpkinSalad(this.x, this.y);
			game.state.getCurrentState().spawnPoof(this.x, this.y);
			this.destroy();
		}
	}

	animationLooped(sprite, anim)
	{
		if (!this.isOnGround) return;
		switch (this.state)
		{
			case 0: 
				if (this.stateTimer <= 0) {
					this.state = 1;
					this.stateTimer = Math.random() * 2000 + 1000;
					if (this.x <= 100) {
						this.setDirection(1);
					} else if (this.x >= game.world.width - 100) {
						this.setDirection(-1);
					} else {
						this.setDirection(Math.random() < 0.5 ? -1 : 1);
					}
					this.animations.play('walk', 8);
				}
				break;
			case 1:
				if (this.stateTimer <= 0) {
					this.state = 0;
					this.stateTimer = Math.random() * 4000 + 1500;
					this.animations.play('idle');
					this.body.velocity.x = 0;
				}
				break;
		}
	}

	update()
	{
		super.update();
		if (!this.isOnGround) {
			this.state = 0;
			return;
		}
		this.stateTimer -= game.time.elapsed;
		if (this.state == 1) {
				this.body.velocity.x = 16 * this.direction;
		} else {
				this.body.velocity.x = 0;
		}
	}

	deadlyImpact()
	{
		// nothing happens...
	}
}

class Cow extends DraggableObject
{
	constructor(x, y, type)
	{
		super(x, y, type, 28, 20, 0, 0);
		this.type = type;
		this.state = 0; // wait
		this.setDirection(1); // right
		this.stateTimer = 1000;
		this.maggotCount = 0;
		this.maxMaggots = 2;
		if (type === 'cowzombie') {
			this.bar.percent = 0.5; // for 1 out of 2 maggots
			this.bar.targetPercent = 1;
			this.bar.setVisible(true);
			this.bar.setAlpha(1);
			this.bar.hide();
		}
	}

	eatMaggot(obj)
	{
		obj.destroy();
		this.maggotCount++;
		this.bar.setPercent(this.maggotCount / this.maxMaggots);
		var gstate = game.state.getCurrentState();
		if (this.maggotCount >= this.maxMaggots) {
			gstate.spawnCowZombie(this.x, this.y, this.direction);
			this.destroy();
		}
		gstate.spawnPoof(obj.x, obj.y);
	}

	update()
	{
		super.update();
		if (!this.isOnGround) return;
		this.stateTimer -= game.time.elapsed;
		switch (this.state)
		{
			case 0: 
				if (this.stateTimer <= 0) {
					this.state = 1;
					this.stateTimer = Math.random() * 1000 + 1000;
					if (this.x <= 100) {
						this.setDirection(1);
					} else if (this.x >= game.world.width - 100) {
						this.setDirection(-1);
					} else {
						this.setDirection(Math.random() < 0.5 ? -1 : 1);
					}
					this.animations.play('walk');
				}
				break;
			case 1:
				this.body.velocity.x = 15 * this.direction;
				if (this.stateTimer <= 0 && !this.justSpawned) {
					this.state = 0;
					this.stateTimer = Math.random() * 2000 + 1500;
					this.animations.play('idle');
					this.body.velocity.x = 0;
				}
				break;
		}
	}

	deadlyImpact()
	{
		if (this.type === 'cowvampire') {
			game.state.getCurrentState().spawnCorpseVampire(this);
		} else if (this.type === 'cowpumpkin') {
			game.state.getCurrentState().spawnCorpsePumpkin(this);
		} else if (this.type === 'cowzombie') {
			game.state.getCurrentState().spawnCorpseZombie(this);
		} else {
			game.state.getCurrentState().spawnCorpse(this);
		}
	}
}

class GameState extends Phaser.State
{
	preload ()
	{
		game.load.image('bg', 'gfx/background.png');
		game.load.image('bgfloor', 'gfx/background_floor.png');
		game.load.image('bar_bg', 'gfx/bar_bg.png');
		game.load.image('bar_fg', 'gfx/bar_fg.png');
		game.load.spritesheet("cow", 'gfx/cow.png', 32, 32);
		game.load.spritesheet("cowzombie", 'gfx/cow_zombie.png', 32, 32);
		game.load.spritesheet("cowpumpkin", 'gfx/cow_pumpkin.png', 32, 32);
		game.load.spritesheet("cowvampire", 'gfx/cow_vampire.png', 32, 32);
		game.load.spritesheet("corpse", 'gfx/corpse.png', 32, 32);
		game.load.spritesheet("corpsezombie", 'gfx/corpse_zombie.png', 32, 32);
		game.load.spritesheet("corpsepumpkin", 'gfx/corpse_pumpkin.png', 32, 32);
		game.load.spritesheet("corpsevampire", 'gfx/corpse_vampire.png', 32, 32);
		game.load.spritesheet("maggot", 'gfx/maggot.png', 32, 32);
		game.load.spritesheet("maggotblood", 'gfx/maggot_blood.png', 32, 32);
		game.load.spritesheet("pumpkin", 'gfx/pumpkin.png', 32, 32);
		game.load.spritesheet("pumpkinzombie", 'gfx/pumpkin_zombie.png', 32, 32);
		game.load.spritesheet("pumpkinsalad", 'gfx/pumpkin_salad.png', 32, 32);
		game.load.spritesheet("seed", 'gfx/seed.png', 32, 32);
		game.load.spritesheet("seedtriangle", 'gfx/seed_triangle.png', 32, 32);
		game.load.spritesheet('gore', 'gfx/gore.png', 16, 16);
		game.load.spritesheet('poof', 'gfx/poof.png', 32, 32);
		game.load.spritesheet('poofblood', 'gfx/poof_blood.png', 32, 32);
		game.load.spritesheet('birdtotem', 'gfx/bird_totem.png', 32, 32);
		game.load.spritesheet('birdtotemblood', 'gfx/bird_totem_blood.png', 32, 32);
		game.load.spritesheet("salad", 'gfx/salad.png', 32, 32);
		game.load.spritesheet("vampirebat", 'gfx/bat.png', 32, 32);
		game.load.spritesheet("tomato", 'gfx/tomato.png', 32, 32);
		
		//game.load.spritesheet('propeller', 'gfx/propeller.png', 16, 64, 4);
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		//game.load.audio('music', 'sfx/theme.ogg');
	}

	spawnGoreParticles(x, y, minVelX, maxVelX)
	{
		this.spawnPoofBlood(x, y);
		
		this.goreEmitter.x = x;
		this.goreEmitter.y = y;
		this.goreEmitter.setXSpeed(minVelX, maxVelX);

		this.goreEmitter.start(false, 2000, 15, 20);
	}

	spawnPoof(x, y)
	{
		var ymin = Math.min(y, this.spawnObjY);
		var poof = game.add.sprite(x, ymin, 'poof');
		poof.anchor.set(0.5, 0.25);
		var anim = poof.animations.add('poof');
		anim.onComplete.add(function(sprite, anim){
			sprite.destroy();
		});
		anim.play(30);
	}

	spawnPoofBlood(x, y)
	{
		var ymin = Math.min(y, this.spawnObjY);
		var poof = game.add.sprite(x, ymin, 'poofblood');
		poof.anchor.set(0.5, 0.25);
		var anim = poof.animations.add('poofblood');
		anim.onComplete.add(function(sprite, anim){
			sprite.destroy();
		});
		//anim.play(15);
		anim.play(20);
	}
		
	spawnMaggot(obj)
	{
		new Maggot(obj.x, this.spawnObjY + 16, 'maggot');
	}

	spawnMaggotBlood(obj)
	{
		new Maggot(obj.x, this.spawnObjY + 16, 'maggotblood');
	}
	
	spawnCorpse(obj)
	{
		this.spawnGoreParticles(obj.x, obj.y, -100, 100);
		//new Corpse(obj.x, obj.y);
		new Corpse(obj.x, this.spawnObjY);
		obj.destroy();
	}

	spawnCorpseZombie(obj)
	{
		this.spawnGoreParticles(obj.x, obj.y, -100, 100);
		new CorpseZombie(obj.x, this.spawnObjY);
		obj.destroy();
	}
	
	spawnCorpsePumpkin(obj)
	{
		this.spawnGoreParticles(obj.x, obj.y, -100, 100);
		new CorpsePumpkin(obj.x, this.spawnObjY);
		obj.destroy();
	}
	
	spawnCorpseVampire(obj)
	{
		this.spawnGoreParticles(obj.x, obj.y, -100, 100);
		new CorpseVampire(obj.x, this.spawnObjY);
		obj.destroy();
	}
	
	spawnCowPumpkin(x, y, direction)
	{
		var cow = new Cow(x, y, 'cowpumpkin');
		cow.direction = direction;
	}

	spawnCowZombie(x, y, direction)
	{
		var cow = new Cow(x, y, 'cowzombie');
		cow.setDirection(direction);
	}

	spawnCowVampire(x, y, direction)
	{
		var cow = new Cow(x, y, 'cowvampire');
		cow.setDirection(direction);
	}

	spawnCow(x, y)
	{
		var cow = new Cow(x, y, 'cow');
		return cow;
	}

	create ()
	{
		// cow reset timer
		this.cowtimer = 1000;
		
		// mouse shall not be used below this value
		this.maxMouseY = 232;

		// use this to spawn objects at that position when they should spawn on the floor
		this.spawnObjY = 224;
	
		// game physics
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.gravity.y = 600;
		game.physics.p2.friction = 0.4;
		game.physics.p2.applyDamping = true;
		game.physics.p2.setImpactEvents(true);
	  
		this.bg = game.add.sprite(0, 0, 'bg');
		this.bgfloor = game.add.sprite(0, 0, 'bgfloor');

		this.staticCG = game.physics.p2.createCollisionGroup();
		this.staticGroup = game.add.group();

		this.livingCG = game.physics.p2.createCollisionGroup();
		this.livingGroup = game.add.group();

		this.draggedCG = game.physics.p2.createCollisionGroup();
		this.dragContactSprites = new Set();
		
		// bg collision
		this.bgCollision = game.add.sprite(0, 0);		
		game.physics.p2.enable(this.bgCollision);
		this.bgCollision.body.clearShapes();
		// floor:
		this.bgCollision.body.addRectangle(2048, 96, 0, 288);
		// ceil:
		this.bgCollision.body.addRectangle(2048, 64, 0, 0 - 256);
		this.bgCollision.body.static = true;
		this.bgCollision.body.gravity = 0;
		this.bgCG = game.physics.p2.createCollisionGroup();
		this.bgCollision.body.setCollisionGroup(this.bgCG);
		this.bgCollision.body.collides(this.livingCG);
		this.bgCollision.body.collides(this.staticCG);
		
		// sides:
		/*
		this.bgCollisionSides = game.add.sprite(0, 0);
		game.physics.p2.enable(this.bgCollisionSides);
		this.bgCollisionSides.body.clearShapes();
		this.bgCollisionSides.body.addRectangle(64, 512, 0 - 48, 0);
		this.bgCollisionSides.body.addRectangle(64, 512, 512 + 48, 0);
		this.bgCollisionSides.body.static = true;
		this.bgCollisionSides.body.gravity = 0;
		this.bgCollisionSides.body.collides(this.livingCG);
		this.bgSidesCG = game.physics.p2.createCollisionGroup();
		this.bgCollisionSides.body.setCollisionGroup(this.bgSidesCG);
		*/
		
		// spawn the first cow
		this.spawnCow(128, 240 - 10);

		game.world.setBounds(0, 0, 512, 864);
		game.camera.scale.setTo(2);

		var style = { font: "14px Consolas", fill: "#ff004c", align: "center" };
		this.debugText = game.add.text(256, 240, "debug text", style);
		this.debugText.anchor.set(0.5);
		this.debugText.exists = false;
		
		// gore emitter
		this.goreEmitter = game.add.emitter(0, 0, 100);
		this.goreEmitter.makeParticles('gore', [0,1,2,3,4,5,6], 300);
		this.goreEmitter.gravity = 400;
		this.goreEmitter.setXSpeed(-50,-50);
		this.goreEmitter.setYSpeed(-150,-25);

		// drag collision
		this.mouseBody = game.add.sprite(0, 0);
		game.physics.p2.enable(this.mouseBody);
		this.mouseBody.body.setCircle(1);
		this.mouseBody.body.static = true;
		this.mouseCG = game.physics.p2.createCollisionGroup();
		this.mouseBody.body.setCollisionGroup(this.mouseCG);

		
		//define soundeffects
		//this.wavesAudio = game.add.audio('wavesAudio');
		
		//play ocean waves audio
		/*this.wavesAudio.onDecoded.add(function(){
			if (!this.start) {
				this.wavesAudio.play('', 0, 0, true);
				this.wavesAudio.fadeTo(1000, 0.3);
			}
		}, this);*/

		this.addDebugKeys();
		
		game.input.onDown.add(this.mouseClick, this);
		game.input.addMoveCallback(this.mouseMove, this);
		game.input.onUp.add(this.mouseRelease, this);

		game.camera.flash('#000000');
	}

	mouseClick(pointer)
	{
		this.setMousePointerBounds();
		
		//console.log(pointer.position);
		var pointerPos = new Phaser.Point(pointer.x / game.camera.scale.x,
			pointer.y / game.camera.scale.y);
		// var mousePos = new Phaser.Point(this.mouseBody.x / game.camera.scale.x,
			// this.mouseBody.y / game.camera.scale.y);
		var mousePos = new Phaser.Point(this.mouseBody.body.x,this.mouseBody.body.y);

		// enable to not take cows etc. when mouse is below ground
		//if (pointerPos.y > this.maxMouseY + 16 / game.camera.scale.y) return;
		
		var bodies = game.physics.p2.hitTest(mousePos, this.livingGroup.children);
		this.draggedBody = undefined;
		for (let body of bodies) {
			if (body.parent.sprite instanceof DraggableObject && body.parent.sprite.canBeDragged) {
				this.draggedBody = body;
			}
		}
		if (this.draggedBody)
		{
			this.draggedBody.parent.sprite.bringToTop();
			this.draggedBody.parent.sprite.isOnGround = false;
			this.draggedBody.parent.sprite.animations.play('drag');
			
			var localPointInBody = [0, 0];
			var physicsPos = [game.physics.p2.pxmi(mousePos.x), game.physics.p2.pxmi(mousePos.y)];    
			this.draggedBody.toLocalFrame(localPointInBody, physicsPos);
			
			// use a revoluteContraint to attach mouseBody to the clicked body
			this.mouseSpring = this.game.physics.p2.createRevoluteConstraint(this.mouseBody, [0, 0], this.draggedBody, [game.physics.p2.mpxi(localPointInBody[0]), game.physics.p2.mpxi(localPointInBody[1]) ]);
			this.draggedBody.parent.setCollisionGroup(this.draggedCG);
			this.draggedBody.parent.collides([this.livingCG, this.staticCG]);
			this.draggedBody.parent.data.shapes[0].sensor = true;
			this.draggedBody.parent.onBeginContact.add(this.dragContactBegin, this);
			this.draggedBody.parent.onEndContact.add(this.dragContactEnd, this);
		}
	}

	mouseMove(pointer, x, y, isDown)
	{
		this.mouseBody.body.x = x / game.camera.scale.x;
		this.mouseBody.body.y = y / game.camera.scale.y;
	}

	mouseRelease(pointer)
	{
		if (this.mouseSpring !== undefined)
		{
			game.physics.p2.removeConstraint(this.mouseSpring);
			this.mouseSpring = undefined;
			if (this.draggedBody) {
				this.draggedBody.parent.sprite.animations.play('idle');
				this.draggedBody.parent.setCollisionGroup(this.draggedBody.parent.cg);
				this.draggedBody.parent.removeCollisionGroup([this.livingCG, this.staticCG], true);
				this.draggedBody.parent.onBeginContact.removeAll();
				this.draggedBody.parent.data.shapes[0].sensor = false;
				this.draggedBody = undefined;
			}

			if (this.dragContactFn) {
				this.dragContactFn();
				this.dragContactSprites.clear();
				this.dragContactFn = undefined;
			}
		}	
	}


	dragContactBegin(body, bodyB, shapeA, shapeB, equation)
	{
		var sprite = body.sprite;
		var dragSprite = this.draggedBody.parent.sprite;
		this.dragContactSprites.add(sprite);
	}

	dragContactEnd(body, bodyB, shapeA, shapeB)
	{
		if (!this.draggedBody) return;
		var sprite = body.sprite;
		var dragSprite = this.draggedBody.parent.sprite;
		this.dragContactSprites.delete(sprite);
		if (this.dragContactSprites.size == 0)
		{
			dragSprite.animations.play('drag');
			this.dragContactSprite = undefined;
			this.dragContactFn = undefined;
		}
	}

	updateDragCombines()
	{
		this.dragContactFn = undefined;
		if (!this.draggedBody) return;
		var dragSprite = this.draggedBody.parent.sprite;
		if (!dragSprite) return;
		for (let sprite of this.dragContactSprites.values()) {
			var fn = this.getDragCombineFn(sprite, dragSprite);
			if (fn) {
				this.dragContactFn = fn;
			}
		}
		if (this.dragContactFn) {
			dragSprite.animations.play('highlight');
		} else {
			dragSprite.animations.play('drag');
		}
	}

	getDragCombineFn(sprite, dragSprite)
	{
		// check if we can combine
		var gs = this; // closure
		if ((sprite instanceof Cow) && sprite.type === 'cow' && (dragSprite instanceof Maggot))
		{
			return function(){
				if (dragSprite.type === 'maggotblood') {
					gs.spawnCowVampire(sprite.x, sprite.y, sprite.direction);
				} else {
					sprite.eatMaggot(dragSprite);
				}
			}
		} else if ((sprite instanceof CorpseZombie) && sprite.canGet == true && (dragSprite instanceof Maggot) && dragSprite.type === 'maggot') {
			return function(){
				dragSprite.destroy();
				sprite.animations.play('spawntotem'); // creates birdtotem obj after animation ended
				sprite.canGet = false;
			}
		} else if ((sprite instanceof BirdTotem) && !sprite.isEating() && sprite.canGet && (dragSprite instanceof Maggot) && (sprite.type !== 'birdtotemblood' || dragSprite.type === 'maggotblood')) {
			return function(){
				sprite.eatMaggot(dragSprite);
			}
		}
		else if ((sprite instanceof Corpse) && (dragSprite instanceof Seed))
		{
			return function(){				
				new Pumpkin(sprite.x, sprite.y);
				sprite.destroy();
				dragSprite.destroy();
				gs.spawnPoof(sprite.x, sprite.y);
			}
		}
		else if ((sprite instanceof CorpseZombie) && (dragSprite instanceof Seed))
		{
			return function(){				
				new PumpkinZombie(sprite.x, sprite.y);
				sprite.destroy();
				dragSprite.destroy();
				gs.spawnPoof(sprite.x, sprite.y);
			}
		}
		else if ((sprite instanceof Cow) && sprite.type === 'cow' && (dragSprite instanceof Pumpkin))
		{
			return function(){
				gs.spawnCowPumpkin(sprite.x, sprite.y, sprite.direction);
				sprite.destroy();
				dragSprite.destroy();
				gs.spawnPoof(sprite.x, sprite.y);
			}
		}
		else if ((sprite instanceof CorpsePumpkin) && sprite.canGet == true && (dragSprite instanceof Seed))
		{
			return function(){
				dragSprite.destroy();
				sprite.animations.play('spawnsalad'); // creates salad obj after animation ended
				sprite.canGet = false;
				gs.spawnPoof(sprite.x, sprite.y);
			}
		}
		else if ((sprite instanceof PumpkinZombie) && (dragSprite instanceof Salad))
		{
			return function(){
				// TODO: EATING BAR
				sprite.eatSalad();
				dragSprite.destroy();
				gs.spawnPoof(sprite.x, sprite.y);
			}
		}
		else if ((sprite instanceof BirdTotem) && (dragSprite instanceof PumpkinSalad))
		{
			return function(){
				sprite.destroy();
				
				dragSprite.animations.play('transform');
				dragSprite.canBeDragged = false;
				dragSprite.body.gravity = 0;
				dragSprite.body.static = true;
				dragSprite.body.angularDamping = 1;
				dragSprite.body.rotation = 0;
				dragSprite.body.angularVelocity = 0;
				dragSprite.body.velocity.x = 0;
				dragSprite.body.velocity.y = 0;
				
				gs.spawnPoof(dragSprite.x, dragSprite.y);
			}
		}
		else if ((sprite instanceof Maggot) && (dragSprite instanceof Tomato) && sprite.type === 'maggot')
		{
			return function(){
				gs.spawnMaggotBlood(sprite);
				sprite.destroy();
				dragSprite.destroy();
				gs.spawnPoof(sprite.x, sprite.y);
			}
		}
		else if ((sprite instanceof CorpseVampire) && sprite.canGet == true && (dragSprite instanceof Seed))
		{
			return function(){
				dragSprite.destroy();
				sprite.animations.play('spawntomato'); // creates tomato obj after animation ended
				sprite.canGet = false;
				gs.spawnPoof(sprite.x, sprite.y);
			}
		}

		return false;
	}


	update ()
	{
		// time since last frame, in seconds
		this.deltaT = game.time.elapsed/1000;

		// time since some start point, in seconds
		this.T = game.time.now/1000;
		
		// cowtimer
		if (this.cowtimer>0) {
			this.cowtimer -= game.time.elapsed;
			if (this.cowtimer<=0) {
				var cowcounter=0;
				// count cows
				this.livingGroup.forEach(function(myobj) {	
					if (myobj instanceof Cow)
						cowcounter+=1;
				}
				);

				if (cowcounter<3) {
					if (Math.random() < 0.5) {
						this.spawnCow(-40, 240 - 16);
					} else {
						this.spawnCow(game.world.width + 40, 240 - 16);
					}
				}

				this.cowtimer = 4000 + Math.random() * 2000;
			}
		}

		this.updateDragCombines();

		var mouseX = game.input.activePointer.position.x / game.camera.scale.x;
		var mouseY = game.input.activePointer.position.y / game.camera.scale.y;

		this.setMousePointerBounds();		
	}

	// Add debug spawns keys here!
	addDebugKeys() {
		game.input.keyboard.addKey(Phaser.Keyboard.ONE).onDown.add(function() {this.functionKey(0);}, this);
		game.input.keyboard.addKey(Phaser.Keyboard.TWO).onDown.add(function() {this.functionKey(1);}, this);
		game.input.keyboard.addKey(Phaser.Keyboard.THREE).onDown.add(function() {this.functionKey(2);}, this);
		game.input.keyboard.addKey(Phaser.Keyboard.FOUR).onDown.add(function() {this.functionKey(3);}, this);
		game.input.keyboard.addKey(Phaser.Keyboard.FIVE).onDown.add(function() {this.functionKey(4);}, this);
		game.input.keyboard.addKey(Phaser.Keyboard.SIX).onDown.add(function() {this.functionKey(5);}, this);
		game.input.keyboard.addKey(Phaser.Keyboard.SEVEN).onDown.add(function() {this.functionKey(6);}, this);
		game.input.keyboard.addKey(Phaser.Keyboard.EIGHT).onDown.add(function() {this.functionKey(7);}, this);
	}
	
	// Add debug spawns here!
	functionKey(type) {
		switch(type){
			case 0:
				new Maggot(this.mouseBody.x, this.mouseBody.y, 'maggot');
				break;
			case 1:
				new Cow(this.mouseBody.x, this.mouseBody.y, 'cow');
				break;
			case 2:
				new Corpse(this.mouseBody.x, this.mouseBody.y);
				break;
			case 3:
				new CorpseZombie(this.mouseBody.x, this.mouseBody.y);
				break;				
			case 4:
				new CorpsePumpkin(this.mouseBody.x, this.mouseBody.y);
				break;				
			case 5:
				new Seed(this.mouseBody.x, this.mouseBody.y);
				break;
			case 6:
				new Tomato(this.mouseBody.x, this.mouseBody.y);
				break;
			case 7:
				new PumpkinSalad(this.mouseBody.x, this.mouseBody.y);
				break;
		}
	}
	
	render()
	{
		//game.debug.body(this.livingGroup);
		//game.debug.body(this.bgCollision);
		
		game.world.bringToTop(this.bgfloor);		
	}


	draggableCollides(drag, other)
	{
		if (other.sprite === this.bgCollision) {
			drag.sprite.isOnGround = true;
			if (this.mouseSpring === undefined && drag.sprite.prevY > 350)
			{
				drag.sprite.deadlyImpact();
			}
			/*
			if (this.draggedBody && this.draggedBody.parent.sprite.body == drag.sprite.body) {

				game.physics.p2.removeConstraint(this.mouseSpring);
			}
			*/
		}
	}

	setMousePointerBounds()
	{
		// keep this commented out because of the other constraint bugs
		//this.mouseBody.body.y = Math.min(this.mouseBody.body.y, this.maxMouseY);
	}
}

game = new Phaser.Game(
	1024, 576,
	Phaser.AUTO,
	'vegan-farmer',
);

game.transparent = false;
game.antialias = false;

game.state.add('Game', GameState, false);
game.state.start('Game');

