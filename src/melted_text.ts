import p5 from "p5";
import blurFrag from './blur.frag?raw'
import fadeFrag from './fade.frag?raw'

// Parameter definitions moved from main.tsx to here
export const numericParameterDefs = {
  "timeMultiplier": {
    "min": 0,
    "max": 5.0,
    "step": 0.01,
    "defaultValue": 1.0, 
  },
  "particleMaxCount": {
    "min": 10,
    "max": 2000, 
    "step": 10,
    "defaultValue": 1500,
  },
  "particleForceStrength": {
    "min": 0.01,
    "max": 0.5,
    "step": 0.01,
    "defaultValue": 0.1,
  },
  "particleMaxSpeed": {
    "min": 0.5,
    "max": 5,
    "step": 0.1,
    "defaultValue": 2.4,
  },
  "particleTrailWeight": {
    "min": 1,
    "max": 5,
    "step": 0.5,
    "defaultValue": 1.0,
  },  
  "particleNoiseStrength": {
    "min": 0.0,
    "max": 16.0,
    "step": 0.1,
    "defaultValue": 2.0,
  },
  "particleTrailFadeStrength": {
    "min": -0.2,
    "max": 0.2,
    "step": 0.001,
    "defaultValue": 0.003,
  },
  "textSize": {
    "min": 10,
    "max": 200,
    "step": 5,
    "defaultValue": 90,
  },
  "maxWordCount": {
    "min": 1,
    "max": 25,
    "step": 1,
    "defaultValue": 15,
  },
};

export const poemWords = [
  "the", "library", "contains", "not", "books", 
  "but", "glaciers", 
  "the", "glaciers", "are", "upright",
  "silent",
  "as", "perfectly", "ordered", "as", "books", "would", "be",
  "but", "they", "are", "melted",
  "what", "would", "it", "be", "like",
  "to", "live", "in", "a", "library",
  "of", "melted", "books",
  "with", "sentences", "streaming", "over", "the", "floor",
  "and", "all", "the", "punctuation",
  "settled", "to", "the", "bottom", "as", "a", "residue",
  "it", "would", "be", "confusing",
  "unforgivable",
  "a", "great", "adventure"
];

// This type represents the parameter store structure
export type ParameterStore = {
  [K in keyof typeof numericParameterDefs]: number;
};

// Create initialization function here too
export function initParameterStore(): ParameterStore {
  // Initialize from default values in the parameter definitions
  const store = {} as ParameterStore;
  
  Object.entries(numericParameterDefs).forEach(([key, def]) => {
    store[key as keyof ParameterStore] = def.defaultValue;
  });
  
  return store;
}

// This function creates the p5 sketch
export function createSketch(parameterStore: ParameterStore) {
  let currentParams = parameterStore;
  

  
  return function sketch(p: p5) {
    let font: p5.Font;
    let startTime = p.millis();
    let foreground;
    let particleLayer;

    let blurShader;
    let fadeShader;
    interface SimpleParticle {
      pos: p5.Vector;
      vel: p5.Vector;
      acc: p5.Vector;
      prevPos: p5.Vector;
    }
    
    // Array to store particles
    let particles: SimpleParticle[] = [];

    // Create a new particle with vector properties
    function createParticle(x: number, y: number): SimpleParticle {
      const pos = p.createVector(x, y);
      return {
        pos: pos,
        vel: p.createVector(0, 0),
        acc: p.createVector(0, 0),
        prevPos: pos.copy()
      };
    }
    
    // Update particle physics
    function updateParticle(particle: SimpleParticle, flowAngle: number, updateVelocity: boolean = true): void {
      // Save previous position for drawing
      particle.prevPos.set(particle.pos);
      
      // Create a force vector from the flow field angle
      const force = p5.Vector.fromAngle(flowAngle);
      force.mult(parameterStore.particleForceStrength); // Force magnitude from parameters
      
      if (updateVelocity) {
        // Apply force to acceleration
        particle.acc.add(force);
        
        // Update velocity with acceleration
        particle.vel.add(particle.acc);
      
        // Limit velocity to prevent excessive speed - use parameter
        particle.vel.limit(parameterStore.particleMaxSpeed);
      }
      
      // Update position with velocity
      particle.pos.add(particle.vel);
      
      // Reset acceleration for next frame
      particle.acc.mult(0);
      
      // Handle edges by wrapping around
      if (particle.pos.x < 0) {
        particle.pos.x = p.width;
        particle.prevPos.x = 0;
      }
      if (particle.pos.x > p.width) {
        particle.pos.x = 0;
        particle.prevPos.x = p.width;
      }
      if (particle.pos.y < 0) {
        particle.pos.y = p.height;
        particle.prevPos.y = 0;
      }
      if (particle.pos.y > p.height) {
        particle.pos.y = 0;
        particle.prevPos.y = p.height;
      }
    }


    // Expose a method to update parameters
    (p as any).updateParameters = (newParams: ParameterStore) => {
      currentParams = newParams;
    };
   
    p.preload = function() {
      // can preload assets here...
      font = p.loadFont(
        new URL("/public/fonts/inconsolata.otf", import.meta.url).href
      );
    };
    


    p.setup = function() {
      // Keep the fixed dimensions - this is the actual size of your visualization
      p.createCanvas(1200, 600, p.P2D);
      foreground = p.createGraphics(1200, 600, p.P2D);
      foreground.textFont(font);
      // // Make sure we're using the right coordinate system
      // p.translate(-p.width/2, -p.height/2); // Move to top-left for image drawing
      
      // Fix any potential canvas styling issues
      const canvas = document.querySelector('.p5Canvas');
      if (canvas) {
        (canvas as any).style.margin = '0 auto';
        (canvas as any).style.display = 'block';
      }

      blurShader = (p as any).createFilterShader(blurFrag);
      console.log("blurShader", blurShader);

      fadeShader = (p as any).createFilterShader(fadeFrag);
      console.log("fadeShader", fadeShader);

      // draw a black background
      foreground.background("#000000FF");

      p.background("#FFFFFF");
      
    }
    

    let frameCount = 0;
    let prevTime = 0;
    let currentTime = 0;

    let wordCount = 0
    p.draw = function() {
      frameCount++;

      // Make comment match the actual value
      // const frameRate = 30; // Simulate 30fps
      let frameRate = 30
      const deltaTimePerFrame = 1000 / frameRate;
      const currentTime = frameCount * deltaTimePerFrame;

        
      // p.translate(-p.width/2, -p.height/2);

      let drawFrameInterval = Math.ceil(frameRate * currentParams.timeMultiplier);
      
      if (frameCount % drawFrameInterval == 0) {
        let clearProb = wordCount / parameterStore.maxWordCount;
        if (p.random() < clearProb) {
          foreground.background("#000000FF");
          wordCount = 0;
        }
        let wordIndex = Math.floor(p.random(0, poemWords.length));
        let word = poemWords[wordIndex];
        let textSize = parameterStore.textSize;
        // compute the bounding box of the text box
        let textBox = font.textBounds(word, 0, 0, textSize);
        console.log("textBox", textBox);
        let textBoxWidth = textBox["w"];
        let textBoxHeight = textBox["h"];


        // draw a red circle at a random position on the canvas
        let x = p.random(0, p.width - textBoxWidth);
        let y = p.random(0, p.height - textBoxHeight);
        // p.textFont(font);
        foreground.fill("#FFFFFF");
        // foreground.stroke("#FF0000");
        foreground.textSize(textSize);
        foreground.text(word, x, y + textBoxHeight);

        wordCount++;

        // console.log(x,y);

        // draw the foreground to the canvas

  
  
        
        // p.fill("#FF0000");
        // p.circle(x, y, 10);        
        // p.blendMode(p.ADD);
        // p.image(foreground, 0, 0);
  
      }
      else {
        // p.blendMode(p.ADD);
        // p.image(foreground, 0, 0);


      }
      p.blendMode(p.BLEND);
      fadeShader.setUniform("fadeStrength", parameterStore.particleTrailFadeStrength);
      p.filter(fadeShader);
      // p.filter(p.BLUR,1)
      // blurShader.setUniform("fadeStrength", 0.9998);
      // blurShader.setUniform("texelSize", [1.0, 0.0]);
      // p.filter(blurShader);
      // blurShader.setUniform("texelSize", [0.0, 1.0]);
      // p.filter(blurShader);

      // make sure there are exactly the right number of particles
      // Maximum number of particles - now from parameters
      while (particles.length > parameterStore.particleMaxCount) {
        particles.shift(); // Remove oldest particles if we have too many
      }

      while (particles.length < parameterStore.particleMaxCount) {
        particles.push(createParticle(p.random(0, p.width), p.random(0, p.height)));
      }

      // update the particles
      for (let i = 0; i < particles.length; i++) {
        // calculate the angle of the particle
        let noiseVector = parameterStore.particleNoiseStrength * p.noise(particles[i].pos.x, particles[i].pos.y, currentTime);
        let angle = -Math.PI / 2 + noiseVector * Math.PI;
//        let angle = p.map(noiseVector, -1, 1, 0, 2 * Math.PI);
        updateParticle(particles[i], angle);
      }

      // draw the particles
      for (let i = 0; i < particles.length; i++) {
        // console.log("drawing particle", particles[i].pos.x, particles[i].pos.y, particles[i]);

        let foregroundColor = foreground.get(particles[i].pos.x, particles[i].pos.y);
        // console.log("foregroundColor", foregroundColor);
        if (foregroundColor[0] > 0) {
          // console.log("drawing RED particle", particles[i].pos.x, particles[i].pos.y, foregroundColor);
          p.fill("#EEF8FC");
          p.circle(particles[i].pos.x, particles[i].pos.y, 3 * parameterStore.particleTrailWeight * 2);

        } else {
          // console.log("drawing white particle");
          p.fill("#092734");
          p.circle(particles[i].pos.x, particles[i].pos.y, parameterStore.particleTrailWeight);

        }
        p.noStroke();


      }



    }
    // console.log("blurShader", blurShader);




  };
}