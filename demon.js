class demon {
    constructor(h, l, r, b) { // something is wrong with objects, have to be able to edit them
        this.h = h;
        this.l = l;
        this.r = r;
        this.b = b;
        this.alive = true;
    }
    
    dmg_replay = function(atk, list) {
        let history = [];
        for(let i = 0; i < list.length; i++) {
            if(list[i] == 'h') {
                history.push('h');
                if(atk > this.h.health) {
                    atk = atk - this.h.health;
                    this.h.health = 0;
                }
                else {
                    this.h.health -= atk;
                    atk = 0;
                }
            }
            else if(list[i] == 'l') {
                history.push('l');
                if(atk > this.l.health) {
                    atk = atk - this.l.health;
                    this.l.health = 0;
                }
                else {
                    this.l.health -= atk;
                    atk = 0;
                }
            }
            else if(list[i] == 'r') {
                history.push('r');
                if(atk > this.r.health) {
                    atk = atk - this.r.health;
                    this.r.health = 0;
                }
                else {
                    this.r.health -= atk;
                    atk = 0;
                }
            }
            else if(list[i] == 'b') {
                history.push('b');
                if(atk > this.b.health) {
                    atk = atk - this.b.health;
                    this.b.health = 0;
                }
                else {
                    this.b.health -= atk;
                    atk = 0;
                }
            }
        }
        return history;
    }

    dmg = function(atker, dfner, atk, part, chain) { // enable chain hits
        let history = [];
        while( (atk > 0) && (this.alive) ) {
            console.log(atker, dfner, "atk:", atk, "part:",part);
            if((part == 0 && this.h.health <= 0) || (part == 1 && this.l.health <= 0) || (part == 2 && this.r.health <= 0) || (part == 3 && this.b.health <= 0) ) {part = 4;} 
            if(part == 0) {
                if(atk > this.h.health) {
                    history.push("h");
                    if(chain == true) {atk = atk - this.h.health;}
                    else {atk = 0;}
                    this.h.health = 0;
                }
                else {
                    history.push("h");
                    this.h.health = this.h.health - atk;
                    atk = 0;
                }
                if(this.h.health <= 0) {this.alive = false;}
            }
            else if(part == 1) {
                if(atk > this.l.health) {
                    history.push("l");
                    if(chain == true) {atk = atk - this.l.health;}
                    else {atk = 0;}
                    this.l.health = 0;
                }
                else {
                    history.push("l");
                    this.l.health = this.l.health - atk;
                    atk = 0;
                }
            }
            else if(part == 2) {
                if(atk > this.r.health) {
                    history.push("r");
                    if(chain == true) {atk = atk - this.r.health;}
                    else {atk = 0;}
                    this.r.health = 0;
                }
                else {
                    history.push("r");
                    this.r.health = this.r.health - atk;
                    atk = 0;
                }
            }
            else if(part == 3) {
                if(atk > this.b.health) {
                    history.push("b");
                    if(chain == true) {atk = atk - this.b.health;}
                    else {atk = 0;}
                    this.b.health = 0;
                }
                else {
                    history.push("b");
                    this.b.health = this.b.health - atk;
                    atk = 0;
                }
            }
            else {part = Math.floor(Math.random()*4);}
        }

        var history_no_repeats = history.filter(function(item, pos, arr){return pos === 0 || item !== arr[pos-1];});
        return history_no_repeats;
    }
}

module.exports = demon;