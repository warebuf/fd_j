class demon {
    constructor(h, l, r, b) { // something is wrong with objects, have to be able to edit them
        this.h = h;
        this.l = l;
        this.r = r;
        this.b = b;
        this.alive = true;
    }
    
    dmg_replay = function(atk,list) { // dmg replay
        let tot_atk = atk;
        for(let i=0;i<list.length;i++){
            if(list[i]=='h'){
                if(tot_atk > this.h.health) {
                    tot_atk = tot_atk - this.h.health;
                    this.h.health = 0;
                }
                else {
                    this.h.health -= tot_atk;
                    tot_atk = 0;
                }
                if(this.h.health <= 0) {this.alive = false;}
            }
            else if(list[i] == 'l') {
                if(tot_atk > this.l.health) {
                    tot_atk = tot_atk - this.l.health;
                    this.l.health = 0;
                }
                else {
                    this.l.health -= tot_atk;
                    tot_atk = 0;
                }
            }
            else if(list[i] == 'r') {
                if(tot_atk > this.r.health) {
                    tot_atk = tot_atk - this.r.health;
                    this.r.health = 0;
                }
                else {
                    this.r.health -= tot_atk;
                    tot_atk = 0;
                }
            }
            else if(list[i] == 'b') {
                if(tot_atk > this.b.health) {
                    tot_atk = tot_atk - this.b.health;
                    this.b.health = 0;
                }
                else {
                    this.b.health -= tot_atk;
                    tot_atk = 0;
                }
            }
        }
    }

    dmg = function(atker, defer, atk, part, chain) { // enable chain hits
        let history = [];
        let tot_atk = atk;
        while( (tot_atk > 0) && (this.alive) ) {
            //console.log(atker, defer, "atk:", tot_atk, "part:",part);
            if((part == 0 && this.h.health <= 0) || (part == 1 && this.l.health <= 0) || (part == 2 && this.r.health <= 0) || (part == 3 && this.b.health <= 0) ) {part = 4;} 
            if(part == 0) {
                if(tot_atk > this.h.health) {
                    history.push("h");
                    if(chain == true) {tot_atk = tot_atk - this.h.health;}
                    else {tot_atk = 0;}
                    this.h.health = 0;
                }
                else {
                    history.push("h");
                    this.h.health = this.h.health - tot_atk;
                    tot_atk = 0;
                }
                if(this.h.health <= 0) {this.alive = false;}
            }
            else if(part == 1) {
                if(tot_atk > this.l.health) {
                    history.push("l");
                    if(chain == true) {tot_atk = tot_atk - this.l.health;}
                    else {tot_atk = 0;}
                    this.l.health = 0;
                }
                else {
                    history.push("l");
                    this.l.health = this.l.health - tot_atk;
                    tot_atk = 0;
                }
            }
            else if(part == 2) {
                if(tot_atk > this.r.health) {
                    history.push("r");
                    if(chain == true) {tot_atk = tot_atk - this.r.health;}
                    else {tot_atk = 0;}
                    this.r.health = 0;
                }
                else {
                    history.push("r");
                    this.r.health = this.r.health - tot_atk;
                    tot_atk = 0;
                }
            }
            else if(part == 3) {
                if(tot_atk > this.b.health) {
                    history.push("b");
                    if(chain == true) {tot_atk = tot_atk - this.b.health;}
                    else {tot_atk = 0;}
                    this.b.health = 0;
                }
                else {
                    history.push("b");
                    this.b.health = this.b.health - tot_atk;
                    tot_atk = 0;
                }
            }
            else {part = Math.floor(Math.random()*4);}
        }

        var history_no_repeats = history.filter(function(item, pos, arr){return pos === 0 || item !== arr[pos-1];});
        return history_no_repeats;
    }
}

module.exports = demon;