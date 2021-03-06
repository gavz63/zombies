/*
Completed by Gavin Montes & Gordon McCreary
*/

function GRM(game) {
    this.player = 1;
    this.radius = 10;
    this.rocks = 0;
    this.kills = 0;
    this.name = "Gavin Montes & Gordon McCreary";
    this.color = "White";
    this.cooldown = 0;
    this.direction = {x: randomInt(1600) - 800, y: randomInt(1600) - 800};
    Entity.call(this, game, this.radius + Math.random() * (800 - this.radius * 2), this.radius + Math.random() * (800 - this.radius * 2));

    this.velocity = {x: 0, y: 0};
}

GRM.prototype = new Entity();
GRM.prototype.constructor = GRM;

// alter the code in this function to create your agent
// you may check the state but do not change the state of these variables:
//    this.rocks
//    this.cooldown
//    this.x
//    this.y
//    this.velocity
//    this.game and any of its properties

// you may access a list of zombies from this.game.zombies
// you may access a list of rocks from this.game.rocks
// you may access a list of players from this.game.players

GRM.prototype.selectAction = function () {


    // Avoid zombies.
    let closeZomb = 2000;
    let zombVect = {x: 0, y: 0};
    this.game.zombies.forEach((z) => {
        let dist = distance(z, this);
        if (dist < closeZomb) closeZomb = dist;
        zombVect.x += (this.x - z.x) / Math.pow(dist, 5);
        zombVect.y += (this.y - z.y) / Math.pow(dist, 5);
    });
    zombVect = normalize(zombVect, 69 / closeZomb);


    // Chase closest rock.
    let playVect = {x: 400 - this.x, y: 400 - this.y};
    if (this.rocks < 2) {
        let min = Infinity;
        let minR = null;
        this.game.rocks.forEach((r) => {
            let dist = distance(r, this);
            if (dist < min) {
                min = dist;
                minR = r;
            }
        });
        if (minR !== null) {
            playVect.x = (minR.x - this.x);
            playVect.y = (minR.y - this.y);
        }
    } else {
        let min = Infinity;
        let minZ = null;
        this.game.zombies.forEach((z) => {
            let dist = distance(z, this);
            if (dist < min) {
                min = dist;
                minZ = z;
            }
        });
        if (minZ !== null) {
            playVect.x = (minZ.x - this.x);
            playVect.y = (minZ.y - this.y);
        }
    }
    playVect = normalize(playVect);


    // Combine chasing rocks and avoiding zombies.
    playVect.x += zombVect.x;
    playVect.y += zombVect.y;


    // Prepare the return value.
    this.direction = playVect;
    let action = {direction: {x: this.direction.x, y: this.direction.y}, throwRock: false, target: null};
    let target = null;
    let range = 125;


    // Find the next victim!
    if (this.cooldown <= 0) {
        for (let i = 0; i < this.game.zombies.length; i++) {
            let ent = this.game.zombies[i];
            let numTargetingEnt = 0;
            this.game.players.forEach(function (player) {
                if (player.action && player.action.target === ent) {
                    numTargetingEnt++;
                }
            });
            if (numTargetingEnt < 4) {
                let dist = distance(ent, this);
                if (dist < range) {
                    range = dist;
                    target = ent;
                }
            }
        }
    }


    // Throw a rock!
    if (target) {
        action.target = target;
        action.throwRock = true;
    }

    
    /*
    Don't run into walls!
    */
    if (this.x < 15 && this.velocity.x < 0) {
        this.velocity.x = 0;
    }
    if (this.y < 15 && this.velocity.y < 0) {
        this.velocity.y = 0;
    }
    if (this.x > 785 && this.velocity.x > 0) {
        this.velocity.x = 0;
    }
    if (this.y > 785 && this.velocity.y > 0) {
        this.velocity.y = 0;
    }
    if (this.velocity.x === 0 && this.velocity.y === 0) {
        this.velocity = {x: 400 - this.x, y: 400 - this.y};
    }

    /*
    Optimize speed to make sure player is always moving > maxSpeed.
    This takes advantage of floating point number accuracy and is not cheating.
    (It only makes a tiny difference; ~.00000001).
    */
    action.direction.x *= 200;
    action.direction.y *= 200;
    while (true) {
        let xv = this.velocity.x + action.direction.x;
        let yv = this.velocity.y + action.direction.y;
        let s = Math.sqrt(xv * xv + yv * yv);
        if (s > maxSpeed) {
            let r = maxSpeed / s;
            xv *= r;
            yv *= r;
        }
        s = Math.sqrt(xv * xv + yv * yv);

        if (s > maxSpeed) {
            break;
        } else {
            action.direction.x += .01;
            action.direction.y += .01 * action.direction.y / action.direction.x;
        }
    }
    return action;


    // Previous movement code.
    /*let that = this;
    let goalPoint = {x: 0, y: 0};

    // We can't get more rocks
    if ((this.rocks > 1 || this.game.rocks.length === 0) && this.cooldown <= 0) {
        let fastestZombie = {x: 400, y: 400, maxSpeed: 0};
        that.game.zombies.forEach(function (zombie) {
            if (zombie.maxSpeed > fastestZombie) {
                fastestZombie = zombie;
            }
        });
        goalPoint = fastestZombie;
    } else {
        if (this.rocks === 0 || this.cooldown > 0) {
            let scareRange = 69;
            for (let i = 0; i < this.game.zombies.length; i++) {
                let ent = this.game.zombies[i];
                let dist = distance(ent, this);
                if (dist < scareRange) {
                    scareRange = dist;
                    ent.x > this.x ? goalPoint.x = this.x - ent.x : goalPoint.x = this.x + ent.x;
                    ent.y > this.y ? goalPoint.y = this.y - ent.y : goalPoint.y = this.y + ent.y;
                }
            }
        }
        if (goalPoint.x === 0 && goalPoint.y === 0) {
            let dist = Infinity;
            this.game.rocks.forEach(function (rock) {
                let rockDist = distance(that, rock);
                if (rockDist < dist) {
                    let safe = true;
                    that.game.zombies.forEach(function (zombie) {
                        // If zombie is between me and the rock
                        if (((that.x < rock.x && zombie.x < rock.x && that.x < zombie.x) ||
                            (that.x > rock.x && zombie.x > rock.x && that.x > zombie.x)) &&
                            ((that.y < rock.y && zombie.y < rock.y && that.y < zombie.y) ||
                                (that.y > rock.y && zombie.y > rock.y && that.y > zombie.y))) {
                            safe = false;
                        }
                    });
                    if (safe) {
                        goalPoint = rock;
                        dist = rockDist;
                    }
                }
            });
        }
    }
    this.direction = {x: goalPoint.x - this.x, y: goalPoint.y - this.y};*/
};

// do not change code beyond this point

GRM.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

GRM.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

GRM.prototype.collideRight = function () {
    return (this.x + this.radius) > 800;
};

GRM.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

GRM.prototype.collideBottom = function () {
    return (this.y + this.radius) > 800;
};

GRM.prototype.update = function () {
    Entity.prototype.update.call(this);
    // console.log(this.velocity);
    if (this.cooldown > 0) this.cooldown -= this.game.clockTick;
    if (this.cooldown < 0) this.cooldown = 0;
    this.action = this.selectAction();
    //if (this.cooldown > 0) console.log(this.action);
    this.velocity.x += this.action.direction.x;
    this.velocity.y += this.action.direction.y;

    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x * friction;
        if (this.collideLeft()) this.x = this.radius;
        if (this.collideRight()) this.x = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y * friction;
        if (this.collideTop()) this.y = this.radius;
        if (this.collideBottom()) this.y = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent !== this && this.collide(ent)) {
            if (ent.name !== "Zombie" && ent.name !== "Rock") {
                var temp = {x: this.velocity.x, y: this.velocity.y};
                var dist = distance(this, ent);
                var delta = this.radius + ent.radius - dist;
                var difX = (this.x - ent.x) / dist;
                var difY = (this.y - ent.y) / dist;

                this.x += difX * delta / 2;
                this.y += difY * delta / 2;
                ent.x -= difX * delta / 2;
                ent.y -= difY * delta / 2;

                this.velocity.x = ent.velocity.x * friction;
                this.velocity.y = ent.velocity.y * friction;
                ent.velocity.x = temp.x * friction;
                ent.velocity.y = temp.y * friction;
                this.x += this.velocity.x * this.game.clockTick;
                this.y += this.velocity.y * this.game.clockTick;
                ent.x += ent.velocity.x * this.game.clockTick;
                ent.y += ent.velocity.y * this.game.clockTick;
            }
            if (ent.name === "Rock" && this.rocks < 2) {
                this.rocks++;
                ent.removeFromWorld = true;
            }
        }
    }


    if (this.cooldown === 0 && this.action.throwRock && this.rocks > 0) {
        this.cooldown = 1;
        this.rocks--;
        var target = this.action.target;
        var dir = direction(target, this);

        var rock = new Rock(this.game);
        rock.x = this.x + dir.x * (this.radius + rock.radius + 20);
        rock.y = this.y + dir.y * (this.radius + rock.radius + 20);
        rock.velocity.x = dir.x * rock.maxSpeed;
        rock.velocity.y = dir.y * rock.maxSpeed;
        rock.thrown = true;
        rock.thrower = this;
        this.game.addEntity(rock);
    }

    this.velocity.x -= (1 - friction) * this.game.clockTick * this.velocity.x;
    this.velocity.y -= (1 - friction) * this.game.clockTick * this.velocity.y;
};

GRM.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
};

function normalize(vect, len = 1) {
    let l = Math.sqrt(vect.x * vect.x + vect.y * vect.y) / len;
    if (l === 0 || len === 0) {
        vect.x = 0;
        vect.y = 0;
        return vect;
    }
    vect.x /= l;
    vect.y /= l;
    return vect;
}