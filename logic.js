// Config parameters
const minCircleSizeInPx = 50;
const maxCircleSizeInPx = 250;
const maxYoungLifeInSeconds = 3;
const maxOldLifeInSeconds = 2;
const maxAdultLifeInSeconds = 2;
const newObstacleProbability = 0.3;
const minDelayBetweenObstaclesInSeconds = 3;
const minObstacleSizeToCheck = 15;
const minObstacleOpacityToCheck = 0.2;
const maxNumObstacles = 1;
const timeMultiplier = 1;

let timeStart = 0;
let intViewportHeight = 0;
let intViewportWidth = 0;
let lastObstacleCreated = 0
let obstacles = [];
let stillAlive = true;
const cursorPosition = {x: 0, y: 0}
const canvas = document.getElementById('canvas');
const ctx2d = canvas.getContext('2d');
canvas.addEventListener('mousemove', onMouseMove);
const infoDialog = document.getElementById('info');
const endDialog = document.getElementById('end');

function onMouseMove(event) {
	cursorPosition.x = event.offsetX;
	cursorPosition.y = event.offsetY;
}

function start() {
	
	stillAlive = true;
	infoDialog.style.display = 'none';
	endDialog.style.display = 'none';
	timestart = getTime();
	window.requestAnimationFrame(nextFrame);

}

function nextFrame() {
	resize();
	update();

	if(stillAlive) {

		draw(obstacles);

	} else {
		endDialog.style.display = 'block';
	}

}

function resize() {
	var displayWidth  = canvas.clientWidth;
	var displayHeight = canvas.clientHeight;
	
	if (canvas.width  != displayWidth ||
		canvas.height != displayHeight) {
		canvas.width  = displayWidth;
		canvas.height = displayHeight;
		intViewportHeight = displayHeight;
		intViewportWidth = displayWidth;
	}
}

function update() {

	updateObstaclesAndStatus(obstacles);

	if(stillAlive) {

		addObstacleIfNeeded(obstacles);

	}

}

function updateObstaclesAndStatus(obstacles) {

	const now = getTime();
	let obs = [...obstacles];

	for(i = 0; i<obs.length && stillAlive; ++i) {
		const o = obs[i];
	
		// Grow, Live and Die
		const obstacleAge = (now - o.bornTS) / 1000;
		const adultLifeLimit = o.youngLife + o.adultLife;
		const oldLifeLimit = adultLifeLimit + o.oldLife;

		if (obstacleAge < o.youngLife) {

			o.currentSize = (obstacleAge / o.youngLife) * o.maxSize;

		} else if(obstacleAge < adultLifeLimit) {

		} else if(obstacleAge < oldLifeLimit) {

			o.opacity = ((oldLifeLimit - obstacleAge)/(oldLifeLimit - adultLifeLimit));

		} else {
			obstacles.splice(i, 1);
		}

		if (o.currentSize > minObstacleSizeToCheck && o.opacity > minObstacleOpacityToCheck)
			stillAlive = !checkIntersection(o, cursorPosition);

	}

}

function checkIntersection(obstacle, cursor) {

	const diffX = obstacle.x - cursor.x;
	const diffY = obstacle.y - cursor.y;
	return ((diffX*diffX + diffY*diffY) < obstacle.currentSize*obstacle.currentSize)

}

function getTime() {
	return performance.now() * timeMultiplier;
}

function addObstacleIfNeeded(obstacles) {

	const now = getTime();
	const canCreateNewObstacle = (
		lastObstacleCreated === 0 || ((now - lastObstacleCreated) > minDelayBetweenObstaclesInSeconds * timeMultiplier)
	) && obstacles.length < maxNumObstacles;

	if(canCreateNewObstacle && Math.random() < newObstacleProbability) {

		obstacles.push({
			bornTS: now,
			currentSize: 0,
			opacity: 1.0,
			colorHue: Math.random() * 360,
			youngLife: Math.random() * maxYoungLifeInSeconds,
			oldLife: Math.random() * maxOldLifeInSeconds,
			adultLife: Math.random() * maxAdultLifeInSeconds,
			maxSize: Math.round(Math.random() * (maxCircleSizeInPx - minCircleSizeInPx) + minCircleSizeInPx),
			x: Math.random() * intViewportWidth,
			y: Math.random() * intViewportHeight
		})

		lastObstacleCreated = now

	}

}

const randomHSL = () => `hsla(${Math.random() * 360}, 100%, 50%, 1)`

function draw(obs) {

	clearCanvas();

	for(i = 0; i<obs.length; ++i) {
		const o = obs[i];
		drawCircle(o.x, o.y, o.currentSize, o.colorHue, o.opacity)
	}

	window.requestAnimationFrame(nextFrame)

}

function clearCanvas() {
	ctx2d.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCircle(x, y, radius, hue, opacity) {
	ctx2d.beginPath();
	ctx2d.arc(x, y, radius, 0, 2*Math.PI);
	ctx2d.fillStyle = `hsla(${hue}, 100%, 50%, ${opacity})`;
	ctx2d.fill();
}