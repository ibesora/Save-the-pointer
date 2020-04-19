// Config parameters
const minCircleSizeInPx = 50;
const maxCircleSizeInPx = 250;
const minYoungLifeInSeconds = 2;
const maxYoungLifeInSeconds = 3;
const maxOldLifeInSeconds = 2;
const maxAdultLifeInSeconds = 2;
const newObstacleProbability = 0.9;
const newShieldProbability = 0.2;
const minDelayBetweenObstaclesInSecondsStart = 0.9;
const minDelayBetweenObstaclesInSecondsTotal = 0.3;
const perLevelDelayReduction = 0.3;
const lowerThanMinDelayReductionMultiplier = 0.7;
const minDelayBetweenShieldsInSeconds = 5;
const minObstacleSizeToCheck = 15;
const minObstacleOpacityToCheck = 0.3;
const shieldWidthInPx = 10;
const maxNumObstacles = 500;
const maxNumShields = 5;
const checkIntersectionWithObstacles = true;
const levelDurationInSeconds = 10;
const countdownStart = 5;
const timeMultiplier = 1;

const Mode = {
	NotStarted: 0,
	Playing: 1,
	LevelCountdown: 2,
	Ended: 3
}


let timeStart = 0;
let intViewportHeight = 0;
let intViewportWidth = 0;
let lastObstacleCreated = 0
let lastShieldCreated = 0;
let obstacles = [];
let shields = [];
let stillAlive = true;
let currentLevel = 0;
let gameMode = Mode.NotStarted;
let minDelayBetweenObstaclesInSeconds = minDelayBetweenObstaclesInSecondsStart;

const cursor = {x: 0, y: 0, shields: 1}
const canvas = document.getElementById('canvas');
const ctx2d = canvas.getContext('2d');
document.body.addEventListener('mousemove', onMouseMove);
const infoDialog = document.getElementById('info');
const endDialog = document.getElementById('end');
const endTime = document.getElementById('time');
const levelCountdownDialog = document.getElementById('levelCountdown');
const levelNumber = document.getElementById('levelNumber');
const levelCountdown = document.getElementById('countdown');

function onMouseMove(event) {

	cursor.x = event.pageX;
	cursor.y = event.pageY;

}

function start() {
	
	stillAlive = true;
	obstacles = [];
	shields = [];
	cursor.shields = 1;
	lastShieldCreated = 0;
	lastObstacleCreated = 0;
	currentLevel = 1;
	infoDialog.style.display = 'none';
	endDialog.style.display = 'none';
	canvas.style.cursor = 'none';
	timeStart = performance.now();
	gameMode = Mode.LevelCountdown;
	window.requestAnimationFrame(nextFrame);

}

function nextFrame() {
	resize();
	update();

	if(gameMode === Mode.Playing) {

		if(stillAlive) {

			draw(obstacles, shields, cursor);

		} else {

			end();

		}

	} else if(gameMode === Mode.LevelCountdown) {
		drawCountdown();
	}

	if(stillAlive) {
		window.requestAnimationFrame(nextFrame);
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

	updateGameStatus();

	if(gameMode == Mode.Playing) {

		updateObstaclesAndPlayerStatus(obstacles, shields);

		if(stillAlive) {

			addObstacleIfNeeded(obstacles);
			addShieldIfNeeded(shields);

		}

	}

}

function updateGameStatus() {

	const now = performance.now();
	const secondsInLevel = now - timeStart
	const levelChangeNeeded = Math.round(secondsInLevel > levelDurationInSeconds * 1000);

	if(levelChangeNeeded) {

		currentLevel++;
		console.log("Level changed!", currentLevel);
		gameMode = Mode.LevelCountdown;
		minDelayBetweenObstaclesInSeconds -= perLevelDelayReduction
		if(minDelayBetweenObstaclesInSeconds < minDelayBetweenObstaclesInSecondsTotal) {

			minDelayBetweenObstaclesInSeconds = minDelayBetweenObstaclesInSecondsTotal * Math.pow(lowerThanMinDelayReductionMultiplier, currentLevel - 3);
			console.log(minDelayBetweenObstaclesInSecondsTotal, lowerThanMinDelayReductionMultiplier, currentLevel - 3)

		}
		console.log(minDelayBetweenObstaclesInSeconds)
		obstacles = [];
		shields = [];
		lastObstacleCreated = 0;
		lastShieldCreated = 0;
		timeStart = performance.now();

	}

}

function drawCountdown() {
	
	const now = performance.now();
	const ellapsedSeconds = (now - timeStart) / 1000;
	const remainingSeconds = Math.ceil(countdownStart - ellapsedSeconds);

	if(remainingSeconds === 0) {
		timeStart = performance.now();
		levelCountdownDialog.style.display = 'none';
		gameMode = Mode.Playing;
	} else {
		levelCountdownDialog.style.display = 'block';
		levelNumber.innerHTML = currentLevel;
		levelCountdown.innerHTML = remainingSeconds;
	}
}

function updateObstaclesAndPlayerStatus(obstacles, shields) {

	const now = getTime();
	let obs = [...obstacles];
	let sh = [...shields];

	for(i = 0; i<obs.length && stillAlive; ++i) {
		const o = obs[i];
	
		// Grow, Live and Die
		const obstacleAge = (now - o.bornTS) / 1000;
		const adultLifeLimit = o.youngLife + o.adultLife;
		const oldLifeLimit = adultLifeLimit + o.oldLife;

		if (obstacleAge < o.youngLife) {

			o.radius = (obstacleAge / o.youngLife) * o.maxSize;

		} else if(obstacleAge < adultLifeLimit) {

		} else if(obstacleAge < oldLifeLimit) {

			o.opacity = ((oldLifeLimit - obstacleAge)/(oldLifeLimit - adultLifeLimit));

		} else {
			obstacles.splice(i, 1);
		}

		if (o.radius > minObstacleSizeToCheck && 
			o.opacity > minObstacleOpacityToCheck)
			if(checkIntersectionWithObstacle(o, cursor)) {
				cursor.shields--;
				stillAlive = cursor.shields !== 0;
			}

	}

	for(i = 0; i<sh.length && stillAlive; ++i) {
		const s = sh[i];
		if(checkIntersectionWithShield(s, cursor)) {
			cursor.shields++;
			shields.splice(i, 1);
		}

	}

}

function checkIntersectionWithObstacle(obstacle, cursor) {

	if (!checkIntersectionWithObstacles) return false;

	return checkIntersectionWithCircle(obstacle.x, obstacle.y, obstacle.radius, 
		cursor.x, cursor.y, cursor.shields * shieldWidthInPx);

}

function checkIntersectionWithCircle(x1, y1, r1, x2, y2, r2) {

	const diffX = x1 - x2;
	const diffY = y1 - y2;
	// We use the intersection check between 2 circles where they intersect if 
	// d < r1 + r2 where d is the distance between the two circle centers
	// and r1 and r2 the respective radious. 
	// To avoid having to compute the square root each time we compare
	// d² < (r1 + r2)²
	return ((diffX*diffX + diffY*diffY) < (r1*r1 + r2*r2 + 2*r1*r2))

}

function checkIntersectionWithShield(shield, cursor) {

	return checkIntersectionWithCircle(shield.x, shield.y, shield.radius, 
		cursor.x, cursor.y, cursor.shields * shieldWidthInPx);

}

function getTime() {
	return performance.now() * timeMultiplier;
}

function addObstacleIfNeeded(obstacles) {

	const now = getTime();
	const canCreateNewObstacle = (
		lastObstacleCreated === 0 || ((now - lastObstacleCreated) > minDelayBetweenObstaclesInSeconds * 1000 * timeMultiplier)
	) && obstacles.length < maxNumObstacles;

	if(canCreateNewObstacle) {
		
		if (getRandomNumber(0, 1) < newObstacleProbability) {

			obstacles.push({
				bornTS: now,
				radius: 0,
				opacity: 1.0,
				colorHue: getRandomNumber(0, 360),
				youngLife: getRandomNumber(minYoungLifeInSeconds, maxYoungLifeInSeconds),
				oldLife: getRandomNumber(0, maxOldLifeInSeconds),
				adultLife: getRandomNumber(0, maxAdultLifeInSeconds),
				maxSize: Math.round(getRandomNumber(minCircleSizeInPx, maxCircleSizeInPx)),
				x: getRandomNumber(0, intViewportWidth),
				y: getRandomNumber(0, intViewportHeight)
			});

		}

		lastObstacleCreated = now

	}

}

function addShieldIfNeeded(shields) {

	const now = getTime();
	const canCreateNewShield = (
		lastShieldCreated === 0 || ((now - lastShieldCreated) > minDelayBetweenShieldsInSeconds * 1000 * timeMultiplier)
	) && shields.length < maxNumShields;

	if(canCreateNewShield) {
		
		if(getRandomNumber(0, 1) < newShieldProbability) {

			shields.push({
				x: getRandomNumber(0, intViewportWidth),
				y: getRandomNumber(0, intViewportHeight),
				radius: shieldWidthInPx
			});

		}

		lastShieldCreated = now

	}

}

function getRandomNumber(min, max) {
	return Math.random() * (max - min) + min;
}

function draw(obs, shields, cursor) {

	clearCanvas();

	for(i = 0; i<obs.length; ++i) {
		const o = obs[i];
		drawCircle(o.x, o.y, o.radius, o.colorHue, 100, 50, o.opacity)
	}

	for(i = 0; i<shields.length; ++i) {
		const s = shields[i];
		drawCircle(s.x, s.y, shieldWidthInPx, 0, 0, 0, 1.0, 1);
	}

	drawCursor(cursor);

}

function clearCanvas() {
	ctx2d.fillStyle = '#000';
	ctx2d.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCircle(x, y, radius, hue, saturation, luminosity, opacity, stroke=0, strokeColor="white") {
	ctx2d.beginPath();
	ctx2d.arc(x, y, radius, 0, 2*Math.PI);
	ctx2d.fillStyle = `hsla(${hue}, ${saturation}%, ${luminosity}%, ${opacity})`;
	ctx2d.fill();

	if(stroke !== 0) {
		ctx2d.strokeStyle = strokeColor;
		ctx2d.lineWidth = 3;
		ctx2d.stroke();
	}
}

function drawSquare(x, y, size, hue, saturation, luminosity, opacity, stroke=0, strokeColor="white") {
	ctx2d.fillStyle =  `hsla(${hue}, ${saturation}%, ${luminosity}%, ${opacity})`;
    ctx2d.fillRect(x, y, size, size);

	if(stroke !== 0) {
		ctx2d.strokeStyle = strokeColor;
		ctx2d.lineWidth = stroke;
		ctx2d.strokeRect(x, y, size, size);
	}
}

function drawCursor(cursor) {

	for(i=cursor.shields; i>0; --i) {
		drawCircle(cursor.x, cursor.y, i*shieldWidthInPx, 0, 0, 0, 1.0, 3);
	}

}

function end() {
	const now = performance.now();
	endTime.innerHTML = ((now - timeStart)/1000).toFixed(2);
	endDialog.style.display = 'block';
	canvas.style.cursor = 'auto';
	gameMode = Mode.Ended;
}