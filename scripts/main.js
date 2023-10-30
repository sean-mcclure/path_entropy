setTimeout(function() {


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
const blueBall = { x: maxX / 4, y: maxY / 2, vx: maxSpeed, vy: maxSpeed, path: [] };
const redBall = { x: (maxX * 3) / 4, y: maxY / 2, vx: maxSpeed, vy: maxSpeed, path: [] };
let observationTimeElapsed = false;

function calculateEntropy(path) {
    const segmentLengths = [];
    for (let i = 1; i < path.length; i++) {
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
}

function predictPath(ball, observationTime) {
    const numSteps = observationTime * 60;
    const predictedPath = [];
    const tempBall = { ...ball };
    for (let i = 0; i < numSteps; i++) {
        moveBlueBall(tempBall);
        predictedPath.push({ x: tempBall.x, y: tempBall.y });
    }
    return predictedPath;
}

function drawPredictedPath(predictedPath) {
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(predictedPath[0].x, predictedPath[0].y);
    for (let i = 1; i < predictedPath.length; i++) {
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
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(blueBall.path[0].x, blueBall.path[0].y);
    for (let i = 1; i < blueBall.path.length; i++) {
        ctx.lineTo(blueBall.path[i].x, blueBall.path[i].y);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(redBall.path[0].x, redBall.path[0].y);
    for (let i = 1; i < redBall.path.length; i++) {
        ctx.lineTo(redBall.path[i].x, redBall.path[i].y);
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

setInterval(function() {
    moveRedBall(redBall);
    moveBlueBall(blueBall);
    draw();
    histogram.line_segment_distribution({
        individualBalls: [blueBall, redBall]
    })
    const blueBallEntropy = calculateEntropy(blueBall.path);
    const redBallEntropy = calculateEntropy(redBall.path);
    document.getElementById("title_item_1_2").innerText = blueBallEntropy.toFixed(2);
    document.getElementById("title_item_2_2").innerText = redBallEntropy.toFixed(2);

    if (!observationTimeElapsed) {
        if (blueBall.path.length >= 10 * 60) { // 10 seconds * 60 frames per second
            observationTimeElapsed = true;
        }
    } else {
        const predictedPath = predictPath({ ...blueBall }, 10); // Predict for 10 seconds
        drawPredictedPath(predictedPath);
    }
}, 1000 / 30);

document.querySelector(".lds-roller").style.display = "none";

}, 2000)