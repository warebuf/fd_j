class part { 
    constructor(id) {
        
        this.id = id;
        this.section = id.charAt(0);

        if(id=='h0000001') {
            this.health = 2;
        }
        else if(id=='h0000002') {
            this.health = 1;
        }
        else if(id=='h0000003') {
            this.health = Math.floor(Math.random() * 100) + 1;
        }
        else if(id=='l0000001') {
                this.health = 2;
                this.atk = 1;
                this.chain = false;
        }
        else if(id=='l0000002') {
            this.health = 1;
            this.atk = 2;
            this.chain = true;
        }
        else if(id=='l0000003') {
            this.health = Math.floor(Math.random() * 100) + 1;
        }
        else if(id=='r0000001') {
            this.health = 2;
            this.atk = 1;
            this.chain = false;
        }
        else if(id=='r0000002') {
            this.health = 1;
            this.atk = 2;
            this.chain = true;
        }
        else if(id=='r0000003') {
            this.health = Math.floor(Math.random() * 100) + 1;
            this.atk = Math.floor(Math.random() * 100) + 1;
            this.chain = true;
        }
        else if(id=='b0000001') {
            this.health = 2;
            this.speed = Math.floor(Math.random() * 100) + 1;
        }
        else if(id=='b0000002') {
            this.health = 1;
            this.speed = 50;
        }
        else if(id=='b0000003') {
            this.health = Math.floor(Math.random() * 100) + 1;
            this.speed = Math.floor(Math.random() * 100) + 1;
        }
    }
}

module.exports = part;