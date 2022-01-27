var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1400,
  height: 1000,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};


var game = new Phaser.Game(config);
var platforms;
var shots;
var music;

function preload() {


  this.load.audio('bgm', '../assets/Bgm.mp3')
  this.load.image('BG', '../assets/introBg.png');
  this.load.image('ground', '../assets/platform.png');
  this.load.image('star', '../assets/star.png');
  this.load.image('bomb', '../assets/bomb.png');
  this.load.spritesheet('dude', '../assets/dude.png' , {frameWidth: 32, frameHeight: 48});



}
function create() {

  //music = this.add.audio('bgm');
  //music.play();
  this.add.image(400, -950, 'BG').setScale(3);
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  platforms = this.physics.add.staticGroup();

  platforms.create(350, 800, 'ground').setScale(4).refreshBody();
  platforms.create(2100, 800, 'ground').setScale(4).refreshBody();

  platforms.create(600, 400, 'ground');
  platforms.create(50, 500, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 230, 'ground');
  platforms.create(700, 600, 'ground');
  platforms.create(1200, 500, 'ground');

//   stars = this.physics.add.group({
//     key: 'star',
//     repeat: 11,
//     setXY: {x: 12, y: 0, stepX: 70}
// });






  this.cursors = this.input.keyboard.createCursorKeys();
  shots = this.physics.add.group()


  // var bomb = shots.create(20, 16, 'bomb')
  // bomb.setBounce(1);
  // bomb.setGravityY(100);
  // bomb.setCollideWorldBounds(true);
  // bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);



this.physics.add.collider(shots, platforms);

this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
this.redScoreText = this.add.text(1260, 16, '', { fontSize: '32px', fill: '#FF0000' });

this.socket.on('scoreUpdate', function (scores) {
  self.blueScoreText.setText('Blue: ' + scores.blue);
  self.redScoreText.setText('Red: ' + scores.red);
});

this.socket.on('starLocation', function (starLocation) {
  if (self.star) self.star.destroy();
  self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star').setBounce(.75).setGravityY(50);
  self.star.setVelocity(Phaser.Math.Between(-50, 50), 20);
  self.physics.add.collider(self.star, platforms);
  self.star.setCollideWorldBounds(true);

  self.physics.add.overlap(self.ship, self.star, function () {
    this.socket.emit('starCollected');
  }, null, self);
});

this.socket.on('bombLocation', function (bombLocation) {
  if(self.bomb) self.bomb.destroy();
  self.bomb = self.physics.add.image(bombLocation.x, bombLocation.y, 'bomb').setBounce(1).setGravityY(100);
  self.physics.add.collider(self.bomb, platforms);
  self.bomb.setCollideWorldBounds(true);
  self.bomb.setVelocity(Phaser.Math.Between(-200, 200), 200);
  self.physics.add.overlap(self.ship, self.bomb, function () {
    this.socket.emit('bombCollision');
  }, null, self);
});

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

}
function update() {


  if (this.ship) {
    if (this.cursors.left.isDown) {
      this.ship.anims.play('left', true);
      this.ship.setVelocityX(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.anims.play('right', true);
      this.ship.setVelocityX(150);
    } else {
      this.ship.anims.play('turn', true);
      this.ship.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.ship.body.touching.down) {
      this.ship.setVelocityY(-450);
    }

    this.physics.world.wrap(this.ship, 5);


    // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;

    if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y)) {
      this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y });
    }
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y
    };
  }

  // if(this.bomb) {
  //   x = this.bomb.x
  //   console.log("There is a bomb");
  // }



}

function addPlayer(self, playerInfo) {
  self.ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'dude').setOrigin(0.5, 0.5);
  if (playerInfo.team === 'blue') {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }
  self.physics.add.collider(self.ship, platforms);
  self.ship.setBounce(0.2);
  self.ship.setGravityY(500);
  // if(otherPlayer) {
  //   self.physics.add.collider(self.ship, otherPlayer);
  // }
  //self.ship.setDrag(100);
  //self.ship.setAngularDrag(100);
  //self.ship.setMaxVelocity(200);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'dude').setOrigin(0.5, 0.5);
  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.physics.add.collider(otherPlayer, self.ship);
  self.otherPlayers.add(otherPlayer);
}
