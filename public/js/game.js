var config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 600,
  physics: {
      default: 'arcade',
      arcade: {
          gravity: { y: 300 },
          debug: false
      }
  },
  scene: {
      preload: preload,
      create: create,
      update: update
  }
};

var platforms;
var gameOver = false;
var game = new Phaser.Game(config);

function preload ()
{
  this.load.image('sky', '../assets/introBg.png');
  this.load.image('ground', '../assets/platform.png');
  this.load.image('star', '../assets/star.png');
  this.load.image('bomb', '../assets/bomb.png');
  this.load.spritesheet('dude', '../assets/dude.png' , {frameWidth: 32, frameHeight: 48});
  this.load.spritesheet('otherPlayer', '../assets/dude.png', {frameWidth: 32, frameHeight: 48});
}
var player;
var score = 0;
var scoreText;
var bombs;
var keyA;
var otherPlayer;


function create ()
{


    var self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function(players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                player = addPlayer(self, players[id], this.physics);
            } else {
                //addOtherPlayers(self, players[id]);
                // otherPlayer = self.physics.add.sprite(players[id].x, players[id].y, 'dude').setCollideWorldBounds(true);
                // otherPlayer.playerId = players[id].playerId;
                //self.otherPlayer.add(otherPlayer);

            }
        });
    });
    this.socket.on('newPlayer', function(playerInfo) {
        addOtherPlayers(self,playerInfo);
    });
    this.socket.on('disconnect', function (playerId) {
        self.otherPlayers.getChildren().forEach(function(otherPlayer) {
            if(playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        });
    });






  this.add.image(400, -800, 'sky').setScale(2.5);

  keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);

  platforms = this.physics.add.staticGroup();

  platforms.create(400, 600, 'ground').setScale(3).refreshBody();

  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

//   player = this.physics.add.sprite(100, 450, 'dude');

//   player.setBounce(0.2);
//   player.setCollideWorldBounds(true);
//   player.body.setGravityY(900);

  this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3}), frameRate: 10, repeat: -1
  });

  this.anims.create({
      key: 'turn',
      frames: [ { key: 'dude', frame: 4 } ],
      frameRate: 20
  });

  this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8}), frameRate: 10, repeat: -1
  });

  this.physics.add.collider(player, platforms);
  cursors = this.input.keyboard.createCursorKeys();
  if(otherPlayer) {
    this.physics.add.collider(otherPlayer, platforms);
  }

  stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: {x: 12, y: 0, stepX: 70}
  });

  stars.children.iterate(function(child) {

      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))

  });

  this.physics.add.collider(stars, platforms);
  this.physics.add.overlap(player, stars, collectStar, null, this);


  scoreText = this.add.text(16, 16, 'score: 0', {fontSize: '32px', fill: '#000' });

  bombs = this.physics.add.group();

  this.physics.add.collider(bombs, platforms);
  this.physics.add.collider(player, bombs, hitBomb, null, this);

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
}

function hitBomb (player, bomb)
{
  this.physics.pause();
  player.setTint(0xff0000);
  player.anims.play('turn');
  gameOver = true;
}

function collectStar (player, star) {
  star.disableBody(true, true);

  score += 10;
  scoreText.setText('Score: ' + score);

  if(stars.countActive(true) === 0) {
      stars.children.iterate(function (child) {
          child.enableBody(true, child.x, 0, true, true);
      });

      var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

      var bomb = bombs.create(x, 16, 'bomb');
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }
}


function update ()
{

  if(cursors.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play('left', true);
  }
  else if (cursors.right.isDown) {
      player.setVelocityX(160);
      player.anims.play('right', true);
  }
  else {
      player.setVelocityX(0);
      player.anims.play('turn');
  }
  if(cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-730);
  }
  if(gameOver === true) {
      return;
  }
  if (keyA.isDown){
      this.dude.setVelocityY(-400);
  }




}

function addPlayer(self, playerInfo, physics) {
    // self.dude = self.physics.add.image(playerInfo.x, playerInfo.y, 'dude').setOrigin(0.5, 0.5);
    // self.dude.setCollideWorldBounds(true);
    // self.dude.
    player = physics.add.sprite(100, 450, 'dude');

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.body.setGravityY(900);


    // if (playerInfo.team === 'blue') {
    //   self.dude.setTint(0x0000ff);
    // } else {
    //   self.dude.setTint(0xff0000);
    // }
    // self.dude.setDrag(100);
    // self.dude.setAngularDrag(100);
    // self.dude.setMaxVelocity(200);
    return player;
  }

  function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setCollideWorldBounds(true);
    if (playerInfo.team === 'blue') {
      otherPlayer.setTint(0x0000ff);
    } else {
      otherPlayer.setTint(0xff0000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
  }