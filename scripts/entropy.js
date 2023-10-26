function calculateEntropy(path) {
    // Calculate segment lengths
    const segmentLengths = [];
    for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        const length = Math.sqrt(dx * dx + dy * dy);
        segmentLengths.push(length);
    }

    // Create a histogram (for simplicity, let's assume 10 bins)
    const numBins = 10;
    const binCounts = Array.from({ length: numBins }, () => 0);
    const maxSegmentLength = Math.max(...segmentLengths);
    segmentLengths.forEach(length => {
        const binIndex = Math.floor((length / maxSegmentLength) * numBins);
        binCounts[binIndex]++;
    });

    // Calculate probabilities and entropy
    const totalSegments = segmentLengths.length;
    let entropy = 0;
    for (const count of binCounts) {
        if (count > 0) {
            const probability = count / totalSegments;
            entropy -= probability * Math.log2(probability);
        }
    }

    return entropy;
}

// Example usage
const greenBallEntropy = calculateEntropy(individualBalls[0].path);
const redBallEntropy = calculateEntropy(individualBalls[1].path);

console.log("Green Ball Entropy:", greenBallEntropy);
console.log("Red Ball Entropy:", redBallEntropy);
