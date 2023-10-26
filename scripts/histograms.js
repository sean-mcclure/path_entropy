histogram = {
    greenBallSegmentLengths: [],
    redBallSegmentLengths: [],
    calculateSegmentLength: function(path) {
        if(path.length < 2) {
            return 0; // Return 0 if there are less than 2 points in the path
        }
        // Calculate length using Euclidean distance formula between consecutive points
        const segmentLengths = [];
        for(let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i - 1].x;
            const dy = path[i].y - path[i - 1].y;
            const length = Math.sqrt(dx * dx + dy * dy);
            segmentLengths.push(length);
        }
        // Calculate average segment length (you can use other metrics as needed)
        const averageLength = segmentLengths.reduce((sum, length) => sum + length, 0) / segmentLengths.length;
        return averageLength;
    },
    line_segment_distribution: function(options) {
        // Calculate segment lengths for green and red balls' paths
        const greenSegmentLength = histogram.calculateSegmentLength(options.individualBalls[0].path);
        const redSegmentLength = histogram.calculateSegmentLength(options.individualBalls[1].path);
        // Update segment lengths arrays
        histogram.greenBallSegmentLengths.push(greenSegmentLength);
        histogram.redBallSegmentLengths.push(redSegmentLength);
        // Update histograms in real-time using Plotly.js
        layout = {
            height: 200,
            plot_bgcolor : "rgba(0,0,0,0)",
            paper_bgcolor : "rgba(0,0,0,0)",
            margin: {t:5,r:5,b:50,l:50},
            xaxis: {
                title : "Segment Length",
                tickcolor: 'white',
                linecolor: 'white',
                linewidth: 2,
                color: "white"
              },
              yaxis: {
                title : "Frequency",
                tickcolor: 'white',
                linecolor: 'white',
                linewidth: 2,
                color: "white"
              }
        },
        plotly_config = {
            displayModeBar: false
          };
        Plotly.newPlot('regular_histogram', [{
            x: histogram.greenBallSegmentLengths,
            type: 'histogram',
            marker: {
                color: config.normal_person_ball_color,
                },
            autobinx: false,
            xbins: {
                start: 0,
                end: 20,
                size: 0.5
            }
        }], layout, plotly_config);
        Plotly.newPlot('superhero_histogram', [{
            x: histogram.redBallSegmentLengths,
            type: 'histogram',
            marker: {
                color: config.superhero_ball_color,
                },
            autobinx: false,
            xbins: {
                start: 0,
                end: 20,
                size: 0.5
            }
        }], layout, plotly_config);
    }
}