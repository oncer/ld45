
class DraggableObject extends Phaser.Sprite
{
	constructor(x, y, sprite)
	{
		super(game, x, y, sprite);
		game.physics.p2.enable(this, true);
		this.body.clearShapes();
		//this.body.addRectangle(32, 32, 0, 0);
		this.animations.add('idle', [0,1,2,3], 4, true);
		this.animations.add('walk', [4,5,6,7], 4, true);
		this.animations.add('drag', [8], 1, true);
		this.animations.play('idle');
		
		//this.inputEnabled = true; // allow sprites to be input-enabled
		//this.input.enableDrag(); // allow dragging; true -> snap to center
		//this.events.onDragStart.add(this.startDrag, this);
		//this.events.onDragUpdate.add(this.dragUpdate, this);
		//this.events.onDragStop.add(this.stopDrag, this);	

		this.isOnGround = true;
	}
	
	update()
	{
		if (this.isOnGround)
		{
			this.body.rotation = 0;
		}
	}
}

class Cow extends DraggableObject
{
	constructor(x, y)
	{
		super(x, y, 'cow');
		this.state = 0; // wait
		this.direction = 1; // right
		this.stateTimer = 1000;
		this.body.addRectangle(28, 20, 0, 5);		
	}

	update()
	{
		//super.update();
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
}

class GameState extends Phaser.State
{
	preload ()
	{
		game.load.image('bg', 'gfx/background.png');
		game.load.spritesheet("cow", 'gfx/cow.png', 32, 32);
		game.load.spritesheet('gore', 'gfx/gore.png', 16, 16);
		
		//game.load.spritesheet('propeller', 'gfx/propeller.png', 16, 64, 4);
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		//game.load.audio('music', 'sfx/theme.ogg');
	}

	create ()
	{
		// cow reset timer
		this.cowtimer=60*5;
	
		// game physics
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.gravity.y = 200;
	  
		this.bg = game.add.sprite(0, 0, 'bg')
		this.livingCG = game.physics.p2.createCollisionGroup();
		this.livingGroup = game.add.group();
		var cow = new Cow(32, 240 - 16);
		cow.body.setCollisionGroup(this.livingCG);
		this.livingGroup.add(cow);
		
		// bg collision
		this.bgCollision = game.add.sprite(0, 0);
		game.physics.p2.enable(this.bgCollision);
		this.bgCollision.body.clearShapes();
		this.bgCollision.body.addRectangle(1024, 48, 0, 240 + 24);
		this.bgCollision.body.static = true;
		this.bgCollision.body.gravity = 0;
		this.bgCG = game.physics.p2.createCollisionGroup();
		this.bgCollision.body.setCollisionGroup(this.bgCG);

		// make cow collide with background
		cow.body.collides(this.bgCG, this.cowCollides);
		this.bgCollision.body.collides(this.livingCG);

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
		game.physics.p2.enable(this.mouseBody,true);
		this.mouseBody.body.setCircle(5);
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
		console.log(pointer.position);
		var mousePos = new Phaser.Point(pointer.x / game.camera.scale.x,
			pointer.y / game.camera.scale.y);
		var bodies = game.physics.p2.hitTest(mousePos, this.livingGroup.children);
		if (bodies.length > 0)
		{
			var body = bodies[0];
			//this.mouseConstraint = game.physics.p2.createRevoluteConstraint(body, [0,0],this.mouseBody, [0,0]) ;
			console.log("MOUSE CONSTRAINT");
			
			body.parent.isOnGround = false;
			
			//this.mouseSpring = game.physics.p2.createSpring(this.mouseBody, body, 0, 10, 10);		
			var localPointInBody = [0, 0];
			var physicsPos = [game.physics.p2.pxmi(mousePos.x), game.physics.p2.pxmi(mousePos.y)];    
			body.toLocalFrame(localPointInBody, physicsPos);
			
			// use a revoluteContraint to attach mouseBody to the clicked body
			this.mouseSpring  = this.game.physics.p2.createRevoluteConstraint(this.mouseBody, [0, 0], body, [game.physics.p2.mpxi(localPointInBody[0]), game.physics.p2.mpxi(localPointInBody[1]) ]);
			
			//this.mouseSpring = game.physics.p2.createRevoluteConstraint(this.mouseBody, [0, 0], body, 0, 10, 10);
			
			//mouseConstraint = this.game.physics.p2.createRevoluteConstraint(mouseBody, [0, 0], clickedBody, [game.physics.p2.mpxi(localPointInBody[0]), game.physics.p2.mpxi(localPointInBody[1]) ]);
			
			//this.mouseSpring = game.physics.p2.createRotationalSpring(this.mouseBody, body, 0, 30, 1);
			//bodyA, bodyB, restLength, stiffness, damping, restLength, stiffness, damping, worldA, worldB, localA, localB
		}
	}

	mouseMove(pointer, x, y, isDown)
	{
		this.mouseBody.body.x = x / game.camera.scale.x;
		this.mouseBody.body.y = y / game.camera.scale.y;
		
		
	}

	mouseRelease()
	{
		if (this.mouseSpring) {
			game.physics.p2.removeConstraint(this.mouseSpring);
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
				//this.livingGroup.add(new Cow(64, 208));
				var cow = new Cow(64, 208);
				cow.body.setCollisionGroup(this.livingCG);
				this.livingGroup.add(cow);
				cow.body.collides(this.bgCG, this.cowCollides);
			}

			this.cowtimer=60*5;
		}

		var mouseX = game.input.activePointer.position.x / game.camera.scale.x;
		var mouseY = game.input.activePointer.position.y / game.camera.scale.y;

	}

	render()
	{
		//game.debug.body(this.livingGroup);
		//game.debug.body(this.bgCollision);
	}


	cowCollides()
	{
		console.log("YAY?");				
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

