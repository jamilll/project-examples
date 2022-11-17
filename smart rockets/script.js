// Const section
const WIDTH = 600;
const HEIGHT = 600;

// Canvas initialization
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Text element
const textBox = document.getElementById("textbox")

// Init the population
let p = new Population(25);

// Target
let target = new Vector(WIDTH/2, 60)

// Draw function: will be used to draw and update the rockets
function draw(){
    // Clear the canvas
    ctx.fillStyle = "rgb(0,0,0)"
    ctx.fillRect(0,0, WIDTH, HEIGHT)
    ctx.fillStyle = "rgb(255,0,0)"

    // Draw Target
    ctx.beginPath();
    ctx.ellipse(target.x-5, target.y-5, 10, 10, Math.PI / 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "rgb(255,255,255)"

    // Draw obstacle
    ctx.fillRect(150,200,300,20)
    ctx.fillStyle = "rgb(255,255,255,0.5)"


    // update and draw all the rockets
    p.run(ctx);
    age++;

    if(age === 200){
        p.evaluate();
        p.select();
        age = 0;
    }
    // keep the animation running
    requestAnimationFrame(draw)
}

function getRandomVector(){
    const vx = Math.random()  -1;
    const vy = Math.random() -1;
    let v = new Vector(vx, vy);
    return v;
}


requestAnimationFrame(draw)
