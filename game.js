
class StaticObject extends Phaser.Sprite
{
	constructor(x, y, sprite, cWidth, cHeight, cX, cY)
	{
		super(game, x, y, sprite)
		game.physics.p2.enable(this);
		this.body.clearShapes();
		this.body.addRectangle(cWidth, cHeight, cX, cY);
		var gstate = game.state.getCurrentState();
		this.body.cg = gstate.staticCG;
		this.body.setCollisionGroup(this.body.cg);
		gstate.staticGroup.add(this);
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
	}
}

class BirdTotem extends StaticObject
{
	constructor(x, y)
	{
		super(x, y, 'birdtotem', 32, 32, 0, 0);
		this.maggotCount = 0;
		this.direction = Math.random() < 0.5 ? -1 : 1;
		this.animations.add('eat', [4,5,6,7], 8, true);
		this.animations.play('idle');
		this.eatTimer = 0;
		this.seedTimer = 0;
	}

	isEating()
	{
		return this.eatTimer > 0;
	}

	update()
	{
		this.scale.x = this.direction;

		if (this.eatTimer > 0) {
			this.eatTimer -= game.time.elapsed;
			if (this.eatTimer <= 0) {
				this.maggotCount++;
				this.animations.play('idle');

				if (this.maggotCount >= 3) {
					this.seedTimer = 2000;
					this.maggotCount = 0;
				}
			}
		}

		if (this.seedTimer > 0) {
			this.seedTimer -= game.time.elapsed;
			if (this.seedTimer <= 0) {
				var x = this.x + 20 * this.direction;
				var y = this.y;
				new /*Seed*/Pumpkin(x, y);
				game.state.getCurrentState().spawnPoof(x, y);
			}
		}
	}

	eatMaggot(obj)
	{
		obj.destroy();
		this.eatTimer = 2000 + Math.random() * 1000;
		this.animations.play('eat');
	}
}

class DraggableObject extends Phaser.Sprite
{
	constructor(x, y, sprite, cWidth, cHeight, cX, cY)
	{
		super(game, x, y, sprite);
		game.physics.p2.enable(this);
		this.body.clearShapes();
		this.body.addRectangle(cWidth, cHeight, cX, cY);
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

class Pumpkin extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'pumpkin', 16, 16, 0, 0);
	}
}

class Maggot extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'maggot', 20, 10, 0, 0);
		this.state = 0; // wait
		this.direction = 1; // right
		this.stateTimer = 1000;
		this.animations.getAnimation('idle').onLoop.add(this.animationLooped, this);
		this.animations.getAnimation('walk').onLoop.add(this.animationLooped, this);
		
		this.alpha = 0;
		game.add.tween(this).to( { alpha: 1 }, 1000, Phaser.Easing.Linear.None, true);
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
						this.direction = 1;
					} else if (this.x >= game.world.width - 100) {
						this.direction = -1;
					} else {
						this.direction = Math.random() < 0.5 ? -1 : 1;
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
		this.scale.x = this.direction;
	}

	deadlyImpact()
	{
		// nothing happens...
	}
}

class Cow extends DraggableObject
{
	constructor(x, y, zombie)
	{
		super(x, y, zombie ? 'cowzombie' : 'cow', 28, 20, 0, 0);
		this.zombie = zombie;
		this.state = 0; // wait
		this.direction = 1; // right
		this.stateTimer = 1000;	
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
						this.direction = 1;
					} else if (this.x >= game.world.width - 100) {
						this.direction = -1;
					} else {
						this.direction = Math.random() < 0.5 ? -1 : 1;
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
		this.scale.x = this.direction;
	}

	deadlyImpact()
	{
		if (this.zombie) {
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
		game.load.spritesheet("cow", 'gfx/cow.png', 32, 32);
		game.load.spritesheet("corpse", 'gfx/corpse.png', 32, 32);
		game.load.spritesheet("corpsezombie", 'gfx/corpse_zombie.png', 32, 32);
		game.load.spritesheet("cowzombie", 'gfx/cow_zombie.png', 32, 32);
		game.load.spritesheet("maggot", 'gfx/maggot.png', 32, 32);
		game.load.spritesheet("pumpkin", 'gfx/pumpkin.png', 32, 32);
		game.load.spritesheet("seed", 'gfx/seed.png', 32, 32);
		game.load.spritesheet('gore', 'gfx/gore.png', 16, 16);
		game.load.spritesheet('poof', 'gfx/poof.png', 32, 32);
		game.load.spritesheet('poofblood', 'gfx/poof_blood.png', 32, 32);
		game.load.spritesheet('birdtotem', 'gfx/bird_totem.png', 32, 32);
		
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
		new Maggot(obj.x, this.spawnObjY + 16);
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

	spawnCowZombie(x, y, direction)
	{
		var cow = new Cow(x, y, true);
		cow.direction = direction;
	}

	spawnCow(x, y)
	{
		new Cow(x, y, false);
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
		this.spawnCow(32, 240 - 16);

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
		if (bodies.length > 0)
		{
			// if (bodies[0] instanceof DraggableObject && !bodies[0].canBeDragged) {
				// console.log("can't drag this one");				
				// return;
			// }

			this.draggedBody = bodies[0];
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
		var fn = this.getDragCombineFn(sprite, dragSprite);
		if (fn) {
			dragSprite.animations.play('highlight');
			this.dragContactSprites.add(sprite);
			this.dragContactFn = fn;
		}
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

	getDragCombineFn(sprite, dragSprite)
	{
		// check if we can combine
		var gs = this; // closure
		if ((sprite instanceof Cow) && !sprite.zombie && (dragSprite instanceof Maggot))
		{
			return function(){
				gs.spawnCowZombie(sprite.x, sprite.y, sprite.direction);
				sprite.destroy();
				dragSprite.destroy();
				gs.spawnPoof(sprite.x, sprite.y);
			}
		} else if ((sprite instanceof CorpseZombie) && (dragSprite instanceof Maggot)) {
			return function(){
				new BirdTotem(sprite.x, sprite.y);
				sprite.destroy();
				dragSprite.destroy();
				gs.spawnPoof(sprite.x, sprite.y);
			}
		} else if ((sprite instanceof BirdTotem) && !sprite.isEating() && (dragSprite instanceof Maggot)) {
			return function(){
				sprite.eatMaggot(dragSprite);
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
	}
	
	// Add debug spawns here!
	functionKey(type) {
		switch(type){
			case 0:
				new Maggot(this.mouseBody.x, this.mouseBody.y);
				break;
			case 1:
				new Cow(this.mouseBody.x, this.mouseBody.y);
				break;
			case 2:
				new Corpse(this.mouseBody.x, this.mouseBody.y);
				break;
			case 3:
				new CorpseZombie(this.mouseBody.x, this.mouseBody.y);
				break;				
			case 4:
				//new Maggot(this.mouseBody.x, this.mouseBody.y);
				break;				
			case 5:
				//new Maggot(this.mouseBody.x, this.mouseBody.y);
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

