document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const numEnvironmentBalls = 50;
    const ballRadius = 10;
    const maxX = canvas.width;
    const maxY = canvas.height;
    const maxSpeed = 2;
    const gravitationalForce = 0.1;
    const environmentBalls = Array.from({ length: numEnvironmentBalls }, () => ({
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
        const normalizedInput = normalizeInputData(inputArray, maxX, maxY);
        const prediction = model.predict(tf.tensor2d([normalizedInput]));
        const predictedPosition = prediction.arraySync()[0];
        inputTensor.dispose();
        prediction.dispose();
        const denormalizedPosition = denormalizeOutputData(predictedPosition[0], predictedPosition[1], maxX, maxY);
        return denormalizedPosition;
    }

    function predictNextPositions(inputArray, numPositions) {
        const predictedPositions = [];
        for (let i = 0; i < numPositions; i++) {
            const prediction = predictNextPosition(inputArray);
            inputArray = [prediction.x, prediction.y, ...inputArray.slice(2)];
            predictedPositions.push(prediction);
        }
        return predictedPositions;
    }

    function normalizeInputData(inputArray, maxX, maxY) {
        const normalizedX = inputArray[0] / maxX;
        const normalizedY = inputArray[1] / maxY;
        const normalizedObstacles = inputArray.slice(2).map((value, index) => {
            if (index % 2 === 0) {
                // X-coordinate of obstacle
                return value / maxX;
            } else {
                // Y-coordinate of obstacle
                return value / maxY;
            }
        });

        return [normalizedX, normalizedY, ...normalizedObstacles];
    }

    function denormalizeOutputData(normalizedX, normalizedY, maxX, maxY) {
        const denormalizedX = (normalizedX * maxX) + (maxX / 2);
        const denormalizedY = (normalizedY * maxY) + (maxY / 2);
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

        let inputArray = Array(2 + numEnvironmentBalls * 2).fill(0);
        inputArray[0] = currentPosition.x;
        inputArray[1] = currentPosition.y;
        obstaclePositions = environmentBalls.map(ball => ({
            x: ball.x,
            y: ball.y
        }));
        obstaclePositions.forEach((obstacle, index) => {
            inputArray[index * 2 + 2] = obstacle.x;
            inputArray[index * 2 + 3] = obstacle.y;
        });

        const numPositionsToPredict = 10;
        const predictedPositions = predictNextPositions(inputArray, numPositionsToPredict);

        draw(predictedPositions, inputArray);
        moveGreenBall(individualBalls[0]);
    }

    function draw(predictedPositions, inputArray) {
        ctx.clearRect(0, 0, maxX, maxY);
        ctx.fillStyle = 'lightblue';
        environmentBalls.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        });

        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        inputArray = normalizeInputData(inputArray, maxX, maxY);
        ctx.moveTo(inputArray[0], inputArray[1]);

        predictedPositions.forEach(position => {
            ctx.lineTo(position.x, position.y);
        });
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]);

        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(individualBalls[0].x, individualBalls[0].y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(individualBalls[1].x, individualBalls[1].y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(individualBalls[1].path[0].x, individualBalls[1].path[0].y);
        individualBalls[1].path.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.closePath();

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
        for (const envBall of environmentBalls) {
            const dx = envBall.x - ball.x;
            const dy = envBall.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 2 * ballRadius) {
                ball.x = Math.random() * (maxX - ballRadius * 2) + ballRadius;
                ball.y = Math.random() * (maxY - ballRadius * 2) + ballRadius;
                break;
            }
        }

        if (ball.x <= ballRadius || ball.x >= maxX - ballRadius) {
            ball.vx *= -1;
        }
        if (ball.y <= ballRadius || ball.y >= maxY - ballRadius) {
            ball.vy *= -1;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.path.push({
            x: ball.x,
            y: ball.y
        });
    }

    function moveGreenBall(ball) {
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

        if (ball.x <= ballRadius || ball.x >= maxX - ballRadius) {
            ball.vx *= -1;
        }
        if (ball.y <= ballRadius || ball.y >= maxY - ballRadius) {
            ball.vy *= -1;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.path.push({
            x: ball.x,
            y: ball.y
        });
    }

    setInterval(updateSimulation, 1000 / 30);
    document.querySelector(".lds-roller").style.display = "none";
});
