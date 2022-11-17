let age =0;
let lifeSpan = 550;

class Vector{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }

    // add a fixed number to x and y or add another vector
    add(f){
        if( f instanceof Vector){
            this.x += f.x;
            this.y += f.y;
            return;
        }
        this.x += f;
        this.y += f;

    }

    // multiplies the vector by a number or by another vector
    mult(n){
        if(n instanceof Vector){
            this.x *= n.x;
            this.y *= n.y;
            return
        }

        this.x *= n;
        this.y *= n
    }

    // Divide x and y by a number
    div(n){
        this.x /= n;
        this.y /= n;
    }
    
    // return the magnitude of the vector
    mag(){
        return Math.sqrt(this.x* this.x + this.y * this.y);
    }

    // normalize the current vector
    normalize(){
        this.div(this.mag())
    }

    // returns dot product of 2 vectors
    static dot(a, b){
        return a.x*b.x + a.y*b.y;
    }

    // returns the angle between (0,1) and this vector
    rotation(){
        return Math.atan(this.y/this.x)
    }

    // return the angle between 2 Vectors in rad
    static findAngle(a, b){
        const c = Vector.dot(a,b) / (a.mag() * b.mag());
        return Math.acos(c) * (Math.PI / 180)
    }

    static random(){
        return new Vector(Math.random()-0.5, Math.random()-0.5);
    }

    static specialRandom(){
        return new Vector(Math.random()*2-1, Math.random()-1);

    }

    dist(v){
        return Math.sqrt( (this.x - v.x)* (this.x - v.x) + (this.y - v.y) * (this.y - v.y));
    }

}

class DNA{
    constructor(l, g){
        this.lifeSpan = l;
        if(g){
            this.genes = g;
            return;
        } 
        this.genes = Array(l);
        for(let i=0; i< l; i++){
            let v =  Vector.random();
            v.div(2);
            this.genes[i] = v;
        }
    }

    mutate(){
        for(let i=0; i <this.genes.length; i++){
            
            this.genes[i] = (Math.random() > 0.02)? this.genes[i]: Vector.random();
            
        }

    }

    mate(p){
        let newGenes = Array(this.lifeSpan);
        // The new genes will contain up to middle genes from this DNA and rest from partner "p"
        const middle = Math.floor(Math.random() * this.lifeSpan)
        for(let i=0; i <this.genes.length; i++){
            newGenes[i] = (i > middle)? this.genes[i]: p.genes[i];
        }
        
        return new DNA(this.lifeSpan, newGenes);
    }
}

class Rocket{
    constructor(x,y, dna){
        this.pos = new Vector(x,y);
        this.vel = new Vector(0,0);
        this.acc = new Vector(0,0);
        this.dna = (dna)? dna:new DNA(lifeSpan);
        this.fitness = 0;
        this.done = false;
        this.crashed = false;
    }

    applyForce(f){
        this.acc.add(f)
    }

    calcFitness(){
        let d = this.pos.dist(target);
        if(d== 0) {
            this.fitness *= 1.5;
            return;
        }
        this.fitness = 1/d
        
    }

    update(){
        if(this.done || this.crashed)
            return;
        this.acc.add(this.dna.genes[age]);
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        // reset acceleration
        this.acc.mult(0);
        // limit the velocity of the rocket
        if(this.vel.mag() > 4){
            this.vel.normalize();
            this.vel.mult(4);
        }
        
        // if rocket hits target then stop
        if(this.pos.dist(target) < 25) {
            this.pos.x = target.x;
            this.pos.y = target.y;
            
            this.done = true;
            // increase fitness by how many frames it did not use to hit the target
            this.fitness += (lifeSpan - age) / lifeSpan * 10;
        }

        // Rocket crashes when hitting edge of canvas
        if(this.pos.x < 0 || this.pos.x > WIDTH || this.pos.y < 0 || this.pos.y > HEIGHT){
            this.crashed = true;
            this.fitness /= 5;
        }
        // Check if rocket hit obstacle
        if(this.pos.x > 150 && this.pos.x < 450 && this.pos.y > 200 && this.pos.y < 220){
            this.crashed = true;
            this.fitness /= 5;
        }

    }

    draw(ctx){

        // Move ctx to position of the Rocket
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.vel.rotation())
        ctx.fillRect(0, 0,26,6)

        // Reset transformation matrix to the identity matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
    }

};

class Population{
    constructor(n){
        this.rockets = Array(n);
        this.popSize = n;
        this.matingPool = [];

        for(let i=0; i < this.popSize; i++){
            this.rockets[i] = new Rocket(300,580);
        }
    }

    evaluate(){
        let maxFit = 0;
        // Calculate the fitness of the rocket and find the max fitness value

        for(let i=0; i< this.popSize; i++){
            this.rockets[i].calcFitness();
            if(this.rockets[i].fitness > maxFit)
                maxFit = this.rockets[i].fitness;
        }
        // Display max fit 
        textBox.textContent = maxFit;
        // normalize the fitness of the rockets
        for(let i=0; i< this.popSize; i++){
            this.rockets[i].fitness /= maxFit;
        }
        this.matingPool = [];
        // Add rockets to matingpool based on how fit they are
        for(let i=0; i< this.popSize; i++){
            const n = this.rockets[i].fitness *100; 
            for(let j =0; j <n; j++){
                this.matingPool.push(this.rockets[i])
            }
        }  
    }


    select(){
        // Create a new population
        let newRockets = Array(this.popSize);
        for(let i=0; i < this.popSize; i++){

            // Pick random rockets DNA from mating pool
            const pa = this.matingPool[Math.floor(Math.random() * this.matingPool.length)].dna;
            const pb = this.matingPool[Math.floor(Math.random() * this.matingPool.length)].dna;
            let child = pa.mate(pb)
            child.mutate();
            newRockets[i] = new Rocket(300,580, child);
        }

        // Update the current rockets
        this.rockets = newRockets;
        
    }

    run(ctx){
        for(let r of this.rockets){
            r.update();
            r.draw(ctx);
        }
    }

}