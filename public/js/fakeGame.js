var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
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

function preload() {
  this.load.image('ship', '../assets/spaceShips_001.png');
  this.load.image('otherPlayer', '../assets/enemyBlack5.png');
  this.load.image('sky', '../assets/introBg.png');
  this.load.image('ground', '../assets/platform.png');
  this.load.image('star', '../assets/star.png');
  this.load.image('bomb', '../assets/bomb.png');
  this.load.spritesheet('dude', '../assets/dude.png' , {frameWidth: 32, frameHeight: 48});



}
function create() {

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

  platforms.create(400, 600, 'ground').setScale(3).refreshBody();

  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

//   stars = this.physics.add.group({
//     key: 'star',
//     repeat: 11,
//     setXY: {x: 12, y: 0, stepX: 70}
// });






  this.cursors = this.input.keyboard.createCursorKeys();
  shots = this.physics.add.group()


  var bomb = shots.create(20, 16, 'bomb')
  bomb.setBounce(1);
  bomb.setGravityY(100);
  bomb.setCollideWorldBounds(true);
  bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);



this.physics.add.collider(shots, platforms);


}
function update() {


  if (this.ship) {
    if (this.cursors.left.isDown) {
      this.ship.setVelocityX(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.setVelocityX(150);
    } else {
      this.ship.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.ship.body.touching.down) {
      this.ship.setVelocityY(-300);
    //   this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.ship.body.acceleration);
    // } else {
    //   this.ship.setAcceleration(0);
    }

    //this.physics.world.wrap(this.ship, 5);

    // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
    }
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation
    };
  }



}

function addPlayer(self, playerInfo) {
  self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'dude').setOrigin(0.5, 0.5);
  if (playerInfo.team === 'blue') {
    //self.ship.setTint(0x0000ff);
  } else {
    //self.ship.setTint(0xff0000);
  }
  self.physics.add.collider(self.ship, platforms);
  self.ship.setBounce(0.2);
  self.ship.setGravityY(200);
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
  self.otherPlayers.add(otherPlayer);
}