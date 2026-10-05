// ©J.ROUSSEL - 09/2020 - femto-physique.fr
// Trajectoires de phase d'un pendule simple de pulsation propre w0 fixé à 2π pour avoir T=1S

// ------ dimensions et échelles---------
var lp;//longueur du pendule
var rp;//rayon de la masse du pendule
var Xmax, Ymax, hh, hhh;//graduation de l'espace des phases
//------ caractéristique de l'oscillateur (w0 est fixé à 2π pour avoir T=1s) -----
var lambda;//coef d'amortissement
var S=new Array(2);//vecteur d'état (S[0]=theta et s[1]=w/w0)
//------ intégrateur de Verlet
var h;//pas temorel
var time;//temps
//------ calques  ----
var TP;//pour la trajectoire de phase
var TP2;//po la trajectoire du pendule 
var TP3;//pour theta=f(t)
//-------- GUI
let sliderLambda;
let selecteur; //pour sélectionner le type de courbe à tracer
var TraceSpacePhase;//booléen pour savoir si l'espace des phases est tracée ou pas
var ClicOnSpacePhase;//booléen pour savoir si l'espace des phases est tracée ou pas

function setup() {
  createCanvas(windowWidth, windowWidth/2);//on impose un format 2x1
  //let myCanvas=createCanvas(752, 376);
  //myCanvas.parent('sketch');
  //initialisation des calques
  initCalques();
  //------ GUI (slider amortissement + menu déroulant --------
  lambda=0.1;
  imageMode(CENTER);
  textSize(int(5+windowWidth*.01));
  sliderLambda = createSlider(0, 1, 0.1, 0.1);
  //sliderLambda.parent('sketch');
  sliderLambda.position(height, 20);
  sliderLambda.style('width', str(int(height/3)) + 'px');
  selecteur = createSelect();
  selecteur.position(height*1.5, 20);
  selecteur.option('Espace des phases');
  selecteur.option('\u03B8 = f(t)');
  selecteur.changed(mySelectEvent);
  //------- Conditions initiales ----
  S[0]=0.9*PI;//theta
  S[1]=0;//vitesse angulaire
  h=0.02;
  time=0;
  //------ Dimensions du pendule
  lp = 0.40*height;
  rp = 0.08*height;
  //------ espace des phase ------
  hhh=int(height/4);
  hh=2*hhh;
  Xmax=4; //échelle en theta
  Ymax=Xmax/2; // échelle en omega/omega_0 identique pour avoir un facteur d'échelle de 1 (sinon les cercles deviennent des ellipses)
  TraceSpacePhase=true;
  ClicOnSpacePhase=false;
}

function draw() {  
  background(100);
  var OM = createVector(mouseX-hh, mouseY-hh);//pour orienter le pendule avec la souris

  //on trace la trajectoire du pendule
  image(TP2, hh, hh, height, height);
  //si le sélecteur est sur 'Espace des phases'
  if (TraceSpacePhase) {
    // si on clique sur l'espace des phases, Verlet() s'arrête et le pendule se place dans l'état imposé par la position de la souris.
    //De plus la trajectoire de phase s'efface
    if (ClickOnPhaseSpace()) {
      S[0]=map((mouseX-1.5*height), -hh, hh, -Xmax, Xmax);
      S[1]=map(mouseY, hhh, 3*hhh, Ymax, -Ymax);
      effaceCalques();
    } 
    // si on clique sur le pendule, Verlet() s'arrête et le pendule se place dans l'état imposé par la position de la souris.
    else if (ClickOnPendulum()) {
      S[0] = HALF_PI-OM.heading();
      if (S[0]>PI) {
        S[0]-=TWO_PI;
      }
      S[1] = 0;
      push();
      translate(hh, hh);
      fill(70);
      arc(0, 0, hh/3, hh/3, OM.heading(), HALF_PI);
      fill(255);
      text(nfc(S[0]*180/PI, 1)+'°', 0, 20);
      pop();
      effaceCalques();
    } else {
      Verlet();
    }
    displayPendulum();
    image(TP, 1.5*height, hh, height, height);
    displayPhaseSpace(30);
  }
  //si le sélecteur est sur 'theta=f(t)'
  else {
    if (ClickOnPendulum()) {      
      S[0] = HALF_PI-OM.heading();
      if (S[0]>PI) {
        S[0]-=TWO_PI;
      }
      S[1] = 0;
      push();
      translate(hh, hh);
      fill(70);
      arc(0, 0, hh/3, hh/3, OM.heading(), HALF_PI);
      fill(255);
      text(nfc(S[0]*180/PI, 1)+'°', 0, 20);
      pop();
      time = 0;
      effaceCalques();
    } else {
      Verlet();
    }
    displayPendulum();
    image(TP3, 1.5*height, hh, height, height/2);
    displayTheta();
  }

  //------- curseur amortissement
  fill(255);
  text('Amortissement \u03BB = '+lambda+' Hz', sliderLambda.x, sliderLambda.y+34);
  lambda = sliderLambda.value();
}

function mySelectEvent() {
  let nom = selecteur.value();
  switch(nom) {
  case 'Espace des phases': 
    TraceSpacePhase=true;
    break;
  case '\u03B8 = f(t)': 
    TraceSpacePhase=false;
    break;
  }
}

function ClickOnPhaseSpace() {
  var bool;
  if (mouseIsPressed == true && (mouseX>height && abs(mouseY-hh)<hhh)) {
    bool=true;
  } else {
    bool=false;
  }
  return bool;
}

function ClickOnPendulum() {
  var bool;
  if (mouseIsPressed == true && (mouseX<height && mouseY>40)) {
    bool=true;
  } else {
    bool=false;
  }
  return bool;
}


//***** Intégration par Verlet *****
function Verlet() {
  var SS0, SS1, a0;
  var I;//variable utilisée pour reprérer le oment ou la trace dépasse de l'écran 
  SS0=S[0];//on stocke theta_prec
  SS1=S[1];//idem pour omega/omega_0
  if (sq(SS0)+sq(SS1)>0.0001) {
    a0=champ(SS0, SS1).y;//accélération angulaire divisé par w0=2π
    S[0]+=TWO_PI*(h*SS1+0.5*sq(h)*a0);
    S[1]+=0.5*h*(a0+champ(S[0], SS1).y);
    time+=1;
    TP.stroke(200, 1/sq(S[1]), 1);
    TP.line(map(SS0, -Xmax, Xmax, 0, height), map(SS1, -Ymax, Ymax, 3*hhh, hhh), map(S[0], -Xmax, Xmax, 0, height), map(S[1], -Ymax, Ymax, 3*hhh, hhh));
    TP2.stroke(0, 0, 1, 0.04);
    TP2.line(hh+lp*sin(SS0), hh+lp*cos(SS0), hh+lp*sin(S[0]), hh+lp*cos(S[0]));
    TP3.stroke(0, 168, 255);
    I=time%height-(time-1)%height;
    TP3.line((time-1)%height, map(SS0, -Xmax, Xmax, hh, 0), time%height, map(S[0], -Xmax, Xmax, hh, 0));
    if (I<0) {
      TP3.background(100);
    }
  }
}


//Champ vectoriel du flot F(x,y)  (dS/dt=F(S))
// F(x,y)=(w0*y,-w0*sin(x)-2*lambda*y) avec x=theta et y= w/w0
function champ(xx, yy) {
  let F=createVector(TWO_PI*yy, -TWO_PI*sin(xx)-2*lambda*yy);
  return F;
}

//Tracé de l'Espace des phases
function displayPhaseSpace(grid) {
  var xtick, ytick;//graduation sur X et Y
  var posx, posy;
  var intensity;
  //tracé du repère
  push();
  strokeWeight(1);
  stroke(153, 153, 153, 100);
  translate(3*hh, hh);
  line(0, -hhh, 0, hhh);
  line(-hh, 0, hh, 0);
  //echelles
  xtick=map(PI, 0, Xmax, 0, hh);
  ytick=map(1, 0, Ymax, 0, -hhh);
  stroke(255);
  fill(255);
  line(xtick, 5, xtick, -5);
  line(-xtick, 5, -xtick, -5);
  line(-5, ytick, 5, ytick);
  line(-5, -ytick, 5, -ytick);
  textAlign(CENTER, TOP);
  text("E S P A C E   D E S   P H A S E S", 0, 1.5*hhh);
  text("\u03B8", hh-10, 5);
  text("π", xtick, 5);
  text("-π", -xtick, 5);
  textAlign(RIGHT, CENTER);
  text("\u03C9", -5, -hhh+10);
  text("\u03C9"+"0", -5, ytick);
  text("-\u03C9"+"0", -5, -ytick);
  //tracé du champ vectoriel
  fill(153);
  stroke(153);
  for (var i=-hh; i<=hh; i+=grid) {
    posx=map(i, -hh, hh, -Xmax, Xmax);
    for (var j=-hhh; j<=hhh; j+=grid) {
      posy=map(j, -hhh, hhh, Ymax, -Ymax);
      intensity=constrain(0.04*champ(posx, posy).mag(), 0, 0.8);
      len=lerp(grid/5, grid, intensity);
      stroke(255, 255*intensity);
      push();
      translate(i, j);// Vector heading to get direction (pointing up is a heading of 0)
      drawVector(champ(posx, posy), len);// on inverse le vecteur à cause des conventions d'orientation de processing
      pop();
    }
  }
  pop();
}


//Tracé de la courbe theta=f(t)
function displayTheta() {
  //tracé du repère
  push();
  strokeWeight(1);
  stroke(153, 153, 153, 100);
  translate(height, hh);
  line(0, -hhh, 0, hhh);
  line(0, 0, height, 0);
  //echelles
  stroke(255);
  fill(255); 
  textAlign(CENTER, TOP);
  text("A N G L E    \u03B8   E N   F O N C T I O N   D U   T E M P S", hh, 1.5*hhh);
  text("\u03B8", 10, -hhh);
  textAlign(RIGHT, CENTER);
  text("t", height-10, -10);
  //tracé de la courbe
  pop();
}

function drawVector(V, len) {
  rotate(-V.heading()); // Scale it to be bigger or smaller if necessary
  line(0, 0, len, 0);
  triangle(len, 0, '.85'*len, 1, '.85'*len, -1);
}

function displayPendulum() {
  push();
  translate(hh, hh);
  stroke(200);
  strokeWeight(5);
  var xp=lp*sin(S[0]);
  var yp=lp*cos(S[0]);
  line(0, 0, xp, yp);
  ellipse(xp, yp, rp, rp);
  strokeWeight(1);
  fill(0);
  ellipse(xp, yp, 4, 4);
  ellipse(0, 0, 4, 4);
  pop();
}

// pour réinitialiser les calques
function effaceCalques() {
  TP.background(0, 0, 0.38);
  TP2.background(0, 0, 0.38);
  TP3.background(100);
}

// pour réinitialiser les calques
function initCalques() {
  TP = createGraphics(height, height);
  TP.colorMode(HSB, 360, 1, 1);
  TP.strokeWeight(2);
  TP2 = createGraphics(height, height);
  TP2.colorMode(HSB, 360, 1, 1, 1);
  TP3 = createGraphics(height, height/2);
}

function windowResized() {
  // redimensionner dynamiquement notre canvas aux dimensions de la fenêtre de notre navigateur
  resizeCanvas(windowWidth, 0.5*windowWidth); 
  sliderLambda.position(height, 20);
  sliderLambda.style('width', str(int(height/3)) + 'px');
  selecteur.position(height*1.5, 20);
  lp = 0.40*height;
  rp = 0.08*height;
  hhh=int(height/4);
  hh=2*hhh;
  initCalques();
  textSize(int(5+windowWidth*0.01));
}

//------ en pressant S on fait une sauvegarde -------
function keyPressed() {
  if (key === 's' || key === 'S') {
    save('myCanvas.png');
  }
}
