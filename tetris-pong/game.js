class Game{
	constructor(){
		this.size=new Vector(10,24);
		this.tetrisFloor=20;
		this.pongCeil=4;
		this.pongGap=4;
		this.particles=[];
		this.camBump=new Vector();
		this.camBumpVelo=new Vector();
		this.points=0;
		this.background=[];

		this.board=Array(this.size.x).fill().map((_,x)=>
			Array(this.size.y).fill().map((__,y)=>new Tile(new Vector(x,y)))
		);
		this.boardFlat=this.board.flatMap(t=>t);

		let paddleY=this.size.y-1;
		this.paddle=new Paddle(new Vector(this.size.x/2,this.size.y-1));
		this.ball=new Ball();
		this.block=new Block(new Vector(Math.ceil(this.size.x/2)-1,2));
		this.ball.respawn(this);

		this.screenSize=new Vector();

		this.time=0;
		this.ended=false;
	}
	end(){
		this.ended=true;
	}
	restart(){
		this.time=0;
		this.points=0;
		this.ended=false;
		
		this.board=Array(this.size.x).fill().map((_,x)=>
			Array(this.size.y).fill().map((__,y)=>new Tile(new Vector(x,y)))
		);
		this.boardFlat=this.board.flatMap(t=>t);

		let paddleY=this.size.y-1;
		this.paddle=new Paddle(new Vector(this.size.x/2,this.size.y-1));
		this.ball=new Ball();
		this.block=new Block(new Vector(Math.ceil(this.size.x/2)-1,2));
		this.ball.respawn(this);
	}
	run(ctrl){
		this.time++;
		if(!this.ended){
			this.ball.run(this);
			this.paddle.run(this,ctrl);
			this.block.run(this,ctrl);
			this.completeRows();
			this.emptyRows();
		}else{
			if(ctrl.isKeyDown(" ")){
				this.restart();
			}
		}
		if(this.time%3==0){
			this.decor(new Vector(
				this.size.x/2,
				this.size.y/2
			));
		}
		this.particles.forEach(x=>x.run());
		this.particles=this.particles.filter(x=>x.isAlive());
		this.background.forEach(x=>x.run());
		this.background=this.background.filter(x=>x.isAlive());
	}
	completeRows(){
		for(let y=0;y<this.board[0].length;y++){
			if(this.board.every(x=>x[y].filled)){
				this.bump(new Vector(0,1));
				this.board.forEach(x=>x[y].break(this));
				this.shiftRows(y);
			}
		}
	}
	emptyRows(){
		for(let y=0;y<this.tetrisFloor;y++){
			if(this.board.every(x=>!x[y].filled)){
				this.shiftRows(y);
			}
		}
	}
	shiftRows(maxY){
		//skip the row at y=0
		for(let y=maxY;y>0;y--){
			this.board.forEach(x=>{
				x[y].filled=x[y-1].filled;
				x[y].col=x[y-1].col;
			});
		}
	}

	spew(count,pos,col,speed,size,velo=null){
		this.particles.push(
			...Array(count).fill().map(
				x=>{
					let v=new Vector(Math.random()*TAU,speed,true);
					if(velo!=null){
						v.addVec(velo);
					}
					return new Particle(pos,v,30,col,size*(Math.random()*0.4+0.6),speed/10);
				}
			)
		);
	}
	mark(pos,col){
		this.particles.push(new SquareParticle(pos,20,col,1));
	}
	point(pos,points){
		this.points+=points;
		this.particles.push(new PointParticle(pos,60,points));
	}
	decor(pos){
		this.background.push(new DecorParticle(pos,new Vector(Math.random()*TAU,Math.random()*0.1+0.05,true),300));
	}
	bump(vec){
		this.camBumpVelo.addVec(vec);
	}
	display(disp){
		let diff=new Vector(this.camBump);
		diff.sclVec(0.1);
		this.camBumpVelo.subVec(diff);
		this.camBumpVelo.sclVec(0.85);
		this.camBump.addVec(this.camBumpVelo);

		disp.cam.pos=new Vector(this.size);
		disp.cam.pos.sclVec(0.5);
		this.screenSize=new Vector(disp.canvas.offsetWidth,disp.canvas.offsetHeight);
		this.screenSize.sclVec(1/disp.cam.zoom);
		let screenMid=new Vector(disp.canvas.offsetWidth,disp.canvas.offsetHeight);
		screenMid.sclVec(0.5);
		screenMid.sclVec(1/disp.cam.zoom);
		disp.cam.pos.subVec(screenMid);
		disp.cam.pos.addVec(this.camBump);

		disp.reset();
		disp.clear();

		this.background.forEach(x=>x.display(disp));

		disp.setFill("#EFE9D7A0");
		disp.setStroke("#E2D9C3");
		disp.setWeight(4);
		let extraGap=0.5;
		disp.rect2(
			-this.pongGap-extraGap,this.pongCeil-extraGap,
			this.size.x+this.pongGap*2+extraGap*2,this.size.y-this.pongCeil+extraGap*2
		);
		disp.setWeight(6);
		disp.setFill("#EFE9D7");
		disp.rect2(0,0,this.size.x,this.tetrisFloor);
		disp.noFill();
		disp.rect2(-this.pongGap,this.pongCeil,this.size.x+this.pongGap*2,this.size.y-this.pongCeil);
		disp.setWeight(2);
		for(let x=1;x<this.size.x;x++){
			disp.start();
			disp.mt2(x,0);
			disp.lt2(x,this.tetrisFloor);
			disp.path();
		}
		for(let y=1;y<this.tetrisFloor;y++){
			disp.start();
			disp.mt2(0,y);
			disp.lt2(this.size.x,y);
			disp.path();
		}
		disp.setStroke("#EFE9D7");
		disp.setWeight(20);
		disp.setFill("#6D6862");
		disp.ctx.font=2*disp.cam.zoom+"px 'Fredoka One'";
		disp.ctx.textAlign="center";
		disp.ctx.textBaseline="middle";
		disp.ctx.strokeText(this.points,(this.size.x/2-disp.cam.pos.x)*disp.cam.zoom,(this.size.y+0.5-disp.cam.pos.y)*disp.cam.zoom);
		disp.ctx.fillText(this.points,(this.size.x/2-disp.cam.pos.x)*disp.cam.zoom,(this.size.y+0.5-disp.cam.pos.y)*disp.cam.zoom);

		let midTop=(-disp.cam.pos.y*disp.cam.zoom)/2;
		disp.ctx.fillText("Tetris Pong",(this.size.x/2-disp.cam.pos.x)*disp.cam.zoom,midTop);
		disp.setWeight(1);

		this.board.forEach(col=>
			col.forEach(tile=>tile.displayBack(disp))
		);
		this.block.displayBack(disp);
		this.board.forEach(col=>
			col.forEach(tile=>tile.display(disp))
		);
		this.block.display(disp);

		this.paddle.display(disp);
		this.particles.forEach(x=>x.display(disp));
		this.ball.display(disp);

		if(this.ended){
			disp.setStroke("#6D6862");
			disp.setWeight(20);
			disp.setFill("#EFE9D7");
			disp.ctx.font=2*disp.cam.zoom+"px 'Fredoka One'";
			disp.ctx.strokeText("GAME OVER",(this.size.x/2-disp.cam.pos.x)*disp.cam.zoom,(this.size.y/2-disp.cam.pos.y)*disp.cam.zoom);
			disp.ctx.fillText("GAME OVER",(this.size.x/2-disp.cam.pos.x)*disp.cam.zoom,(this.size.y/2-disp.cam.pos.y)*disp.cam.zoom);
			
			disp.ctx.font=1*disp.cam.zoom+"px 'Fredoka One'";
			disp.setFill("#6D6862");
			disp.ctx.fillText("(press SPACE to restart)",(this.size.x/2-disp.cam.pos.x)*disp.cam.zoom,(this.size.y/2+2-disp.cam.pos.y)*disp.cam.zoom);
		}
	}
}
class Paddle{
	constructor(pos){
		this.size=3;
		this.pos=new Vector(pos);
		this.pos.x-=this.size/2;
		this.velo=new Vector();
		this.bounceDist=1;
		this.speed=0.5;
	}
	run(game,ctrl){
		let targetP=ctrl.getMouse(gameDisplay.cam);
		// targetP=new Vector(game.ball.pos);
		// targetP.x+=0.5;
		targetP.x-=this.size/2;
		this.velo.x=targetP.x-this.pos.x;
		this.velo.limVec(this.speed);

		this.pos.addVec(this.velo);

		if(this.pos.x<-game.pongGap){
			this.velo.x=0;
			this.pos.x=-game.pongGap;
		}else if(this.pos.x+this.size>game.size.x+game.pongGap){
			this.velo.x=0;
			this.pos.x=game.size.x-this.size+game.pongGap;
		}
	}
	display(disp,ctrl){
		disp.noFill();
		disp.setStroke("#6D6862");
		disp.setWeight(6);
		disp.start();
		disp.mt2(this.pos.x,this.pos.y);
		disp.lt2(this.pos.x+this.size,this.pos.y);
		disp.path();
		disp.setWeight(1);
	}
	checkBall(toTest){
		if(toTest.velo.y<=0){
			return null;
		}
		let nrmPos=new Vector(toTest.pos);
		nrmPos.subVec(this.pos);
		let closestX=Math.max(Math.min(nrmPos.x,this.size),0);
		let closestY=0;
		let close=new Vector(closestX,closestY);
		if(close.inRange(nrmPos,toTest.size)){
			close.addVec(this.pos);
			return close;
		}
		return null;
	}
	collide(ball){
		let origin=new Vector(this.pos);
		origin.x+=this.size/2;
		origin.y+=this.bounceDist;
		let ang=origin.getAng(ball.pos);
		ball.velo=new Vector(ang,ball.speed,true);
		//Make sure the ball is always moving upwards after being hit
		ball.velo.y=-Math.abs(ball.velo.y);
	}
}
class Ball{
	constructor(){
		this.speed=0.2;
		this.pos=new Vector();
		this.velo=new Vector();
		this.size=0.33;
		this.spread=PI/4;
	}
	run(game){
		this.pos.addVec(this.velo);
		let lastVec=new Vector(this.velo);

		if(this.pos.x-this.size<-game.pongGap){
			this.pos.x=this.size-game.pongGap;
			this.velo.x=Math.abs(this.velo.x);
			this.velo.rotVec(Math.random()*this.spread);
		}else if(this.pos.x+this.size>game.size.x+game.pongGap){
			this.pos.x=game.size.x-this.size+game.pongGap;
			this.velo.x=-Math.abs(this.velo.x);
			this.velo.rotVec(-Math.random()*this.spread);
		}
		if(this.pos.y-this.size<game.pongCeil){
			this.pos.y=game.pongCeil+this.size;
			this.velo.y=Math.abs(this.velo.y);
			this.velo.rotVec((Math.random()*2-1)*this.spread);
		}else if(this.pos.y-this.size>game.size.y){
			//this.respawn(game);
			game.end();
		}
		while(this.hit(game));
		let diff=new Vector(lastVec);
		diff.subVec(this.velo);
		if(diff.getMag()>0){
			let bump=new Vector(diff);
			bump.sclVec(0.5);
			game.bump(bump);
			game.spew(3,this.pos,"#6D6862",0.25,0.5,diff);
		}
	}
	respawn(game){
		this.pos=new Vector(game.paddle.pos.x+game.paddle.size/2,game.paddle.pos.y-this.size);
		this.velo=new Vector(-PI/2+(Math.random()*2-1)*PI/4,this.speed,true);
	}
	hit(game){
		let hitPoint;
		let hit=[...game.block.shape,...game.boardFlat,game.paddle].find(t=>hitPoint=t.checkBall(this));
		if(hit!=null){
			let ang=this.pos.getAng(hitPoint);
			this.velo.rotVec(-ang);
			this.velo.x=-Math.abs(this.velo.x);
			this.velo.rotVec(ang);
			hit.collide(this,game);
			return true;
		}
		return false;
	}
	display(disp){
		disp.setStroke("#6D6862");
		disp.setWeight(6);
		disp.setFill("#EFE9D7");
		disp.circle2(this.pos.x,this.pos.y,this.size);
		disp.setWeight(1);
	}
}
class Tile{
	constructor(pos,filled=false,col="#ffffff"){
		this.pos=new Vector(pos);
		this.filled=filled;
		this.col=col;
	}
	checkBall(toTest){
		if(!this.filled){
			return null;
		}
		let nrmPos=new Vector(toTest.pos);
		nrmPos.subVec(this.pos);
		let closestX=Math.max(Math.min(nrmPos.x,1),0);
		let closestY=Math.max(Math.min(nrmPos.y,1),0);
		let close=new Vector(closestX,closestY);
		if(close.inRange(nrmPos,toTest.size)){
			close.addVec(this.pos);
			return close;
		}
		return null;
	}
	display(disp){
		if(!this.filled)
			return;
		disp.setWeight(3);
		disp.setStroke(overlayColor("#808080",this.col));
		disp.setFill(overlayColor("#B0B0B0",this.col));
		let extra=1.5/disp.cam.zoom;
		disp.rect2(this.pos.x+extra,this.pos.y+extra,1-extra*2,1-extra*2)
	}
	displayBack(disp){
		if(!this.filled)
			return;
		disp.setWeight(3);
		disp.setStroke(overlayColor("#808080",this.col));
		disp.setFill(overlayColor("#B0B0B0",this.col));
		let extra=1/disp.cam.zoom;
		disp.rect2(this.pos.x+extra,this.pos.y+extra,1-extra*2,1-extra*2)
	}
	check(game){
		if(!this.filled){
			return false;
		}
		let x=Math.floor(this.pos.x+0.5);
		let y=Math.floor(this.pos.y+0.5);
		if(y>=game.tetrisFloor){
			return true;
		}
		if(x>=0&&y>=0&&x<game.board.length&&y<game.board[0].length){
			return game.board[x][y].filled;
		}
		return true;
	}
	solidify(game){
		if(this.filled){
			game.mark(new Vector(this.pos.x+0.5,this.pos.y+0.5),"#ffffff");
			let x=Math.floor(this.pos.x+0.5);
			let y=Math.floor(this.pos.y+0.5);
			if(x>=0&&y>=0&&x<game.board.length&&y<game.board[0].length){
				game.board[x][y].filled=true;
				game.board[x][y].col=this.col;
			}
		}
	}
	collide(ball,game){
		this.break(game);
	}
	break(game){
		if(this.filled){
			this.filled=false;
			let mid=new Vector(this.pos);
			mid.addVec(new Vector(0.5,0.5));
			game.spew(5,mid,this.col,0.4,0.8);
			game.point(mid,1);
		}
	}
}
class Block{
	constructor(pos){
		this.spawnPos=new Vector(pos);
		this.pos=new Vector(pos);
		this.shape=[];
		this.centered=true;

		this.time=0;
		this.speed=5;
		this.fallSpeed=10;
		this.fallMercy=1;
		this.fallTime=0;

		this.queuedW=false;
		this.canRot=false;

		this.aDown=false;
		this.tapA=false;
		this.dDown=false;
		this.tapD=false;
		this.sDown=false;
		this.tapS=false;
	}
	run(game,ctrl){
		this.time++;

		let w=ctrl.isKeyDown("W");
		if(!w){
			this.canRot=true;
		}
		if(this.canRot&&w&&this.canRotate(false,game)){
			this.rotate(false);
			this.canRot=false;
		}

		if(ctrl.isKeyDown("A")){
			this.aDown=true;
		}
		if(ctrl.isKeyDown("D")){
			this.dDown=true;
		}
		if(ctrl.isKeyDown("S")){
			this.sDown=true;
		}

		if(this.time%this.speed==0){

			let d=ctrl.isKeyDown("D")||(this.dDown&&!this.tapD);
			if(!ctrl.isKeyDown("D")){
				this.tapD=false;
				this.dDown=false;
			}
			if(d&&this.canMove(new Vector(1,0),game)){
				this.tapD=true;
				this.dDown=false;
				this.move(new Vector(1,0));
			}

			let a=ctrl.isKeyDown("A")||(this.aDown&&!this.tapA);
			if(!ctrl.isKeyDown("A")){
				this.tapA=false;
				this.aDown=false;
			}
			if(a&&this.canMove(new Vector(-1,0),game)){
				this.tapA=true;
				this.aDown=false;
				this.move(new Vector(-1,0));
			}

			let s=ctrl.isKeyDown("S")||(this.sDown&&!this.tapS);
			if(!ctrl.isKeyDown("S")){
				this.tapS=false;
				this.sDown=false;
			}
			if(s&&this.canMove(new Vector(0,1),game)){
				this.tapS=true;
				this.sDown=false;
				this.move(new Vector(0,1));
			}
			this.queuedW=false;
		}

		if((this.time+Math.floor(this.speed/2))%this.fallSpeed==0){
			if(this.canMove(new Vector(0,1),game)){
				this.move(new Vector(0,1));
			}
			this.fall(game);
		}
		// this.move(new Vector(0,0.1));
		if(this.shape.every(t=>!t.filled)){
			this.respawn(game);
		}
	}
	rotate(direction){
		this.shape.forEach(t=>t.pos.subVec(this.pos));
		if(direction){
			if(!this.centered){
				this.shape.forEach(t=>t.pos.subVec(new Vector(-0.5,-0.5)));
			}
			this.shape.forEach(t=>[t.pos.x,t.pos.y]=[t.pos.y,-t.pos.x]);
			if(!this.centered){
				this.shape.forEach(t=>t.pos.subVec(new Vector(-0.5,-0.5)));
			}
		}else{
			if(!this.centered){
				this.shape.forEach(t=>t.pos.subVec(new Vector(0.5,0.5)));
			}
			this.shape.forEach(t=>[t.pos.x,t.pos.y]=[-t.pos.y,t.pos.x]);
			if(!this.centered){
				this.shape.forEach(t=>t.pos.subVec(new Vector(0.5,0.5)));
			}
		}
		this.shape.forEach(t=>t.pos.addVec(this.pos));
	}
	canRotate(direction,game){
		this.rotate(direction);
		let test=this.check(game);
		this.rotate(!direction);
		return !test;
		
	}
	fall(game){
		if(!this.canMove(new Vector(0,1),game)){
			this.fallTime++;
			if(this.fallTime>this.fallMercy){
				this.solidify(game);
				this.respawn(game);
			}
		}else{
			this.fallTime=0;
		}
	}
	canMove(toTest,game){
		this.move(toTest);
		let test=this.check(game);
		let reset=new Vector(toTest);
		reset.sclVec(-1);
		this.move(reset);
		return !test;
	}
	respawn(game){
		this.pos=new Vector(this.spawnPos);
		let type=Math.floor(Math.random()*7)+1;
		let col="#d9d9d9";
		switch(type){
			case 1:
				col="#20d9d9";
				this.centered=false;
				this.shape=[
					new Tile(new Vector(0,-2),true),
					new Tile(new Vector(0,-1),true),
					new Tile(new Vector(0,0),true),
					new Tile(new Vector(0,1),true),
				];
				break;
			case 2:
				col="#5075d9";
				this.centered=true;
				this.shape=[
					new Tile(new Vector(-1,-1),true),
					new Tile(new Vector(0,-1),true),
					new Tile(new Vector(0,0),true),
					new Tile(new Vector(0,1),true),
				];
				break;
			case 3:
				col="#d97550";
				this.centered=true;
				this.shape=[
					new Tile(new Vector(1,-1),true),
					new Tile(new Vector(0,-1),true),
					new Tile(new Vector(0,0),true),
					new Tile(new Vector(0,1),true),
				];
				break;
			case 4:
				col="#d9d950";
				this.centered=false;
				this.shape=[
					new Tile(new Vector(1,-1),true),
					new Tile(new Vector(0,-1),true),
					new Tile(new Vector(0,0),true),
					new Tile(new Vector(1,0),true),
				];
				break;
			case 5:
				col="#75d950";
				this.centered=true;
				this.shape=[
					new Tile(new Vector(0,-1),true),
					new Tile(new Vector(1,-1),true),
					new Tile(new Vector(0,0),true),
					new Tile(new Vector(-1,0),true),
				];
				break;
			case 6:
				col="#d95050";
				this.centered=true;
				this.shape=[
					new Tile(new Vector(0,-1),true),
					new Tile(new Vector(-1,-1),true),
					new Tile(new Vector(0,0),true),
					new Tile(new Vector(1,0),true),
				];
				break;
			case 7:
				col="#d950d9";
				this.centered=true;
				this.shape=[
					new Tile(new Vector(0,-1),true),
					new Tile(new Vector(-1,0),true),
					new Tile(new Vector(0,0),true),
					new Tile(new Vector(1,0),true),
				];
				break;
		}
		this.shape.forEach(t=>{t.pos.addVec(this.pos);t.col=col});
		if(this.check(game)){
			game.end();
		}
	}
	check(game){
		return this.shape.some(s=>s.check(game));
	}
	solidify(game){
		this.shape.forEach(s=>s.solidify(game));
	}
	move(toMove){
		this.pos.addVec(toMove);
		this.shape.forEach(t=>t.pos.addVec(toMove));
	}
	display(disp){
		this.shape.forEach(t=>t.display(disp));
	}
	displayBack(disp){
		this.shape.forEach(t=>t.displayBack(disp));
	}
}

class Particle{
	constructor(pos,velo,age,col,size,spin){
		this.pos=new Vector(pos);
		this.velo=new Vector(velo);
		this.age=age;
		this.ageMax=age;
		this.col=col;
		this.size=size;
		this.rot=Math.random()*TAU;
		this.spin=spin*TAU*(Math.random()*2-1);
		this.gravity=new Vector(0,0.05);
		this.friction=0.9;
	}
	run(){
		this.pos.addVec(this.velo);
		this.velo.addVec(this.gravity);
		this.velo.sclVec(this.friction);
		this.rot+=this.spin;
		this.age--;
	}
	isAlive(){
		return this.age>0;
	}
	display(disp){
		disp.noStroke();
		disp.setFill(this.col);
		disp.ctx.globalAlpha=this.age/this.ageMax;
		disp.start();
		for(let i=0;i<4;i++){
			let p=new Vector(this.rot+i/4*TAU,this.size,true);
			p.addVec(this.pos);
			if(i==0){
				disp.mt2(p.x,p.y);
			}else{
				disp.lt2(p.x,p.y);
			}
		}
		disp.shape();
		disp.ctx.globalAlpha=1;
	}
}
class SquareParticle{
	constructor(pos,age,col,size){
		this.pos=new Vector(pos);
		this.age=age;
		this.ageMax=age;
		this.size=size;
		this.col=col;
	}
	run(){
		this.age--;
	}
	isAlive(){
		return this.age>0;
	}
	display(disp){
		disp.noStroke();
		disp.setFill(this.col);
		disp.ctx.globalAlpha=this.age/this.ageMax;
		let size=this.age/this.ageMax*0.8+0.2;
		disp.start();
		for(let i=0;i<4;i++){
			let p=new Vector(i/4*TAU+PI/4,size,true);
			p.addVec(this.pos);
			if(i==0){
				disp.mt2(p.x,p.y);
			}else{
				disp.lt2(p.x,p.y);
			}
		}
		disp.shape();
		disp.ctx.globalAlpha=1;
	}
}
class PointParticle{
	constructor(pos,age,amount){
		this.pos=new Vector(pos);
		this.pos.addVec(new Vector(Math.random()*TAU,Math.random(),true));
		this.age=age;
		this.ageMax=age;
		this.size=(amount/10+1)*0.8;
		this.col=Math.random()<0.5?"#6ED393":"#51BC76";
		this.friction=0.85;
		this.velo=new Vector(0,-0.2);
		this.amount=amount;
	}
	run(){
		this.pos.addVec(this.velo);
		this.velo.sclVec(this.friction);
		this.age--;
	}
	isAlive(){
		return this.age>0;
	}
	display(disp){
		disp.noStroke();
		disp.setFill(this.col);
		disp.ctx.globalAlpha=this.age/this.ageMax;
		disp.ctx.font=this.size*disp.cam.zoom+"px 'Fredoka One'";
		disp.ctx.fillText("+ "+this.amount,(this.pos.x-disp.cam.pos.x)*disp.cam.zoom,(this.pos.y-disp.cam.pos.y)*disp.cam.zoom);
		disp.ctx.globalAlpha=1;
	}
}
class DecorParticle{
	constructor(pos,velo,age){
		this.pos=new Vector(pos);
		this.startPos=new Vector(pos);
		this.velo=new Vector(velo);
		this.dir=this.velo.getAng();
		this.age=age;
		this.ageMax=age;
		this.size=Math.random()*0.5+2;
		this.rot=Math.random()*TAU;
		this.spin=0.001*TAU*(Math.random()*2-1);

		let type=Math.floor(Math.random()*7)+1;
		switch(type){
			case 1:
				this.shape=[
					[0,-2],
					[0,-1],
					[0,0],
					[0,1],
				];
				break;
			case 2:
				this.shape=[
					[-1,-1],
					[0,-1],
					[0,0],
					[0,1],
				];
				break;
			case 3:
				this.shape=[
					[1,-1],
					[0,-1],
					[0,0],
					[0,1],
				];
				break;
			case 4:
				this.shape=[
					[1,-1],
					[0,-1],
					[0,0],
					[1,0],
				];
				break;
			case 5:
				this.shape=[
					[0,-1],
					[1,-1],
					[0,0],
					[-1,0],
				];
				break;
			case 6:
				this.shape=[
					[0,-1],
					[-1,-1],
					[0,0],
					[1,0],
				];
				break;
			case 7:
				this.shape=[
					[0,-1],
					[-1,0],
					[0,0],
					[1,0],
				];
				break;
		}
	}
	run(){
		this.pos.addVec(this.velo);
		let angMod=this.dir+this.startPos.getMag(this.pos)*TAU/50
		this.velo=new Vector(angMod,this.velo.getMag(),true);
		this.rot+=this.spin;
		this.age--;
	}
	isAlive(){
		return this.age>0;
	}
	display(disp){
		let scale=this.age/this.ageMax;
		disp.translate2(this.pos.x,this.pos.y);
		disp.rotate(this.rot);
		disp.setStroke("#E2D9C3");
		disp.setFill("#E2D9C3");
		disp.setWeight(12*scale);
		this.shape.forEach(t=>{
			disp.rect(t[0]*this.size*scale,t[1]*this.size*scale,this.size*scale,this.size*scale);
		});
		disp.setStroke("#EFE9D7");
		disp.setFill("#EFE9D7");
		disp.setWeight(1);
		this.shape.forEach(t=>{
			disp.rect(t[0]*this.size*scale,t[1]*this.size*scale,this.size*scale,this.size*scale);
		});
		disp.reset(this.rot);
	}
}