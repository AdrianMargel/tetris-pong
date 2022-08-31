let gameDisplay=new Display();
gameDisplay.connect();
let gameRunner=new Game();
let gameControl=new Control();
gameControl.connect(document.body);

// Yes I'm aware there are better ways to set up a consistent framerate loop. No I'm not going to do it.
setInterval(()=>{
	gameRunner.run(gameControl);
	primeAnimation();
}, 1000/60);


var displaying=true;
var last;
var totalElapsed=0;
function primeAnimation(){
	totalElapsed=0;
}
function animation(timestamp) {
	if(last===undefined){
		last=timestamp;
	}
	let elapsed=timestamp-last;
	let runSpeed=1000/10;
	let animAmount=elapsed/runSpeed;
	last=timestamp;
	totalElapsed+=animAmount;
	if(totalElapsed>1){
		animAmount=0;
	}

	gameRunner.display(gameDisplay);
	if(displaying){
		window.requestAnimationFrame(animation);
	}
}
window.requestAnimationFrame(animation);