export class demon {
    constructor(h, l, r, b, team) { // something is wrong with objects, have to be able to edit them
        this.h = h;
        this.l = l;
        this.r = r;
        this.b = b;
        this.alive = true;
        this.team = team;
    }
    dmg = function(atker, dfner, atk, part, chain) { // enable chain hits
        while( (atk > 0) && (this.alive) ) {
            console.log(atker, dfner, "atk:", atk, "part:",part);
            if((part == 0 && this.h.health <= 0) || (part == 1 && this.l.health <= 0) || (part == 2 && this.r.health <= 0) || (part == 3 && this.b.health <= 0) ) {part = 4;} 
            if(part == 0) {
                if(atk > this.h.health) {
                    if(chain == true) {atk = atk - this.h.health;}
                    else {atk = 0;}
                    this.h.health = 0;
                }
                else {
                    this.h.health = this.h.health - atk;
                    atk = 0;
                }
                if(this.h.health <= 0) {this.alive = false;}
            }
            else if(part == 1) {
                if(atk > this.l.health) {
                    if(chain == true) {atk = atk - this.l.health;}
                    else {atk = 0;}
                    this.l.health = 0;
                }
                else {
                    this.l.health = this.l.health - atk;
                    atk = 0;
                }
            }
            else if(part == 2) {
                if(atk > this.r.health) {
                    if(chain == true) {atk = atk - this.r.health;}
                    else {atk = 0;}
                    this.r.health = 0;
                }
                else {
                    this.r.health = this.r.health - atk;
                    atk = 0;
                }
            }
            else if(part == 3) {
                if(atk > this.b.health) {
                    if(chain == true) {atk = atk - this.b.health;}
                    else {atk = 0;}
                    this.b.health = 0;
                }
                else {
                    this.b.health = this.b.health - atk;
                    atk = 0;
                }
            }
            else {part = Math.floor(Math.random()*4);}
        }
    }
}

export class part { 
    constructor(health, atk) {
        this.health = health;
        this.atk = atk;
    }
}

export class legs {
    constructor(health, speed) {
        this.health = health;
        this.speed = speed;
    }
}