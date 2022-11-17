class NeuralNetwork {
    constructor(ins, hids, outs) {
        this.inputs = ins;
        this.hiddens = hids;
        this.outputs = outs;
        
        this.weights_ih = new Matrix(this.hiddens, this.inputs);
        this.weights_ho = new Matrix(this.outputs, this.hiddens);
        this.weights_ih.randommize();
        this.weights_ho.randommize();

        this.bias_h = new Matrix(this.hiddens,1);
        this.bias_o = new Matrix(this.outputs,1);
        this.bias_h.randommize();
        this.bias_o.randommize();
        this.lr = 0.05;
    }

    feedforward(input){
        
        let inputs = Matrix.fromArray(input);
        // generating the hidding Outputs
        let hidden = Matrix.multiply(this.weights_ih, inputs)
        Matrix.add(hidden, this.bias_h)
        // Activation function
        hidden.map(sigmoid)

        // Generating the output
        let output = Matrix.multiply(this.weights_ho, hidden);
        Matrix.add(output, this.bias_o);
        output.map(sigmoid);

        return output.toArray();
    }

    train(input, targets_arr){
        
        let inputs = Matrix.fromArray(input);
        let hidden = Matrix.multiply(this.weights_ih, inputs)
        // generating the hidding Outputs

        Matrix.add(hidden, this.bias_h)
        
        
        // Activation function
        hidden.map(sigmoid)
        // Generating the output
        

        let output = Matrix.multiply(this.weights_ho, hidden);
        Matrix.add(output, this.bias_o);
        output.map(sigmoid);
        let targets = Matrix.fromArray(targets_arr);

        // Calculate the error
        let out_errors = Matrix.substract(targets, output)
        //out_errors = Matrix.transpose(out_errors)


        // Calculate gradient
        let gradient = Matrix.map(output, dsigmoid);
        gradient.multiply(out_errors);
        gradient.multiply(this.lr);

        let hidden_t = Matrix.transpose(hidden);
        let weight_ho_deltas = Matrix.multiply( gradient, hidden_t);

        Matrix.add(this.weights_ho, weight_ho_deltas);
        Matrix.add(this.bias_o, gradient);
        
        // Generate the hidden layer errors
        let ho_t = Matrix.transpose(this.weights_ho);

        let hid_errors = Matrix.multiply(ho_t, out_errors);
        //hid_errors = Matrix.transpose(hid_errors);

        // Calculate hidden gradient
        let hidden_gradient = Matrix.map(hidden, dsigmoid);
        hidden_gradient.multiply(hid_errors);
        hidden_gradient.multiply(this.lr);


        // Calculate ih deltas
        let inputs_t = Matrix.transpose(inputs);
        let weight_ih_deltas = Matrix.multiply(hidden_gradient, inputs_t);
        

        Matrix.add(this.weights_ih, weight_ih_deltas);
        Matrix.add(this.bias_h, hidden_gradient)
    }

}

function sigmoid(x){
    return 1 / (1 + Math.exp((-1)*x));
}

function dsigmoid(x){
    return x * (1-x);
}