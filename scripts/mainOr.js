setTimeout(function() {
    const blueBallPath = [];
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const numEnvironmentBalls = 50;
    const ballRadius = 10;
    const maxX = canvas.width;
    const maxY = canvas.height;
    const maxSpeed = 2;
    const gravitationalForce = 0.1; // Strength of gravitational force
    const environmentBalls = Array.from({
        length: numEnvironmentBalls
    }, () => ({
        x: Math.random() * (maxX - ballRadius * 2) + ballRadius,
        y: Math.random() * (maxY - ballRadius * 2) + ballRadius,
    }));
    const individualBalls = [{
            x: maxX / 4,
            y: maxY / 2,
            vx: maxSpeed,
            vy: maxSpeed,
            path: []
        }, // Green ball (gravity affected movement)
        {
            x: (maxX * 3) / 4,
            y: maxY / 2,
            vx: maxSpeed,
            vy: maxSpeed,
            path: []
        } // Red ball (random teleportation)
    ];
    // Function to calculate entropy for a given path
    function calculateEntropy(path) {
        const segmentLengths = [];
        for(let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i - 1].x;
            const dy = path[i].y - path[i - 1].y;
            const length = Math.sqrt(dx * dx + dy * dy);
            segmentLengths.push(length);
        }
        const numSegments = segmentLengths.length;
        const entropy = -segmentLengths.reduce((sum, length) => {
            const probability = length / numSegments;
            return sum + probability * Math.log2(probability);
        }, 0);
        return entropy;
    }

    function draw() {
        ctx.clearRect(0, 0, maxX, maxY);
        // Draw environment balls
        ctx.fillStyle = 'lightblue';
        environmentBalls.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        });
        // Draw paths
        ctx.strokeStyle = config.normal_person_ball_color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(individualBalls[0].path[0].x, individualBalls[0].path[0].y);
        for(let i = 1; i < individualBalls[0].path.length; i++) {
            ctx.lineTo(individualBalls[0].path[i].x, individualBalls[0].path[i].y);
        }
        ctx.stroke();
        ctx.closePath();
        ctx.strokeStyle = config.superhero_ball_color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(individualBalls[1].path[0].x, individualBalls[1].path[0].y);
        for(let i = 1; i < individualBalls[1].path.length; i++) {
            ctx.lineTo(individualBalls[1].path[i].x, individualBalls[1].path[i].y);
        }
        ctx.stroke();
        ctx.closePath();
        // Draw individual balls
        ctx.fillStyle = config.normal_person_ball_color;
        ctx.beginPath();
        ctx.arc(individualBalls[0].x, individualBalls[0].y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = config.superhero_ball_color;
        ctx.beginPath();
        ctx.arc(individualBalls[1].x, individualBalls[1].y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
    /*** deep learning */
    // Define the neural network model
    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: 32,
        inputShape: [inputArray.length],
        activation: 'relu'
    }));
    model.add(tf.layers.dense({
        units: 2,
        activation: 'linear'
    })); // Output has 2 units for x and y coordinates
    // Compile the model
    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['accuracy']
    });
    // Assume `model` is your TensorFlow.js model
    function trainModel(inputData, outputData) {
        const xs = tf.tensor2d(inputData, [inputData.length, inputData[0].length]);
        const ys = tf.tensor2d(outputData, [outputData.length, outputData[0].length]);
        model.fit(xs, ys, {
            epochs: 1,
            batchSize: inputData.length
        });
    }

    function predictNextPosition(path, obstaclePositions) {
        // Logic to predict the next position based on the path and obstacles
        // For example, you can use a neural network to predict the next position
        // Return the predicted position as { x: predictedX, y: predictedY }
        // For now, let's just return the last position in the path as a placeholder
        const lastPosition = path[path.length - 1];
        return {
            x: lastPosition.x,
            y: lastPosition.y
        };
    }

    function drawPredictedPath(predictedPosition) {
        // Draw the predicted position as a dotted line
        ctx.setLineDash([5, 5]); // Set line to dotted
        ctx.strokeStyle = 'gray';
        ctx.beginPath();
        ctx.moveTo(predictedPosition.x, predictedPosition.y);
        ctx.lineTo(predictedPosition.x, predictedPosition.y); // Draw a single point for demonstration
        ctx.stroke();
        ctx.setLineDash([]); // Reset line to solid
    }
    /************* */
    // Define the calculateNextPosition function
    function calculateNextPosition(currentPosition) {
        // Your logic to calculate the next position based on the current position
        // For example, you can implement your own logic or use some external library
        // Return an object with x and y properties representing the next position
        return {
            x: currentPosition.x + 1, // Example logic, update this according to your requirements
            y: currentPosition.y + 1 // Example logic, update this according to your requirements
        };
    }
    // Initialize arrays to store input and output data
    const inputData = [];
    const outputData = [];

    function updateSimulation() {
        moveRedBall(individualBalls[1]);
        // Collect the current position of the blue ball
        const currentPosition = {
            x: individualBalls[0].x,
            y: individualBalls[0].y
        };
        // Store the current position in the blue ball's path
        blueBallPath.push({
            x: currentPosition.x,
            y: currentPosition.y
        });
        // Update obstaclePositions array (assuming environmentBalls is a global variable)
        obstaclePositions = environmentBalls.map(ball => [ball.x, ball.y]);
        // Flatten obstacle positions into a single array
        const flattenedObstaclePositions = obstaclePositions.flat();
        // Add current position and obstacle positions to input data
        const inputArray = [...currentPosition.x, ...currentPosition.y, ...flattenedObstaclePositions];
        // Predict the next position only if enough path data is available
        if(blueBallPath.length > 1) {
            const predictedPosition = predictNextPosition(blueBallPath, flattenedObstaclePositions);
            // Update the blue ball's position based on the prediction
            individualBalls[0].x = predictedPosition.x;
            individualBalls[0].y = predictedPosition.y;
            // Draw the predicted path as a dotted line
            drawPredictedPath(predictedPosition);
        }
        moveGreenBall(individualBalls[0]);
        draw();
        // Draw the predicted path as a dotted line
        drawPredictedPath({
            x: predictedPosition[0],
            y: predictedPosition[1]
        });
        histogram.line_segment_distribution({
            individualBalls: individualBalls
        })
        const greenBallEntropy = calculateEntropy(individualBalls[0].path);
        const redBallEntropy = calculateEntropy(individualBalls[1].path);
        // Display entropy values (you can update your HTML to display these values)
        document.getElementById("title_item_1_2").innerText = greenBallEntropy.toFixed(2);
        document.getElementById("title_item_2_2").innerText = redBallEntropy.toFixed(2);
        //console.log("Green Ball Entropy:", greenBallEntropy);
        //console.log("Red Ball Entropy:", redBallEntropy);
    }

    function moveRedBall(ball) {
        // Teleport red ball if collision with environment balls
        for(const envBall of environmentBalls) {
            const dx = envBall.x - ball.x;
            const dy = envBall.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if(distance < 2 * ballRadius) {
                ball.x = Math.random() * (maxX - ballRadius * 2) + ballRadius;
                ball.y = Math.random() * (maxY - ballRadius * 2) + ballRadius;
                break;
            }
        }
        // Bounce off the walls
        if(ball.x <= ballRadius || ball.x >= maxX - ballRadius) {
            ball.vx *= -1;
        }
        if(ball.y <= ballRadius || ball.y >= maxY - ballRadius) {
            ball.vy *= -1;
        }
        // Update position based on velocity
        ball.x += ball.vx;
        ball.y += ball.vy;
        // Store the current position in the path
        ball.path.push({
            x: ball.x,
            y: ball.y
        });
    }

    function moveGreenBall(ball) {
        // Apply gravitational force from environment balls
        for(const envBall of environmentBalls) {
            const dx = envBall.x - ball.x;
            const dy = envBall.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if(distance < 3 * ballRadius) {
                const angle = Math.atan2(dy, dx);
                ball.vx += gravitationalForce * Math.cos(angle);
                ball.vy += gravitationalForce * Math.sin(angle);
            }
        }
        // Bounce off the walls
        if(ball.x <= ballRadius || ball.x >= maxX - ballRadius) {
            ball.vx *= -1;
        }
        if(ball.y <= ballRadius || ball.y >= maxY - ballRadius) {
            ball.vy *= -1;
        }
        // Update position based on velocity
        ball.x += ball.vx;
        ball.y += ball.vy;
        // Store the current position in the path
        ball.path.push({
            x: ball.x,
            y: ball.y
        });
    }
    setInterval(updateSimulation, 1000 / 60); // Update simulation approximately 60 times per second
    document.querySelector(".lds-roller").style.display = "none";
}, 2000)