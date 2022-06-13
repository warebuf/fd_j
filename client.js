console.log("You are a conqueror because you conquer yourself, your demons. Most of them couldn't conquer their demons.");
console.log("Goal: Maximize fun")

// BUG: if somehow no one can attack, have to somehow end the game

// init     
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(f){return setTimeout(f, 1000/60)};
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || function(requestID){clearTimeout(requestID)};
const socket = io();

// client variables
var state = 0;
var username = Math.floor(Math.random() * 1000000) + 1;

socket.on('new user', function(data){
    console.log("recieved 'new user', which gives us the list of users", data);
});

socket.on('load_state', function(data){ // state is in 1
    gid = data.gid;
    t_name = data.t_name;

    for(let i = 0; i < data.t_name.length; i++) {
        if(data.t_name[i] == username) {
            player_idx = i;
        }
    }

    // BUG: eventually remove server_position, server_direction
    server_t = data.t;
    server_position = data.position;
    server_direction = data.direction;

    // BUG: need to update this part
    client_action = data.action;
    client_logs = data.log;

    console.log("recieved 'load_state', which loads in all game_state data");

});

socket.on('act_update', function(data){ // 
    server_act_his.push(data.action);
    console.log("recieved 'act_update', which loads in current game_state actions", data);
});

socket.on('pos_update', function(data){ // state is in 2 when we ask for input
    server_action = data.pos;
    server_direction = data.dir;
    server_pos_his.push(data.pos);
    server_dir_his.push(data.dir);

    console.log("recieved 'pos_update', which loads in current game_state pos/dir", data);
});

socket.on('atk_update', function(data){
    server_log.push(data.attack);
    console.log("recieved 'atk_update'", data.attack);
});

socket.on('game_over', function(data){
    game_on = data.game;
    console.log("game over signal");
});

window.addEventListener('keydown', (event) => {

    if(state == 8) { // start screen
        socket.emit("join_server", username);
        state = 7;
    }
    else if(state == 20) {
        switch(event.key) {
            case ' ':
                state = 7;
                break;
        }
    }
    else if(state == 3) { // choose parts
        switch(event.key) {
            case 'a':
                socket.emit('action', {action: 'l', user:username, gid:gid, player_idx:player_idx, demons_turn:demons_turn});
                demons_turn = -1;
                break;
            case 'd':
                socket.emit('action', {action: 'r', user:username, gid:gid, player_idx:player_idx, demons_turn:demons_turn});
                demons_turn = -1;
                break;
        }
    }
    else if(state == 9) {
        switch(event.key) {
            case '1':
                state = 1;
                socket.emit('game_type', {game_mode: '1', user:username});
                break;
            case '2':
                //state = 1; multiplayer not yet implemented
                socket.emit('game_type', {game_mode: '2', user:username});
                break;
        }
    }
})

function animate() { // TODO: might be a better way to organize states (not inside drawing function)
    let a = window.requestAnimationFrame(animate);
    if(state == 0) { // title page
        c.fillStyle = '#191626';
        //c.fillStyle = '#1A122E';
        c.fillRect(0,0, canvas.width, canvas.height);

        let t1 = "You are a conqueror because you conquer yourself, your demons.";
        let t2 = "Made to live for 100+ years.";
        let t3 = "Maximize fun.";
        let t4 ="[press any key]";

        c.font = '11px monospace';
        c.fillStyle = 'white';
        c.fillText(t1,(canvas.width*1/2) - (c.measureText(t1).width/2),(canvas.height*5/100) + (canvas.height/2));
        state = 8;
    }
    else if(state == 8) {
        // waiting for username, password
    }
    else if(state == 7) { // game election screen
        c.fillStyle = '#232616';
        c.fillRect(0,0, canvas.width, canvas.height);
        c.font = '11px monospace';
        c.fillStyle = 'white';
        c.fillText("[1] single player",(canvas.width/2) - (c.measureText("[1] single player").width/2), canvas.height/2);
        c.fillText("[2] multiplayer",(canvas.width/2) - (c.measureText("[2] multiplayer").width/2), 30 + canvas.height/2);
        c.fillText("[3] inventory",(canvas.width/2) - (c.measureText("[3] inventory").width/2), 60 + canvas.height/2);
        state = 9;
    }
    else if(state == 9) {
        // waiting for game selection input
    }
    else if(state == 1) { 
        // wait to recieve player team and enemy team from server
        if(gid >= 0) {
            state = 2;
        }
    }
    else if(state == 2) { // initialize the game
        client_t = server_t;
        client_position = server_position;
        client_direction = server_direction;
        for(let i = 0; i < client_action.length; i++) {
            for(let j = 0; j < client_action[i].length; j++) {
                client_action[i][j] = null;
            }
        }
        state = 6;
    }
    else if(state == 6) { // draw game state
        c.fillStyle = 'black';
        c.fillRect(0,0,canvas.width,canvas.height);
        chooseAction(); // we want to update whose turn we are waiting for so that we can draw it
        drawStats();
        drawState();
        drawPos();
        drawLogs();
        state = 12;
    }
    else if(state == 12) { // this game state exists because we just don't want to constantly draw
        state = chooseAction();
    }
    else if(state == 3) {   // we are waiting for an action from our client, BUG: sometimes can throw a -1 demons_turn
        if(actstate < server_act_his.length) {
            console.log("(s3) setting client-action for", server_act_his[actstate]);
            if(client_action[server_act_his[actstate][0]][server_act_his[actstate][1]] != null) {
                console.log("TRIED TO SET ALREADY SET INPUT");
            }
            else {
                client_action[server_act_his[actstate][0]][server_act_his[actstate][1]] = server_act_his[actstate][2];
                client_direction[server_act_his[actstate][0]][server_act_his[actstate][1]] = 1;
                actstate++;
                state = 6;
            }
        }

        let start = Date.now().toLocaleString('en-CH');
        c.fillStyle = 'black';
        c.fillRect((canvas.width/2)-(c.measureText(start).width/2),(canvas.height/2)-c.measureText('M').width,c.measureText(start).width,c.measureText('M').width);
        c.fillStyle = 'white';
        c.fillText(start,(canvas.width/2) - (c.measureText(start).width/2), canvas.height/2);
    }
    else if(state == 4) { // wait for other users action to come in
        if(actstate < server_act_his.length) {
            console.log("(s4) setting client-action for", server_act_his[actstate]);
            if(client_action[server_act_his[actstate][0]][server_act_his[actstate][1]] != null) { // if for whatever reason, 
                console.log("TRIED TO SET ALREADY SET INPUT");
            }
            else {
                client_action[server_act_his[actstate][0]][server_act_his[actstate][1]] = server_act_his[actstate][2];
                client_direction[server_act_his[actstate][0]][server_act_his[actstate][1]] = 1;
                actstate++;
                state = 6;
            }
        }
    }
    else if(state == 5) { // find which server state we want
        drawStats();
        drawState();
        drawLogs();
        state = 13;
    }
    // if pstate exceeds the history length, wait for position update
    else if(state == 13) {         
        if(pstate < server_pos_his.length) { 
            state = 11;
        }
    }
    else if(state == 11) { // move and draw
        state = move();
        drawPos();
    }
    else if(state == 10) { // fulfill attack
        drawStats();
        drawState();
        drawLogs();

        // BUG: need to add 'animation state'

        // log of the form: [turn,[atki,atkj],[defi,defj],part,tot_dmg,[attack_chain]]
        let atker = server_log[atkstate][1];
        if(server_log[atkstate][2] == null) { // missed attack because part was broken (defender is null)
            client_logs.push(server_log[atkstate]);
            console.log(atker, "could not attack! part was broken.")
        }
        else {
            let receipt = dmg_replay(server_log[atkstate][2], server_log[atkstate][4], server_log[atkstate][5]); // of the form: defer, atk, [attack_chain]
            client_logs.push(server_log[atkstate]);
            console.log("printing attack", server_log[atkstate]);
        }
        client_direction[atker[0]][atker[1]] = 0;
        client_action[atker[0]][atker[1]] = null;
        atkstate++;
        drawStats();
        drawPos();
        drawState();
        drawLogs();
        state = 11;
    }
    else if(state == 20) { //game over screen
        c.font = '11px monospace';
        c.fillStyle = 'green';
        let t1 = "game over, press [space] for menu";
        c.fillText(t1,(canvas.width*1/2) - (c.measureText(t1).width/2),(canvas.height*5/100) + (canvas.height/2));

        // reset all variables
        t_name = [];
        game_on = true;
        gid = -1;
        player_idx = -1;
        demons_turn = -1;
        pstate = 0;
        atkstate = 0;
        actstate = 0;
        server_t = [];
        server_position = [];
        server_direction = []; 
        server_log = [];
        server_pos_his = [];
        server_dir_his = [];
        server_act_his = []; 
        client_t = [];
        client_position = [];
        client_direction = [];
        client_action = []; 
        client_logs = [];
    }
}

// in game variables
var t_name = [];
var game_on = true;
var gid = -1;
var player_idx = -1;
var demons_turn = -1; // waiting for user input for this index
var pstate = 0;
var atkstate = 0;
var actstate = 0;

// server game state
var server_t = [];
var server_position = [];
var server_direction = []; // 0 means heading to 0, 1 means heading to 100
var server_log = []; // log of attacks
var server_pos_his = [];
var server_dir_his = [];
var server_act_his = []; // of the form [[player_idx, unit_idx, part],...,]

// client game state
var client_t = [];
var client_position = [];
var client_direction = [];
var client_action = []; // null means no action, 'l' = left, 'r' = right, 'h' = head, 'b' = bottom
var client_logs = []; // displays actions performed via client-side

animate();

function drawStats() {
    c.fillStyle = 'black';
    c.fillRect(0,0,200,canvas.height);
    c.font = '11px monospace';
    c.fillStyle = 'white';
    for(let i = 0; i < client_t.length; i++) {
        for(let j = 0; j < client_t[i].length; j++) {
            c.fillText(i + " " + ((client_t[i][j].h.health>0) ? "active" : "rip") + " " + client_direction[i][j] + " " + Math.round(client_position[i][j]) + " " + ((client_action[i][j] == null) ? '-' : client_action[i][j]) + (((i==player_idx)&&(j==demons_turn)) ? " <-" : ""), 50, (i*400) + 50 + (j*70));
            c.fillText("H: " + client_t[i][j].h.health + " L: " + client_t[i][j].l.health + " R: " + client_t[i][j].r.health + " B: " + client_t[i][j].b.health, 50, (i*400) + 70 + (j*70));
            c.fillText("latk: " + client_t[i][j].l.atk + " ratk: " + client_t[i][j].r.atk + " spe: " + client_t[i][j].b.speed, 50, (i*400) + 90 + (j*70));
        }
    }
}

function drawLogs() {
    c.fillStyle = 'black';
    c.fillRect(870,0,canvas.width, canvas.height);
    c.font = '11px monospace';
    c.fillStyle = 'white';
    
    // of the form [turn,[atki,atkj],[defi,defj],action,tot_dmg,[attack_chain]]
    j = 0;
    for(var i = ((client_logs.length - 10 >= 0) ? client_logs.length-10 : 0); i < client_logs.length; i++) {
        if(client_logs[i][2] == null) {
            c.fillText("turn "+client_logs[i][0]+": "+ client_logs[i][1][0]+","+client_logs[i][1][1]+" can't attack! part is broken.", 870, 50 + (j*20));
        }
        else {
            let turn = client_logs[i][0];
            let atker = client_logs[i][1];
            let defer = client_logs[i][2];
            let action_part = client_logs[i][3];
            let tot_dmg = client_logs[i][4];
            let atk_chain = client_logs[i][5];
            c.fillText("turn "+turn+": ("+atker[0]+","+atker[1]+","+action_part+") -> ("+defer[0]+","+defer[1]+") dmg: "+tot_dmg+" ("+atk_chain+")", 870, 50 + (j*20));
        }
        j++;
    }
}

function drawState() {
    c.fillStyle = 'black';
    c.fillRect(200,0,50,canvas.height);
    for(let i = 0; i < client_t.length; i++) {
        for(let j = 0; j< client_t[i].length; j++) {    
            if(client_t[i][j].h.health > 0) { c.fillStyle = 'green';}
            else { c.fillStyle = 'red';}
            c.fillRect(225, (i*400) + 50 + (j*70),5,5);
            if(client_t[i][j].l.health > 0) { c.fillStyle = 'green';}
            else { c.fillStyle = 'red';}
            c.fillRect(220, (i*400) + 55 + (j*70),5,7); // make it 270,5,7 OR 269,6,4
            if(client_t[i][j].r.health > 0) { c.fillStyle = 'green';}
            else { c.fillStyle = 'red';}
            c.fillRect(230, (i*400) + 55 + (j*70),5,7);
            if(client_t[i][j].b.health > 0) { c.fillStyle = 'green';}
            else { c.fillStyle = 'red';}
            c.fillRect(225, (i*400) + 60 + (j*70),5,7);
        }
    }
    
}

function drawPos() { 
    c.fillStyle = 'black';
    c.fillRect(250,0,620, canvas.height);
    c.font = '11px monospace';
    c.fillStyle = 'white';
    for(let i = 0; i < client_t.length; i++) {    
        for(let j = 0; j < client_t[i].length; j++) {
            if(client_t[i][j].h.health > 0) {
                let road = 'o' + "-".repeat(99) + 'x';
                if(client_t[i][j].h.health > 0) {
                    road = road.substring(0, Math.round(client_position[i][j])) + (client_direction[i][j] ? '>' : '<') + road.substring(Math.round(client_position[i][j]) + 1);
                }
                c.fillText(road, 250, (i*400) + 50 + (j*70));
            }
        }
    }
}

function chooseAction() {
    //  check if our client needs to give the server any actions, if we do, return to state 3
    for(let i = 0; i < client_action[player_idx].length; i++) {
        if (client_t[player_idx][i].h.health <= 0) {continue;}
        if( (client_position[player_idx][i] == 0) && (client_direction[player_idx][i] == 0) && (client_action[player_idx][i] == null)) {
            demons_turn = i; 
            console.log("returned to state 3, ie waiting for 'me' client input for unit", i);
            return 3;
        }
    }
    // otherwise, check if any demons need an action, if so, return to state 4
    for(let i = 0; i < client_action.length; i++) {
        if(i!=player_idx){
            for(let j = 0; j < client_action[i].length; j++) {
                if(client_t[i][j].h.health <= 0) {continue;}

                if( (client_position[i][j] == 0) && (client_direction[i][j] == 0) && (client_action[i][j] == null)) {
                    console.log("returned to state 4, ie waiting for other client input");
                    return 4;
                }
            }
        }
    }
    // if no one needs an action, we can calculate the next position, go to state 5
    console.log("returned to state 5");
    return 5;
}

// incremental move for all client demons to server demon
function move() {
    let return_state = 11; // if we can attack 10, if we need input 6, if we need to continue to draw 11 

    // game over check, may be a little slow when server knows game is over
    if(game_on == false) { 
        for(let i = 0; i < client_t.length; i++) {
            let game_over_check = true;
            for(let j = 0; j < client_t[i].length; j++) {
                if(client_t[i][j].h.health > 0) { // a team member is alive
                    game_over_check = false;
                    break;
                }
            }
            if(game_over_check == true) {
                return 20;
            }
        }
    }

    // check if anyone is in attack/wait position, if so, we can return straight to the wait/attack state
    for(let i = 0; i < client_t.length; i++) {
        for(let j = 0; j < client_t[i].length; j++) {
            if((client_direction[i][j] == 0) && (client_position[i][j] <= 0)) {
                if(return_state == 11) {return_state = 6;}
            }
            else if((client_direction[i][j] == 1) && (client_position[i][j] >= 100)) {
                return_state = 10;
            }
        }
    }
    if((return_state == 6) || (return_state == 10)) {
        console.log("we returned to state 6/10 (wait/atk state)")
        return return_state;
    }

    let game_speed = 100; // higher is slower, lower is faster
    // otherwise, move all units
    let completed_state = true;
    for(let i = 0; i < client_t.length; i++) {
        for(let j = 0; j < client_t[i].length; j++) {
            if(client_t[i][j].h.health > 0) {
                if(client_direction[i][j] == 0) {
                    if(client_position[i][j] - (client_t[i][j].b.speed/game_speed) <= server_pos_his[pstate][i][j] ) {
                        client_position[i][j] = server_pos_his[pstate][i][j];
                    }
                    else {
                        client_position[i][j] -= (client_t[i][j].b.speed/game_speed);
                        completed_state = false;
                    }
                }
                else {
                    if(client_position[i][j] + (client_t[i][j].b.speed/game_speed) >= server_pos_his[pstate][i][j] ) {
                        client_position[i][j] = server_pos_his[pstate][i][j];
                    }
                    else {
                        client_position[i][j] += (client_t[i][j].b.speed/game_speed);
                        completed_state = false;
                    }
                }
            }
        }
    }

    // if we completed movement, increment the next pstate
    if(completed_state == true) {pstate++;}

    return return_state;
}

// instead of sending object file (demon.js) to client, just call this
function dmg_replay(defer, atk, list) {
    let tot_atk = atk;
    let history = [];
    for(let i = 0; i < list.length; i++) {
        if(list[i] == 'h') {
            history.push('h');
            if(tot_atk > client_t[defer[0]][defer[1]].h.health) {
                tot_atk = tot_atk - client_t[defer[0]][defer[1]].h.health;
                client_t[defer[0]][defer[1]].h.health = 0;
            }
            else {
                client_t[defer[0]][defer[1]].h.health -= tot_atk;
                tot_atk = 0;
            }
        }
        else if(list[i] == 'l') {
            history.push('l');
            if(tot_atk > client_t[defer[0]][defer[1]].l.health) {
                tot_atk = tot_atk - client_t[defer[0]][defer[1]].l.health;
                client_t[defer[0]][defer[1]].l.health = 0;
            }
            else {
                client_t[defer[0]][defer[1]].l.health -= tot_atk;
                tot_atk = 0;
            }
        }
        else if(list[i] == 'r') {
            history.push('r');
            if(tot_atk > client_t[defer[0]][defer[1]].r.health) {
                tot_atk = tot_atk - client_t[defer[0]][defer[1]].r.health;
                client_t[defer[0]][defer[1]].r.health = 0;
            }
            else {
                client_t[defer[0]][defer[1]].r.health -= tot_atk;
                tot_atk = 0;
            }
        }
        else if(list[i] == 'b') {
            history.push('b');
            if(tot_atk > client_t[defer[0]][defer[1]].b.health) {
                tot_atk = tot_atk - client_t[defer[0]][defer[1]].b.health;
                client_t[defer[0]][defer[1]].b.health = 0;
            }
            else {
                client_t[defer[0]][defer[1]].b.health -= tot_atk;
                tot_atk = 0;
            }
        }
    }
    return history;
}
