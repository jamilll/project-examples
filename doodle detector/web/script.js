const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const WIDTH = 280;
const HEIGHT = 280;
canvas.width  = WIDTH;
canvas.height = HEIGHT;
let drawing = Array(784).fill(0);


// draw black background
ctx.fillStyle = "rgb(0,0,0)"
ctx.fillRect(0,0,WIDTH,HEIGHT)
// chnage the color to white to make it identifiable
ctx.fillStyle = "rgb(255,255,255)"

let buffer = Array()
let data = {}
// used to test the prediction after training
let test_data = {}

let nn = new NeuralNetwork(784,104,3);
let canvasClicked = false;

canvas.addEventListener("mousedown", e =>{
    canvasClicked = true;    
})
canvas.addEventListener("mouseup", e =>{
    canvasClicked = false;    
})

let posx;
let posy;
canvas.addEventListener("mousemove", e =>{
    if(!canvasClicked)
        return;
    posx = e.clientX - e.clientX%10-10;
    posy = e.clientY - e.clientY%10-10;
    
    ctx.fillRect(posx, posy, 10,10)
    drawing[posx/10+ posy/10*28] = 255;
})

// Clear the canvas and reset the drawaing array
document.getElementById("clear").addEventListener("click", ()=>{
    ctx.fillStyle = "rgb(0,0,0)"
    ctx.fillRect(0,0,WIDTH,HEIGHT)
    ctx.fillStyle = "rgb(255,255,255)"
    drawing.fill(0)

});

// Transform the Canvas to []byte and use it as input for the feedforward function of the NN
document.getElementById("predict").addEventListener("click", ()=>{
    console.log("prediction: ");
    let prediction = nn.feedforward(drawing)
    // format prediction as dictionary
    let formattedPre = {}
    let attrs = Object.keys(test_data)
    for(let i=0; i < attrs.length; i++){
        formattedPre[attrs[i]] = prediction[i]
    }
    console.table(formattedPre)
    
})


document.getElementById("train").addEventListener('click', function(){
    let a = Array(nn.outputs).fill(0)
    let attrs = Object.keys(data);
    let rand = Math.floor(Math.random() * attrs.length);
    for(let i=0; i< 8000 ; i++){
        // generate the output
        rand = Math.floor(Math.random() * attrs.length);
        a[rand] = 1;
        let r2 = Math.floor(Math.random() * 1000)
        let input = data[attrs[rand]][r2];
        if(input !== undefined){
            nn.train(input, a)    
            // reset the output
            a = Array(nn.outputs).fill(0)
        } 
    }

    // TODO: maybe run the prediction on test data precision rate 
    // console.log("predicting training data");
    // // test the prediction on the test_data
    // attrs = Object.keys(test_data);

    // for(let i=0; i< attrs.length *3 ; i++){
    //     // generate the output
    //     rand = Math.floor(Math.random() * attrs.length);
    //     let r2 = Math.floor(Math.random() * test_data[attrs[rand]].length)
    //     let input = test_data[attrs[rand]][r2];
        
    //     if(input !== undefined){
    //         let output = nn.feedforward(input)
    //         let printable = {};
    //         for(let j =0; j <output.length; j++){
    //             printable[attrs[j]] = output[j]
    //         }
    //         console.log("predicted output for " + attrs[rand]);
    //         console.table(printable);        
    //     } else {
    //         console.log("predicting undefined");
    //     }
    // }

    console.log("end of training!");

});

document.querySelector("#read-file").addEventListener('click', function() {
	// no file selected to read
    if(document.querySelector("#file").value == '') {
		console.log('No file selected');
		return;
	}

	let file = document.querySelector("#file").files[0];

	let reader = new FileReader();
	reader.onload = function(e) {
		// Read binary data and display images from it
        buffer = e.target.result;

        console.log("name of file:");
        let filename = document.querySelector("#file");
        console.log(filename.files[0].name);
        
        let vals = new Uint8Array(buffer);
        let arr = [];
        let test_arr = [];
        // Get all the images in the bin file as array
        for(let i =0; i< vals.length-1; i+=784){
            let nextArr = vals.slice(i, i+784);
            //draw(nextArr);
            if(i < vals.length -3*784){
                arr.push(nextArr);
            }else{
                test_arr.push(nextArr);
            }
        }
        // add all the images to the dictionary
        data[filename.files[0].name.split(".")[0]] = arr;
        test_data[filename.files[0].name.split(".")[0]] = test_arr;

        
        // Draw the drawing saved in the buffer
        // let x =0;
        // let y=0;
        // let pics = 0;
        // for(let i=0; i< vals.length; i++){

        //     ctx.fillStyle = `rgb(${vals[i]},${vals[i]},${vals[i]})`
        //     ctx.fillRect(x,y,1,1);
        //     // reached the right most pixel of the line
        //     x++;
        //     if(x % 28 ===0){
        //         //go to the left most point of the image and go to next line
        //         x -= 28;
        //         y++;
        //         // reached last line of the image
        //         if(y % 28 === 0 ){
        //             y-= 28;
        //             x+=28;
        //             pics++;
        //             // already drawn 10 images
        //             if(pics %10 === 0){
        //                 x = 0;
        //                 y+=28;
    
        //             }
    
        //         }
        //     }

        // }


        // ctx.fillStyle = "rgb(255,0,0)"
        // ctx.fillRect(250,0,2,250)
        
	};
	reader.onerror = function(e) {
		// error occurred
		console.log('Error : ' + e.type);
	};
	reader.readAsArrayBuffer(file);
});

function draw(dt){
    let x =0;
    let y =0;
    for(let j=0; j< dt.length; j++){
        ctx.fillStyle = `rgb(${dt[j]},${dt[j]},${dt[j]})`
        ctx.fillRect((j%28), y,1,1)
        if(j %28 === 0) y++;
    }
}














