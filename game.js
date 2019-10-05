
class StaticObject extends Phaser.Sprite
{
	constructor(x, y, sprite, cWidth, cHeight, cX, cY)
	{
		super(game, x, y, sprite)
		game.physics.p2.enable(this);
		this.body.clearShapes();
		this.body.addRectangle(cWidth, cHeight, cX, cY);
		var gstate = game.state.getCurrentState();
		this.body.setCollisionGroup(gstate.staticCG);
		gstate.staticGroup.add(this);
		this.body.collides(gstate.bgCG);
		this.animations.add('idle', [0,1,2,3], 4, true);
		this.animations.play('idle');
	}
}

class Corpse extends StaticObject
{
	constructor(x, y)
	{
		super(x, y, 'corpse', 32, 16, 0, 8);
		this.time = 0;
	}

	update()
	{
		this.time += game.time.elapsed;
		if (this.time > 5000) {
			new Maggot(this.x, this.y);
			game.state.getCurrentState().spawnPoof(this.x, this.y);
			this.destroy();
		}
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
	}

	update()
	{
		this.scale.x = this.direction;
	}

	eatMaggot(obj)
	{
		obj.destroy();
		this.maggotCount++;

		if (this.maggotCount >= 3) {
			var x = this.x + 20 * this.direction;
			var y = this.y;
			new Seed(x, y);
			game.state.getCurrentState().spawnPoof(x, y);
		}
	}
}

class Seed extends StaticObject
{
	constructor(x, y)
	{
		super(x, y, 'seed', 32, 32, 0, 0);
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
		this.body.setCollisionGroup(gstate.livingCG);
		gstate.livingGroup.add(this);
		this.body.collides(gstate.bgCG, gstate.draggableCollides, gstate);
		this.body.collides(gstate.bgSidesCG);
		this.body.angularDamping = 0.995;

		//this.body.addRectangle(32, 32, 0, 0);
		this.animations.add('idle', [0,1,2,3], 4, true);
		this.animations.add('walk', [4,5,6,7], 4, true);
		this.animations.add('drag', [8], 1, true);
		this.animations.play('idle');
		
		this.isOnGround = true;
	}

	update()
	{
		if (this.isOnGround)
		{
			//console.log("ON GROUND");
			this.body.rotation = 0;
		}
		this.prevY = this.body.velocity.y;
		//else console.log("NOT");
	}

	deadlyImpact()
	{
		console.log("deadlyImpact not implemented!");
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
				if (this.stateTimer <= 0) {
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
		game.load.spritesheet("cow", 'gfx/cow.png', 32, 32);
		game.load.spritesheet("corpse", 'gfx/corpse.png', 32, 32);
		game.load.spritesheet("corpsezombie", 'gfx/corpse_zombie.png', 32, 32);
		game.load.spritesheet("cowzombie", 'gfx/cow_zombie.png', 32, 32);
		game.load.spritesheet("maggot", 'gfx/maggot.png', 32, 32);
		game.load.spritesheet("pumpkin", 'gfx/pumpkin.png', 32, 32);
		game.load.spritesheet("seed", 'gfx/seed.png', 32, 32);
		game.load.spritesheet('gore', 'gfx/gore.png', 16, 16);
		game.load.spritesheet('poof', 'gfx/poof.png', 32, 32);
		game.load.spritesheet('birdtotem', 'gfx/bird_totem.png', 32, 32);
		
		//game.load.spritesheet('propeller', 'gfx/propeller.png', 16, 64, 4);
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		//game.load.audio('music', 'sfx/theme.ogg');
	}

	spawnGoreParticles(x, y, minVelX, maxVelX)
	{
		this.goreEmitter.x = x;
		this.goreEmitter.y = y;
		this.goreEmitter.setXSpeed(minVelX, maxVelX);

		this.goreEmitter.start(true, 2000, null, 20);
	}

	spawnPoof(x, y)
	{
		var poof = game.add.sprite(obj.x, obj.y, 'poof');
		poof.anchor.set(0.5);
		var anim = poof.animations.add('poof');
		anim.onComplete.add(function(sprite, anim){
			sprite.destroy();
		});
		anim.play();
	}

	spawnCorpse(obj)
	{
		this.spawnGoreParticles(obj.x, obj.y, -100, 100);
		new Corpse(obj.x, obj.y);
		obj.destroy();
	}

	spawnCorpseZombie(obj)
	{
		this.spawnGoreParticles(obj.x, obj.y, -100, 100);
		new CorpseZombie(obj.x, obj.y);
		obj.destroy();
	}

	spawnCowZombie(x, y)
	{
		new Cow(x, y, true);
	}

	spawnCow(x, y)
	{
		new Cow(x, y, false);
	}

	create ()
	{
		// cow reset timer
		this.cowtimer=60*5;
		
		// mouse shall not be used below this value
		this.maxMouseY = 232;
	
		// game physics
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.gravity.y = 600;
		game.physics.p2.friction = 0.4;
		game.physics.p2.applyDamping = true;
		game.physics.p2.setImpactEvents(true);
	  
		this.bg = game.add.sprite(0, 0, 'bg')

		this.staticCG = game.physics.p2.createCollisionGroup();
		this.staticGroup = game.add.group();

		this.livingCG = game.physics.p2.createCollisionGroup();
		this.livingGroup = game.add.group();

		
		// bg collision
		this.bgCollision = game.add.sprite(0, 0);		
		game.physics.p2.enable(this.bgCollision);
		this.bgCollision.body.clearShapes();
		// floor:
		this.bgCollision.body.addRectangle(1024, 48, 0, 240 + 24);
		// ceil:
		this.bgCollision.body.addRectangle(1024, 64, 0, 0 - 256);
		this.bgCollision.body.static = true;
		this.bgCollision.body.gravity = 0;
		this.bgCG = game.physics.p2.createCollisionGroup();
		this.bgCollision.body.setCollisionGroup(this.bgCG);
		this.bgCollision.body.collides(this.livingCG);
		this.bgCollision.body.collides(this.staticCG);
		
		// sides:
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
		this.goreEmitter.gravity = 200;
		this.goreEmitter.setXSpeed(-300,-100);

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
			this.draggedBody = bodies[0];
			
			this.draggedBody.parent.sprite.bringToTop();
			this.draggedBody.parent.sprite.isOnGround = false;
			this.draggedBody.parent.sprite.animations.play('drag');
			
			var localPointInBody = [0, 0];
			var physicsPos = [game.physics.p2.pxmi(mousePos.x), game.physics.p2.pxmi(mousePos.y)];    
			this.draggedBody.toLocalFrame(localPointInBody, physicsPos);
			
			// use a revoluteContraint to attach mouseBody to the clicked body
			this.mouseSpring = this.game.physics.p2.createRevoluteConstraint(this.mouseBody, [0, 0], this.draggedBody, [game.physics.p2.mpxi(localPointInBody[0]), game.physics.p2.mpxi(localPointInBody[1]) ]);
		}
	}

	checkDragCombine(sprite, dragSprite)
	{
		if ((sprite instanceof Cow) && !sprite.zombie && (dragSprite instanceof Maggot))
		{
			this.spawnCowZombie(sprite.x, sprite.y);
			sprite.destroy();
			dragSprite.destroy();
			console.log("maggot combine with cow");
		} else if ((sprite instanceof CorpseZombie) && (dragSprite instanceof Maggot)) {
			new BirdTotem(sprite.x, sprite.y);
			sprite.destroy();
			dragSprite.destroy();
			this.spawnPoof(sprite.x, sprite.y);
		} else if ((sprite instanceof BirdTotem) && (dragSprite instanceof Maggot)) {
			sprite.eatMaggot(dragSprite);
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
			}

			// check if we can combine with another object
			var mousePos = new Phaser.Point(pointer.x / game.camera.scale.x, pointer.y / game.camera.scale.y);
			var bodiesLiving = game.physics.p2.hitTest(mousePos, this.livingGroup.children);
			var bodiesStatic = game.physics.p2.hitTest(mousePos, this.staticGroup.children);
			var bodies = bodiesLiving.concat(bodiesStatic);
			if (bodies.length > 0)
			{
				for (var i = 0; i < bodies.length; i++) {
					if (bodies[i] !== this.draggedBody) {
						this.checkDragCombine(bodies[i].parent.sprite, this.draggedBody.parent.sprite);
					}
				}
			}
		}	
	}


	update ()
	{
		// time since last frame, in seconds
		this.deltaT = game.time.elapsed/1000;

		// time since some start point, in seconds
		this.T = game.time.now/1000;
		
		// cowtimer
		if (this.cowtimer>0) {this.cowtimer-=1;}
		else if (this.cowtimer==0) {
			var cowcounter=0;
			// count cows
			this.livingGroup.forEach(function(myobj) {	
				if (myobj instanceof Cow)
					cowcounter+=1;
			}
			);
			
			if (cowcounter<3) {
				this.spawnCow(64, 240 - 16);
			}

			this.cowtimer=60*5;
		}

		var mouseX = game.input.activePointer.position.x / game.camera.scale.x;
		var mouseY = game.input.activePointer.position.y / game.camera.scale.y;

		this.setMousePointerBounds();
	}

	render()
	{
		//game.debug.body(this.livingGroup);
		//game.debug.body(this.bgCollision);
	}


	draggableCollides(drag, other)
	{
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

	setMousePointerBounds()
	{
		this.mouseBody.body.y = Math.min(this.mouseBody.body.y, this.maxMouseY);
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

