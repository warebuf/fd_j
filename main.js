console.log("");
console.log("You are a conqueror because you conquer yourself, your demons. Most of them couldn't conquer their demons.");
console.log("Goal: Maximize fun")
console.log("");

class demon {
    constructor(h, l, r, b, team) { // something is wrong with objects, have to be able to edit them
        this.h = h;
        this.l = l;
        this.r = r;
        this.b = b;
        this.alive = true;
        this.team = team;
    }
    dmg = function(atker, dfner, atk, part, chain) { // enable chain hits
        let history = "";
        while( (atk > 0) && (this.alive) ) {
            console.log(atker, dfner, "atk:", atk, "part:",part);
            if((part == 0 && this.h.health <= 0) || (part == 1 && this.l.health <= 0) || (part == 2 && this.r.health <= 0) || (part == 3 && this.b.health <= 0) ) {part = 4;} 
            if(part == 0) {
                if(atk > this.h.health) {
                    history = history + "->" + String(this.h.health) + "h";
                    if(chain == true) {atk = atk - this.h.health;}
                    else {atk = 0;}
                    this.h.health = 0;
                }
                else {
                    history = history + "->" + String(atk) + "h";
                    this.h.health = this.h.health - atk;
                    atk = 0;
                }
                if(this.h.health <= 0) {this.alive = false;}
            }
            else if(part == 1) {
                if(atk > this.l.health) {
                    history = history + "->" + String(this.l.health) + "l";
                    if(chain == true) {atk = atk - this.l.health;}
                    else {atk = 0;}
                    this.l.health = 0;
                }
                else {
                    history = history + "->" + atk + "l";
                    this.l.health = this.l.health - atk;
                    atk = 0;
                }
            }
            else if(part == 2) {
                if(atk > this.r.health) {
                    history = history + "->" + String(this.r.health) + "r";
                    if(chain == true) {atk = atk - this.r.health;}
                    else {atk = 0;}
                    this.r.health = 0;
                }
                else {
                    history = history + "->" + String(atk) + "r";
                    this.r.health = this.r.health - atk;
                    atk = 0;
                }
            }
            else if(part == 3) {
                if(atk > this.b.health) {
                    history = history + "->" + String(this.b.health) + "b";
                    if(chain == true) {atk = atk - this.b.health;}
                    else {atk = 0;}
                    this.b.health = 0;
                }
                else {
                    history = history + "->" + String(atk) + "b";
                    this.b.health = this.b.health - atk;
                    atk = 0;
                }
            }
            else {part = Math.floor(Math.random()*4);}
        }
        return history;
    }
}

class part { 
    constructor(health, atk) {
        this.health = health;
        this.atk = atk;
    }
}

class legs {
    constructor(health, speed) {
        this.health = health;
        this.speed = speed;
    }
}

// init
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = window.innerWidth - 17;
canvas.height = window.innerHeight - 17;
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(f){return setTimeout(f, 1000/60)};
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || function(requestID){clearTimeout(requestID)};
state = 0;

window.addEventListener('keydown', (event) => {

    if(state == 0) state = 1; // start screen
    else if(state == 3) { // choose parts
        switch(event.key) {
            case 'a':
                chosen_piece = 'l';
                state = 4;
                break;
            case 'd':
                chosen_piece = 'r';
                state = 4;
                break;
        }
    }

    console.log(event.key);
})

function animate() {
    let a = window.requestAnimationFrame(animate);
    if(state == 0) { // load title screen
        c.fillStyle = 'black';
        c.fillRect(0,0, canvas.width, canvas.height);
        c.font = '11px monospace';
        c.fillStyle = 'white';
        const motto = "You are a conqueror because you conquer yourself, your demons.";
        const motto2 = "Most of them couldn't conquer their demons."
        const slogan = "Maximize fun.";
        const slogan2 = "Made to live for 100+ years.";
        const pressanykey ="[press any key]";
        c.fillText(motto,(canvas.width/2) - (c.measureText(motto).width/2),-30 + canvas.height/2);
        c.fillText(motto2,(canvas.width/2) - (c.measureText(motto2).width/2), canvas.height/2);
        c.fillText(slogan,(canvas.width/2) - (c.measureText(slogan).width/2),30 + canvas.height/2);
        c.fillText(slogan2,(canvas.width/2) - (c.measureText(slogan2).width/2),60 + canvas.height/2);
        c.fillText(pressanykey,(canvas.width/2) - (c.measureText(pressanykey).width/2),90 + canvas.height/2);
    }
    else if(state == 1) { // load bots
        populate();
        state = 2;
    }
    else if(state == 2) { // draw first game state
        c.fillStyle = 'black';
        c.fillRect(0,0,canvas.width,canvas.height);
        state = decision();
        drawPosition(); 
        drawStats();
        drawState();
    }
    //else if(state == 3) { // get user input, do nothing  
    else if (state == 4) { // move
        move();
        state = drawPosition();
    }
    else if (state == 5) { // move graphically
        state = drawPosition();
    }
    else if (state == 6) {
        state = decision();
        drawStats();
        drawLogs();
        drawState();
    }
     
}

// globals
demons = new Array(6);
position = new Array(demons.length).fill(0);
direction = new Array(demons.length).fill(0); // 0 means heading to 0, 1 means heading to 100
alive = new Array(demons.length).fill(true); // 1 means alive, 0 means dead
action = new Array(demons.length).fill(null); // null means no action, 'l' = left, 'r' = right, 'h' = head, 'b' = bottom
team = new Array(demons.length).fill(0); 
chosen_piece = null; // piece chosen for user input
demons_turn = -1; // waiting for user input for this index
logs = [];
visual_position = new Array(demons.length).fill(0);
visual_direction = new Array(demons.length).fill(0);

animate();

function drawStats() {

    c.fillStyle = 'black';
    c.fillRect(0,0,270,600);

    c.font = '11px monospace';
    c.fillStyle = 'white';

    for(let i = 0; i < demons.length; i++) {
        c.fillText(i + " " + (alive[i] ? "active" : "rip") + " " + direction[i] + " " + Math.round(position[i]*10)/10 + " " + ((action[i] == null) ? '-' : action[i]) + ((i == demons_turn) ? " <-" : ""), 50, 50 + (i*70));
        c.fillText("H: " + demons[i].h.health + " L: " + demons[i].l.health + " R: " + demons[i].r.health + " B: " + demons[i].b.health, 50, 70 + (i*70));
        c.fillText("latk: " + demons[i].l.atk + " ratk: " + demons[i].r.atk + " spe: " + demons[i].b.speed, 50, 90 + (i*70));
    }
}

function drawLogs() {

    c.fillStyle = 'black';
    c.fillRect(0,600,270, canvas.height-600);

    c.font = '11px monospace';
    c.fillStyle = 'white';

    j = 0;
    for(var i = ((logs.length - 10 >= 0) ? logs.length-10 : 0); i < logs.length; i++) {
        c.fillText(logs[i], 50, 500 + (j*20));
        j++;
    }
}

function populate() {
    for(let i = 0; i < demons.length; i++) {
        const a_h = new part(2,1);
        const a_l = new part(2,1);
        const a_r = new part(1,2);
        const a_b = new legs(2,Math.floor(Math.random() * 100) + 1);
        //const a_b = new legs(2,1);
        if(i % 2 == 0) {
            demons[i] = new demon(a_h, a_l, a_r, a_b, 0);
            team[i] = 0;
        }
        else {
            demons[i] = new demon(a_h, a_l, a_r, a_b, 1);
            team[i] = 1;
        }
    }
    console.log("populating demons");
    for(const i in demons) {console.log(i, demons[i].h.health, demons[i].l.health, demons[i].r.health, demons[i].b.health);}
}

function drawState() {

    c.fillStyle = 'black';
    c.fillRect(270,0,80,500);

    for(let i = 0; i< demons.length; i++) {    
        if(demons[i].h.health > 0) { c.fillStyle = 'green';}
        else { c.fillStyle = 'red';}
        c.fillRect(275, 50 + i*70,5,5);
        if(demons[i].l.health > 0) { c.fillStyle = 'green';}
        else { c.fillStyle = 'red';}
        c.fillRect(270, 55 + i*70,5,7);
        if(demons[i].r.health > 0) { c.fillStyle = 'green';}
        else { c.fillStyle = 'red';}
        c.fillRect(280, 55 + i*70,5,7);
        if(demons[i].b.health > 0) { c.fillStyle = 'green';}
        else { c.fillStyle = 'red';}
        c.fillRect(275, 60 + i*70,5,7);
    }
}

function drawPosition() {
    c.fillStyle = 'black';
    c.fillRect(350,0, canvas.width-350, canvas.height);
    c.font = '11px monospace';
    c.fillStyle = 'white';

    for(let i = 0; i < demons.length; i++) {
        if(visual_position[i] < position[i]) {visual_direction[i] = 1;}
        else if(visual_position[i] > position[i]) {visual_direction[i] = 0;}
    }

    let in_pos = true;

    for(let i = 0; i < demons.length; i++) {    
        let road = 'o' + "-".repeat(99) + 'x';
        if(alive[i]) {
            
            console.log(i,visual_direction[i], visual_position[i], position[i], Math.round(position[i]), direction[i], "inpos", in_pos);

            if(visual_position[i] == position[i]) {
                let road_mod = road.substring(0, Math.round(position[i])) + (direction[i] ? '>' : '<') + road.substring(Math.round(position[i]) + 1);
                c.fillText(road_mod, 350, 50 + i*70);
            }
            else {
                in_pos=false;
                if(visual_direction[i] == 0) {
                    if(visual_position[i] - (demons[i].b.speed/100) < position[i]) {
                        visual_position[i] = position[i];
                    }
                    else {
                        visual_position[i] = visual_position[i] - (demons[i].b.speed/100);
                    }
                }
                else { //direction[i] == 1
                    if(visual_position[i] + (demons[i].b.speed/100) > position[i]) {
                        visual_position[i] = position[i];
                    }
                    else {
                        visual_position[i] = visual_position[i] + (demons[i].b.speed/100);
                    }
                }
                let road_mod = road.substring(0, Math.round(visual_position[i])) + (direction[i] ? '>' : '<') + road.substring(Math.round(visual_position[i]) + 1);
                c.fillText(road_mod, 350, 50 + i*70);
            }
        }
    }

    if(in_pos==true) {return 6;}
    else return 5;

}

function move() {
    // calculate the closest demon to an action
    let lowest_multiple = Infinity;
    for(let j = 0; j < position.length; j++) {
        const temp = (direction[j] ? 100-position[j] : position[j]); //distance left in direction
        console.log(j, "pos:", position[j], "dir:", direction[j], "mult:", temp/demons[j].b.speed,"h:",demons[j].h.health,"l:",demons[j].l.health,"r:",demons[j].r.health,"le:",demons[j].b.health);
        if(alive[j] == false) {continue;}
        else if(temp/demons[j].b.speed < lowest_multiple) {lowest_multiple = temp/demons[j].b.speed;}
    }
    console.log("lowest multiple: ", lowest_multiple);

    // move all demons (the speed system), find demons with an action
    for(let j = 0; j < position.length; j++) {
        if(alive[j] == false) {continue;}
        else if(direction[j] == 0) {position[j] = position[j] - (demons[j].b.speed * lowest_multiple);} // move backwards
        else {position[j] = position[j] + (demons[j].b.speed * lowest_multiple);} // move forwards

        if(position[j]<0) {position[j]=0}; // some weird float glitch happens sometimes

        console.log(j, "pos:", position[j], "dir:", direction[j]);
    }
}

function decision() {
    const winner = new Array()
    for(let j = 0; j < demons.length; j++) {
        if(( (position[j] == 0) && (direction[j] == 0) ) || ( (position[j] == 100) && (direction[j] == 1) )) {winner.push(j)} // add to action list
    }

    // go through winners, make actions, check if dead, & change direction
    for(let j = 0; j < winner.length; j++) {
        if(alive[winner[j]] == false) {
            continue;
        }
        if(direction[winner[j]] == 0) {
            console.log(winner[j], "action", chosen_piece);
            demons_turn = -1;
            
            // have to wait for user to pick an action here;
            if(chosen_piece == 'l') {
                action[winner[j]] = 'l';
                direction[winner[j]] = 1;
                chosen_piece = null;
            }
            else if(chosen_piece == 'r') {
                action[winner[j]] = 'r';
                direction[winner[j]] = 1;
                chosen_piece = null;
            }
            else {
                demons_turn = winner[j];
                return 3;
            }
        }
        else { // find enemies, pick closest on list of enemies
            let closest = null, closest_distance = Number.NEGATIVE_INFINITY;
            for(let k = 0; k < demons.length; k++) { // find enemies
                if( (demons[k].alive==true) && (demons[winner[j]].team != demons[k].team) && (position[k] > closest_distance)) {
                    closest = k;
                    closest_distance = position[k];
                }
            }
            console.log("closest", closest, "closest_distance", closest_distance);
            if(closest != null) {
                if(action[winner[j]] == "l") {
                    if(demons[winner[j]].l.health <= 0) {
                        console.log(winner[j], "left is broken!");
                    }
                    else {
                        let dmg_log = demons[closest].dmg(winner[j], closest, demons[winner[j]].l.atk, Math.floor(Math.random()*4), true); //0=h,1=l,2=r,3=le,4=rng
                        logs.push(String(winner[j]) + String(action[winner[j]]) + String(closest) + "(" + demons[winner[j]].l.atk + ")" + dmg_log);
                    }
                }
                else if(action[winner[j]] == "r") {
                    if(demons[winner[j]].r.health <= 0) {
                        console.log(winner[j], "right is broken!");
                    }
                    else {
                        let dmg_log = demons[closest].dmg(winner[j], closest,  demons[winner[j]].r.atk, Math.floor(Math.random()*4), true); //0=h,1=l,2=r,3=le,4=rng
                        logs.push(String(winner[j]) + String(action[winner[j]]) + String(closest) + "(" + demons[winner[j]].r.atk + ")" + dmg_log);
                    }
                }

                if(demons[closest].alive == false) {
                    position[closest] = null;
                    alive[closest] = false;
                    action[closest] = null;
                }
            }
            action[winner[j]] = null;
            direction[winner[j]] = 0;
        }
    }
    return 4;
}




