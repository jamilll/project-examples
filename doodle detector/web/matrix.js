class Matrix {
    constructor(r, c) {
        this.rows = r;
        this.cols = c;
        this.data = [];
        // Init matrix 
        for(let i =0; i< this.rows; i++){
            this.data[i] = []
            for(let j =0; j< this.cols; j++ ){
                this.data[i][j] = 0;
            }
        }

    }

    toArray(){
        let arr = [];
        for(let i =0; i< this.rows; i++ ){
            for(let j=0; j< this.cols; j++){
                arr.push(this.data[i][j]);
            }
        }
        return arr;
    }

    static fromArray(arr){
        let m = new Matrix(arr.length, 1);

        for(let i=0; i< arr.length; i++){
            m.data[i][0] = arr[i];
        }
        return m;
    }

    randommize(){
        for(let i =0; i< this.rows; i++ ){
            for(let j=0; j< this.cols; j++){
                this.data[i][j] = Math.random() *2-1;
            }
        }

    }

    static transpose(m){
        let res = new Matrix(m.cols, m.rows);
        for(let i =0; i< m.rows; i++ ){
            for(let j=0; j< m.cols; j++){
                res.data[j][i] = m.data[i][j];
            }
        }
        return res;

    }

    print(){
        console.table(this.data);
    }

    static substract(a,b){
        if (a.rows !== b.rows || a.cols !== b.cols) {
            console.log('Columns and Rows of A must match Columns and Rows of B.');
            return;
          }
  
        let res = new Matrix(a.rows, a.cols);

        for(let i =0; i< a.rows; i++ ){
            for(let j=0; j< a.cols; j++){
                res.data[i][j] = a.data[i][j] - b.data[i][j];
            }
        }

        return res;
    }


    static multiply(a, b){
        if(a.cols !== b.rows){
            console.log("cols of a != rows of b");
            return undefined;
        }
        let res = new Matrix(a.rows, b.cols);
        for(let i=0; i< res.rows; i++){
            for(let j=0; j< res.cols; j++){
               let sum = 0;
               for(let k =0 ; k< a.cols; k++){
                    sum += a.data[i][k] * b.data[k][j]
                } 
                res.data[i][j] = sum
            }
        }

        return res;
  

    }

    

    multiply(n) {

        if(n instanceof Matrix){
            if(this.rows !== n.rows || this.cols !== n.cols){
                console.log("cols and rows must match");
                return;
            }
            for(let i =0; i< this.rows; i++ ){
                for(let j=0; j< this.cols; j++){
                    this.data[i][j] *= n.data[i][j];
                }
            }


        } else {
            for(let i =0; i< this.rows; i++ ){
                for(let j=0; j< this.cols; j++){
                    this.data[i][j] *= n;
                }
            }
    
        }

    }

    static add(a,b){
        let r = (a.rows < b.rows)? a.rows: b.rows;
        let c = (a.cols < b.cols)? a.cols: b.cols; 

        for(let i =0; i< r; i++ ){
            for(let j=0; j< c; j++){
                a.data[i][j] += b.data[i][j];
            }
        }
    }

    add(n) {
        for(let i =0; i< this.rows; i++ ){
            for(let j=0; j< this.cols; j++){
                this.data[i][j] += n;
            }
        }
    }

    map(fn) {
        for(let i =0; i< this.rows; i++ ){
            for(let j=0; j< this.cols; j++){
                this.data[i][j] = fn(this.data[i][j]);
            }
        }

    }

    static map(m, fn){
        let res = new Matrix(m.rows, m.cols);
        for(let i =0; i< m.rows; i++ ){
            for(let j=0; j< m.cols; j++){
                res.data[i][j] = fn(m.data[i][j]);
            }
        }
        return res;
    }

}