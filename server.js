const express = require('express');
const app = express();
const serv = require('http').Server(app);
const io = require('socket.io')(serv, {});

app.use('/', express.static(__dirname + '/'));
 
app.get('/', function(req,res) {
    res.sendFile(__dirname + '/index.html');
    console.log('express connection');
});

serv.listen(3000);
//serv.listen(3000, '0.0.0.0');
console.log('server is running on port 3000');

// BUG: have to clean up and play test

var players = new Map();
var inventory = new Map();
var games = [];
var game_count = 0;
var timeouts = [];

io.sockets.on('connection', function(socket) {
    console.log(socket.id);

    socket.on("join_server", (username) => {
        const user = {
            username,
            id: socket.id
        }
        console.log(user.username, user.id, "has joined the server.");
        players.set(username, socket.id);
        inventory.set(username, ["h0000001","l0000001","r0000002","b0000001",
                                 "h0000001","l0000001","r0000002","b0000001",
                                 "h0000001","l0000001","r0000002","b0000001"
                                ]); 
        io.emit("new user", players);
    });

    socket.on('game_type', function(data){
        console.log(data.user, data.game_mode);

        if(data.game_mode == '1') {

            let temp = ["h0000001","l0000001","r0000002","b0000001",
                        "h0000001","l0000001","r0000002","b0000001",
                        "h0000001","l0000001","r0000002","b0000001"
                        ];

            let num_units = 3;
            let num_players = 2;

            let temp_pos = [];
            let temp_dir = [];
            let temp_action = [];
            let temp_timeout = [];

            for(let i = 0; i < num_players; i++) {
                temp_pos.push(new Array(num_units).fill(0));
                temp_dir.push(new Array(num_units).fill(0));
                temp_action.push(new Array(num_units).fill(null));
                temp_timeout.push(null);
            }

            timeouts.push(temp_timeout);

            games.push({ //eventually add stats
                gid: game_count, 
                game_on: true,
                t: [populate(inventory.get(data.user)), populate(temp)], 
                t_name: [data.user, "bot"],
                socket_ids: [socket.id, "bot"],
                position: temp_pos,
                direction: temp_dir,
                action: temp_action,
                log: [], //of the form [turn,[atki,atkj],[defi,defj],action,tot_dmg,[attack_chain]]
                action_history: [],
                rec_pos: [], // short for recent_position
                rec_dir: [], // short for recent_direction
                game_on: 1,
                turn: 0
            });

            // set timeouts for initial

            for(let i = 0; i < games[game_count].socket_ids.length; i++) {
                if(games[game_count].socket_ids[i] != "bot") {
                    console.log("set timeout for", i);
                    timeouts[game_count][i] = setTimeout(autoplay,20000,game_count,i); //20s
                }
            }

            socket.emit('load_state', games[game_count]);
            game_count++;
            
        }
    });

    socket.on('action', function(data){
        console.log("recieved action from", data.user, data.action, data.gid, data.player_idx, data.demons_turn);

        if(games[data.gid].action[data.player_idx][data.demons_turn] == null) {
            if(data.action == 'l') {
                clearTimeout(timeouts[data.gid][data.player_idx]);
                timeouts[data.gid][data.player_idx] = null;
                console.log("cleared timeout for", data.player_idx);

                games[data.gid].action[data.player_idx][data.demons_turn] = 'l';
                games[data.gid].action_history.push([data.player_idx,data.demons_turn,'l']); // of the form player_idx, unit_idx, action
                games[data.gid].direction[data.player_idx][data.demons_turn] = 1;
                io.emit('act_update', {action:[data.player_idx,data.demons_turn,'l']});

                if(move(data.gid)) {
                    do {simulate(data.gid);}
                    while(move(data.gid));
                }
                else {
                    simulate(data.gid);
                }
            }
            else if(data.action == 'r') {
                clearTimeout(timeouts[data.gid][data.player_idx]);
                timeouts[data.gid][data.player_idx] = null;
                console.log("cleared timeout for", data.player_idx);

                games[data.gid].action[data.player_idx][data.demons_turn] = 'r';
                games[data.gid].action_history.push([data.player_idx,data.demons_turn,'r']); // of the form player_idx, unit_idx, action
                games[data.gid].direction[data.player_idx][data.demons_turn] = 1;
                io.emit('act_update', {action:[data.player_idx,data.demons_turn,'r']});

                if(move(data.gid)) {
                    do {simulate(data.gid);}
                    while(move(data.gid));
                }
                else {
                    simulate(data.gid);
                }
            }
        }
    });
});

var part = require('./part.js');
var demon = require('./demon.js');

// will move all demons (if none are in wait-for-input/ready-to-attack position), returns false if we are waiting for input
function move(gid) {
    if(games[gid].game_on == 0) {return false;}

    // if we are waiting for input for someone who isn't a bot, return false (stopping simulation loop)
    for(let i = 0; i < games[gid].position.length; i++) {
        if(games[gid].t_name[i]!="bot") {
            for(let j = 0; j < games[gid].position[i].length; j++) {
                if(games[gid].t[i][j].h.health>0) {
                    if((games[gid].position[i][j] <= 0) && (games[gid].direction[i][j] == 0) && (games[gid].action[i][j] == null)) {
                        console.log("returned false b/c waiting for input", games[gid].position[i][j], games[gid].direction[i][j], games[gid].action[i][j]);
                        return false;
                    }
                }
            }           
        }
    }

    // find the demon who will act next
    let lowest_multiple = Infinity;
    for(let i = 0; i < games[gid].position.length; i++) {
        for(let j = 0; j < games[gid].position[i].length; j++) {
            if(games[gid].t[i][j].h.health <= 0) {continue;}
            let distance_left = (games[gid].direction[i][j] ? 100-games[gid].position[i][j] : games[gid].position[i][j]); //distance left in direction
            console.log(i,j,"pos",games[gid].position[i][j],"dir",games[gid].direction[i][j],"mult",distance_left/games[gid].t[i][j].b.speed,"spe",games[gid].t[i][j].b.speed);
            if(distance_left/games[gid].t[i][j].b.speed < lowest_multiple) {lowest_multiple = distance_left/games[gid].t[i][j].b.speed;}
        }
    }
    console.log("lowest multiple:", lowest_multiple);

    // move everyone
    for(let i = 0; i < games[gid].position.length; i++) {
        for(let j = 0; j < games[gid].position[i].length; j++) {
            if(games[gid].t[i][j].h.health <= 0) {continue;}
            else if(games[gid].direction[i][j] == 0) {games[gid].position[i][j] -= precisionRound(games[gid].t[i][j].b.speed*lowest_multiple,10);}
            else if(games[gid].direction[i][j] == 1) {games[gid].position[i][j] += precisionRound(games[gid].t[i][j].b.speed*lowest_multiple,10);}

            // get rid of any weird floating point glitches
            if(games[gid].position[i][j]<0.000000001) {games[gid].position[i][j]=0;} 
            if(games[gid].position[i][j]>99.999999999) {games[gid].position[i][j]=100;} 

            console.log(i,j,"pos",games[gid].position[i][j],"dir",games[gid].direction[i][j]);
        }
    }

    if(lowest_multiple > 0) {
        io.emit('rec_update', {rec_pos:games[gid].rec_pos, rec_dir:games[gid].rec_dir});
        io.emit('pos_update', {pos:games[gid].position, dir:games[gid].direction});
        return true;
    }
    else {
        return false;
    }
}

// will find the demons in ask or attack position
// if in attack position, execute attack
// if in ask position, either fulfill bot ask or send 'action_req' to users
function simulate(gid) { 
    let actioners = new Array(); // each team has an array, each array is filled with ready attackers of that team
    let attackers = new Array(); // each team has an array, each array is filled with ready attackers of that team

    let attacked = false;
    for(let i = 0; i < games[gid].t.length; i++) { // find the list of ready attackers and actioners
        actioners.push([]);
        attackers.push([]);
        for(let j = 0; j < games[gid].position[i].length; j++) {
            if(games[gid].t[i][j].h.health > 0) {
                if( (games[gid].position[i][j] <= 0) && (games[gid].direction[i][j] == 0) && (games[gid].action[i][j] == null)) {
                    actioners[i].push(j);
                }
                if( (games[gid].position[i][j] >= 100) && (games[gid].direction[i][j] == 1)) {
                    if(games[gid].action[i][j] == 'l') {
                        if(games[gid].t[i][j].l.health > 0) {attackers[i].push(j);}
                        else {
                            games[gid].direction[i][j] = 0;
                            games[gid].action[i][j] = null;
                            console.log("l was destroyed for",i,j);
                            games[gid].log.push([games[gid].turn, [i,j], null, games[gid].action[i][j], null, null]);
                            io.emit('atk_update', {attack:games[gid].log.at(-1)});
                            attacked = true;
                        }
                    }
                    else if(games[gid].action[i][j] == 'r') {
                        if(games[gid].t[i][j].r.health > 0) {attackers[i].push(j);}
                        else {
                            games[gid].direction[i][j] = 0;
                            games[gid].action[i][j] = null;
                            console.log("r was destroyed for",i,j);
                            games[gid].log.push([games[gid].turn, [i,j], null, games[gid].action[i][j], null, null]);
                            io.emit('atk_update', {attack:games[gid].log.at(-1)});
                            attacked = true;
                        }
                    }
                }
            }
        }
    }

    console.log("actioners:", actioners, "attackers:", attackers);
    // attackers attack before actioners, opponents attack at same time (for fairness sake, a part broken in a simutaneous attack still goes through), if same team, treat as normal (does not hurt same parts)
    // assemble opponents into dictionary, convert to list, sort the list [[position,[[i1,j1],[i2,j2],...]],...], do combat for a team and take out deaths (runtime is n^2 instead of n, b/c we sort)
    // TODO: eventually add hack to make it n runtime if only 1 attacker on that team
    for(let i = 0; i < attackers.length; i++) {
        if(attackers[i].length == 0) {
            console.log("no attackers for team",i);
            continue;
        }

        let opponents = {};
        let opponents_size = 0;
        for(let j = 0; j < games[gid].position.length; j++) { // assemble opponents into dictionary of form {position: [[i1,j1],[i2,j2],...}
            if(j == i) {continue;}
            
            for(let k = 0; k < games[gid].position[j].length; k++) {
                if(games[gid].t[j][k].h.health > 0) {
                    if(games[gid].position[j][k] in opponents) {
                        opponents[games[gid].position[j][k]].push([j,k]);
                    }
                    else {
                        opponents[games[gid].position[j][k]] = [[j,k]];
                    }
                    opponents_size++;
                }
            }
        }

        let opponents_sorted = []; // dictionary converted to array of form [[position,[[i1,j1],[i2,j2],...]],...], then sort
        for(let key in opponents) {opponents_sorted.push([Number(key), opponents[key]]);}
        opponents_sorted = opponents_sorted.sort(function(a,b){return b[0]-a[0];});
        console.log("opponents_sorted", opponents_sorted);

        // iterate through all attackers on this team, choose opponent and attack, remove dead opponents from target list, order doesn't need to be randomized for stimulaneous attacks
        for(let j = 0; j < attackers[i].length; j++) {
            if(opponents_size > 0) {
                let chosen_opponent = Math.floor(Math.random() * opponents_sorted[0][1].length); // pick random opponent of closest array
                let chosen_opponent_i = opponents_sorted[0][1][chosen_opponent][0], chosen_opponent_j = opponents_sorted[0][1][chosen_opponent][1];
                let attacker_dmg = 0;
                if(games[gid].action[i][attackers[i][j]] == 'l') {attacker_dmg = games[gid].t[i][attackers[i][j]].l.atk;}
                else if(games[gid].action[i][attackers[i][j]] == 'r') {attacker_dmg = games[gid].t[i][attackers[i][j]].r.atk;}
                let chain = games[gid].t[chosen_opponent_i][chosen_opponent_j].dmg([i,attackers[i][j]], [chosen_opponent_i,chosen_opponent_j], attacker_dmg, Math.floor(Math.random()*4), true); //do damage
                console.log(games[gid].turn, [i,attackers[i][j]], [chosen_opponent_i, chosen_opponent_j], games[gid].action[i][attackers[i][j]], attacker_dmg, chain)// log it
                games[gid].log.push([games[gid].turn, [i,attackers[i][j]], [chosen_opponent_i, chosen_opponent_j], games[gid].action[i][attackers[i][j]], attacker_dmg, chain]);
                io.emit('atk_update', {attack:games[gid].log.at(-1)});
                attacked = true;
                if(games[gid].t[chosen_opponent_i][chosen_opponent_j].h.health <= 0) { // if dead, remove opponent from opponent_sorted
                    opponents_sorted[0][1].splice(chosen_opponent,1);
                    if(opponents_sorted[0][1].length == 0) {
                        opponents_sorted.splice(0,1);
                    }
                    opponents_size--;
                }
                games[gid].action[i][attackers[i][j]] = null;
                games[gid].direction[i][attackers[i][j]] = 0;
            }
        }
    }
    if(attacked){games[gid].turn++}; // make sure to record simultaneous attacks as the same turn 

    // check if game is finished here - if bots win, will inf loop (maybe not, if don't attack, will not get into position, will not call 'move' anymore)
    for(let i = 0; i < games[gid].t.length; i++) {
        let team_dead = true;
        for(let j = 0; j < games[gid].t[i].length; j++) {
            if(games[gid].t[i][j].h.health>0) {
                team_dead = false;
                break;
            }
        }
        if(team_dead == true) {
            console.log("gameover");
            io.emit('game_over', {game:false});
            games[gid].game_on = 0;
            // TODO: clear up any timeouts if game is over

            for(let j = 0; j < timeouts[gid].length; j++) {
                if(timeouts[gid][j] != null) {
                    clearTimeout(timeouts[gid][j]);
                    timeouts[gid][j] = null;
                    console.log("cleared timeout for", j);
                }
            }

            return;
        }
    }

    // update which demons need inputs for all clients, set timeouts.
    for(let i = 0; i < actioners.length; i++) {
        if(actioners[i].length > 0) {
            if(games[gid].socket_ids[i] == "bot") {
                for(let j = 0; j < actioners[i].length; j++) {
                    console.log("set bot action & direction to 1");
                    if(games[gid].t[i][actioners[i][j]].r.health > 0){
                        games[gid].action[i][actioners[i][j]] = 'r';
                        games[gid].action_history.push([i,actioners[i][j],'r']); // of the form player_idx, unit_idx, action
                        io.emit('act_update', {action:[i,actioners[i][j],'r']});
                    }
                    else { // if no moves left, just try to do 'l'
                        games[gid].action[i][actioners[i][j]] = 'l';
                        games[gid].action_history.push([i,actioners[i][j],'l']); // of the form player_idx, unit_idx, action
                        io.emit('act_update', {action:[i,actioners[i][j],'l']});
                    }
                    games[gid].direction[i][actioners[i][j]] = 1;
                }
            }
            else {
                if( timeouts[gid][i] == null ) {
                    console.log("set timeout for", i);
                    timeouts[gid][i] = setTimeout(autoplay,20000,gid,i); //20s
                }
            }
        }
    }

    // print game status
    console.log(games[gid]);
    for(let i = 0; i < games[gid].t.length; i++) {
        for(let j = 0; j < games[gid].t[i].length; j++) {
            console.log(i,j,"h",games[gid].t[i][j].h.health,"l",games[gid].t[i][j].l.health,"r",games[gid].t[i][j].r.health,"b",games[gid].t[i][j].b.health );
        }
    }
}

function autoplay(gid,player_idx) {    
    console.log("set autoplay action for gid:", gid, "player_idx:",player_idx);
    for(let i = 0; i < games[gid].action[player_idx].length; i++) {
        if( (games[gid].position[player_idx][i] <= 0) && (games[gid].direction[player_idx][i] == 0) && (games[gid].action[player_idx][i] == null) && (games[gid].t[player_idx][i].h.health > 0)) {
            if(games[gid].t[player_idx][i].r.health > 0){
                games[gid].action[player_idx][i] = 'r';
                games[gid].action_history.push([player_idx,i,'r']); // of the form player_idx, unit_idx, action
                io.emit('act_update', {action:[player_idx,i,'r']});
            }
            else { // if no moves left, just try to do 'l'
                games[gid].action[player_idx][i] = 'l';
                games[gid].action_history.push([player_idx,i,'l']); // of the form player_idx, unit_idx, action
                io.emit('act_update', {action:[player_idx,i,'l']});
            }
            games[gid].direction[player_idx][i] = 1;
        }
    }

    timeouts[gid][player_idx] = null;
    
    do {simulate(gid);}
    while(move(gid));
}

function populate(invent) {
    console.log("populating demons.");
    let team_made = [];
    for(let i = 0; i < invent.length; i=i+4) {
        const a_h = new part(invent[i]);
        const a_l = new part(invent[i+1]);
        const a_r = new part(invent[i+2]);
        const a_b = new part(invent[i+3]);
        team_made.push(new demon(a_h, a_l, a_r, a_b));
    }
    //console.log(team_made);
    return team_made;
}

// utility function
function precisionRound(number, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}