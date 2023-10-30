document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const numEnvironmentBalls = 50;
    const ballRadius = 10;
    const maxX = canvas.width;
    const maxY = canvas.height;
    const maxSpeed = 2;
    const gravitationalForce = 0.1;
    let obstaclePositions = [];
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
    }, {
        x: (maxX * 3) / 4,
        y: maxY / 2,
        vx: maxSpeed,
        vy: maxSpeed,
        path: []
    }];    

    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: 32,
        inputShape: [2 + numEnvironmentBalls * 2],
        activation: 'relu'
    }));
    model.add(tf.layers.dense({
        units: 2,
        activation: 'linear'
    }));
    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
    });

    function predictNextPosition(inputArray) {
        const inputTensor = tf.tensor2d([inputArray]);
        const prediction = model.predict(inputTensor);
        const predictedPosition = prediction.arraySync()[0];
        inputTensor.dispose();
        prediction.dispose();
        return {
            x: predictedPosition[0], // Make sure x-value is correctly mapped in the prediction output
            y: predictedPosition[1] // y-value is correctly mapped in the prediction output
        };
    }

    function predictNextPositions(inputArray, numPositions) {
        const predictedPositions = [];
        for(let i = 0; i < numPositions; i++) {
            const prediction = predictNextPosition(inputArray);
            inputArray = [prediction.x, prediction.y, ...inputArray.slice(2)];
            predictedPositions.push(prediction);
        }
        return predictedPositions;
    }

    function normalizeInputData(x, y, maxX, maxY) {
        const normalizedX = x / maxX;
        const normalizedY = y / maxY;
        return [normalizedX, normalizedY];
    }

    function denormalizeOutputData(normalizedX, normalizedY, maxX, maxY) {
        const denormalizedX = normalizedX * maxX;
        const denormalizedY = normalizedY * maxY;
        return { x: denormalizedX, y: denormalizedY };
    }

    function updateSimulation() {
        moveRedBall(individualBalls[1]);
        const currentPosition = {
            x: individualBalls[0].x,
            y: individualBalls[0].y
        };
        individualBalls[0].path.push({
            x: currentPosition.x,
            y: currentPosition.y
        });
        // Update obstacle positions (if applicable)
        obstaclePositions = environmentBalls.map(ball => ({
            x: ball.x,
            y: ball.y
        }));
        // Construct input array
        const inputArray = Array(2 + numEnvironmentBalls * 2).fill(0);
        inputArray[0] = currentPosition.x;
        inputArray[1] = currentPosition.y;
        obstaclePositions.forEach((obstacle, index) => {
            inputArray[index * 2 + 2] = obstacle.x;
            inputArray[index * 2 + 3] = obstacle.y;
        });
        // Predict multiple positions ahead
        const numPositionsToPredict = 10; // Adjust this based on your needs
        const predictedPositions = predictNextPositions(inputArray, numPositionsToPredict);
         // Denormalize predicted positions back to canvas dimensions
         predictedPositions.forEach(position => {
            const denormalizedPosition = denormalizeOutputData(position.x, position.y, maxX, maxY);
            position.x = denormalizedPosition.x;
            position.y = denormalizedPosition.y;
        });
        // Draw predicted path
        drawPredictedPath(predictedPositions);
        console.log(predictedPositions)
        // Draw blue ball's path
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(individualBalls[0].path[0].x, individualBalls[0].path[0].y);
        individualBalls[0].path.forEach(point => {
            ctx.lineTo(point.x, point.y);
            console.log(point.x, point.y)
        });
        ctx.stroke();
        ctx.closePath();
        // Move green ball and draw
        moveGreenBall(individualBalls[0]);
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, maxX, maxY);
        ctx.fillStyle = 'lightblue';
        environmentBalls.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        });
        // Draw blue ball
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(individualBalls[0].x, individualBalls[0].y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        // Draw red ball
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(individualBalls[1].x, individualBalls[1].y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        // Draw red ball path
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(individualBalls[1].path[0].x, individualBalls[1].path[0].y);
        individualBalls[1].path.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.closePath();
        // Draw blue ball path
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(individualBalls[0].path[0].x, individualBalls[0].path[0].y);
        individualBalls[0].path.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.closePath();
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

    function drawPredictedPath(predictedPositions) {
        const predictedLineThickness = 3; // Set your desired line thickness here
        ctx.lineWidth = predictedLineThickness;
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'yellow';
        predictedPositions.forEach(position => {
            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
            ctx.lineTo(position.x, position.y);
            ctx.stroke();
            ctx.closePath();
        });
        ctx.setLineDash([]);
    }
    setInterval(updateSimulation, 1000 / 30);
    document.querySelector(".lds-roller").style.display = "none";
});