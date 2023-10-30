setTimeout(function() {

    // Initialize an empty array to store training data
    let trainingData = { input: [], output: [] };



    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const numEnvironmentBalls = 50;
    const ballRadius = 10;
    const maxX = canvas.width;
    const maxY = canvas.height;
    const maxSpeed = 2;
    const gravitationalForce = 0.1;
    const environmentBalls = Array.from({
        length: numEnvironmentBalls
    }, () => ({
        x: Math.random() * (maxX - ballRadius * 2) + ballRadius,
        y: Math.random() * (maxY - ballRadius * 2) + ballRadius,
    }));
    const blueBall = {
        x: maxX / 4,
        y: maxY / 2,
        vx: maxSpeed,
        vy: maxSpeed,
        path: []
    };
    const redBall = {
        x: (maxX * 3) / 4,
        y: maxY / 2,
        vx: maxSpeed,
        vy: maxSpeed,
        path: []
    };
    let observationTimeElapsed = false;

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

    function moveBlueBall(ball) {
        // Apply gravitational force from environment balls
        for (const envBall of environmentBalls) {
            const dx = envBall.x - ball.x;
            const dy = envBall.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 3 * ballRadius) {
                const angle = Math.atan2(dy, dx);
                ball.vx += gravitationalForce * Math.cos(angle);
                ball.vy += gravitationalForce * Math.sin(angle);
            }
        }
        // Bounce off the walls
        if (ball.x <= ballRadius || ball.x >= maxX - ballRadius) {
            ball.vx *= -1;
        }
        if (ball.y <= ballRadius || ball.y >= maxY - ballRadius) {
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
        // Return the current position as the output
        return {
            x: ball.x,
            y: ball.y
        };
    }
    

    // Function to collect training data for the machine learning model
    function collectTrainingData(ball) {
        const inputPosition = [ball.x, ball.y]; // Current position of the blue ball
        const outputPosition = moveBlueBall({ ...ball }); // Predicted position of the blue ball
        trainingData.input.push(inputPosition);
        trainingData.output.push(outputPosition);
       // console.log(trainingData.input);
console.log(trainingData.output);

    }

// Load and train the TensorFlow.js model
async function loadAndTrainModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, inputShape: [2], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 2 }));

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    const inputPositions = trainingData.input;
    const outputPositions = trainingData.output;
    const inputTensor = tf.tensor2d(inputPositions, [inputPositions.length, 2]); // [batchSize, inputSize]
    const outputTensor = tf.tensor2d(outputPositions, [outputPositions.length, 2]); // [batchSize, outputSize]

    // Train the model
    await model.fit(inputTensor, outputTensor, {
        epochs: 100,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}, Loss: ${logs.loss}`);
            }
        }
    });

    // Return the trained model
    return model;
}

    function predictPath(ball, observationTime) {
        const numSteps = observationTime * 60;
        const predictedPath = [];
        const tempBall = {
            ...ball
        };
        const tempPath = [...ball.path]; // Create a copy of the blue ball's path
        for(let i = 0; i < numSteps; i++) {
            moveBlueBall(tempBall);
            tempPath.push({
                x: tempBall.x,
                y: tempBall.y
            }); // Add the new position to the temporary path
            predictedPath.push({
                x: tempBall.x,
                y: tempBall.y
            }); // Add the new position to the predicted path
        }
        ball.path = tempPath; // Update the blue ball's path with the temporary path
        return predictedPath;
    }

    function drawPredictedPath(predictedPath) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'yellow';
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.moveTo(predictedPath[0].x, predictedPath[0].y);
        for(let i = 1; i < predictedPath.length; i++) {
            ctx.lineTo(predictedPath[i].x, predictedPath[i].y);
        }
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]);
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
      // Draw paths
ctx.strokeStyle = 'blue';
ctx.lineWidth = 2;
ctx.beginPath();
if (blueBall.path.length > 0) {
    ctx.moveTo(blueBall.path[0].x, blueBall.path[0].y);
    for(let i = 1; i < blueBall.path.length; i++) {
        ctx.lineTo(blueBall.path[i].x, blueBall.path[i].y);
    }
}
ctx.stroke();
ctx.closePath();
        // Draw individual balls
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(blueBall.x, blueBall.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(redBall.x, redBall.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
    async function startPrediction() {
        const trainedModel = await loadAndTrainModel();
        let observationTimeElapsed = false;
    
        const numFramesForTransition = 30; // Number of frames for the transition
        let transitionFrameCount = 0;
        let interpolatedX, interpolatedY;
    
        setInterval(function() {
            moveRedBall(redBall);
            draw();
            histogram.line_segment_distribution({
                individualBalls: [blueBall, redBall]
            });
            const blueBallEntropy = calculateEntropy(blueBall.path);
            const redBallEntropy = calculateEntropy(redBall.path);
            document.getElementById("title_item_1_2").innerText = blueBallEntropy.toFixed(2);
            document.getElementById("title_item_2_2").innerText = redBallEntropy.toFixed(2);
    
            if (!observationTimeElapsed) {
                collectTrainingData(blueBall);
                if (blueBall.path.length >= 10 * 60) { // 10 seconds * 60 frames per second
                    observationTimeElapsed = true;
                }
            } else {
                // Use the trained model to predict the blue ball's movement
                const inputPosition = [blueBall.x, blueBall.y];
                const normalizedPrediction = trainedModel.predict(tf.tensor2d([inputPosition]));
                const prediction = Array.from(normalizedPrediction.dataSync());
    
                // Interpolate the blue ball's position for a smooth transition
                if (transitionFrameCount < numFramesForTransition) {
                    interpolatedX = blueBall.x + (prediction[0] - blueBall.x) * (transitionFrameCount / numFramesForTransition);
                    interpolatedY = blueBall.y + (prediction[1] - blueBall.y) * (transitionFrameCount / numFramesForTransition);
                    transitionFrameCount++;
                } else {
                    interpolatedX = prediction[0];
                    interpolatedY = prediction[1];
                }
    
                // Update the blue ball's position
                blueBall.x = interpolatedX;
                blueBall.y = interpolatedY;
            }
        }, 1000 / 30);
    }
    
    
    startPrediction();
    document.querySelector(".lds-roller").style.display = "none";
}, 2000)