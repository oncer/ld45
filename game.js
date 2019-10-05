
class GameState extends Phaser.State
{
preload ()
{

	game.load.image('bg', 'gfx/background.png');
	
	game.load.spritesheet("cow", 'gfx/cow.png', 32, 32);
	
	//game.load.spritesheet('propeller', 'gfx/propeller.png', 16, 64, 4);
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	//game.load.audio('music', 'sfx/theme.ogg');
}

create ()
{
  console.log("My Message");
  
	// input keys
	this.keySpacebar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

	this.bg = game.add.sprite(0, 0, 'bg')
	
	this.cow = game.add.sprite(32, 208, 'cow');
	var anim = this.cow.animations.add('cowidle', [0, 1, 2, 3], 4, true).play(); // name, frames, framerate
	console.log(anim);

	game.physics.startSystem(Phaser.Physics.P2JS)
	game.physics.p2.gravity.y = 320;
	game.physics.p2.friction = 0.4;
	game.physics.p2.applyDamping = true;
	game.physics.p2.setImpactEvents(true);

	game.world.setBounds(0, 0, 512, 864);
	game.camera.scale.setTo(2);


	// camera
	//game.camera.follow(this.zeppelin);
	//game.camera.deadzone = new Phaser.Rectangle(0, 128, game.width, game.height - 440);
	//game.camera.lerpY = 0.1;

	var style = { font: "14px Consolas", fill: "#ff004c", align: "center" };
	this.debugText = game.add.text(256, 240, "debug text", style);
	this.debugText.anchor.set(0.5);
	this.debugText.exists = false;

	// gore emitter
	//this.goreEmitter = game.add.emitter(0, 0, 100);
	//this.goreEmitter.makeParticles('gore', [0,1,2,3,4,5,6], 300);
	//this.goreEmitter.gravity = 200;
	//this.goreEmitter.setXSpeed(-300,-100);

	
	//define soundeffects
	//this.wavesAudio = game.add.audio('wavesAudio');
	
	//play ocean waves audio
	/*this.wavesAudio.onDecoded.add(function(){
		if (!this.start) {
			this.wavesAudio.play('', 0, 0, true);
			this.wavesAudio.fadeTo(1000, 0.3);
		}
	}, this);*/

	game.camera.flash('#000000');
}

startGame()
{
}

restartGame()
{
}

update ()
{
	// time since last frame, in seconds
	this.deltaT = game.time.elapsed/1000;

	// time since some start point, in seconds
	this.T = game.time.now/1000;

	var mouseX = game.input.activePointer.position.x / game.camera.scale.y;
	var mouseY = (game.input.activePointer.position.y + game.camera.view.y) / game.camera.scale.y;


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

