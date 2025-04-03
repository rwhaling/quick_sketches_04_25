import p5 from "p5";
import blurFrag from './blur.frag?raw'

// Parameter definitions moved from main.tsx to here
export const numericParameterDefs = {
  "timeMultiplier": {
    "min": 0.001,
    "max": 1.0,
    "step": 0.001,
    "defaultValue": 0.265, 
  },
  "circleSizeMin": {
    "min": 0,
    "max": 100,
    "step": 1,
    "defaultValue": 10,
  },
  "circleSizeMaxInc": {
    "min": 0,
    "max": 50,
    "step": 1,
    "defaultValue": 50,
  },
  "transparencyStrength": {
    "min": 0,
    "max": 255,
    "step": 1,
    "defaultValue": 1,
  },
  "echoDelay": {
    "min": 0,
    "max": 150,
    "step": 1,
    "defaultValue":14,
  },
  "echoCount": {
    "min": 0,
    "max": 100,
    "step": 3,
    "defaultValue": 5,
  }
};

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
   
    // Expose a method to update parameters
    (p as any).updateParameters = (newParams: ParameterStore) => {
      currentParams = newParams;
    };

    let blurShader;
    let mainBlurShader;
   
    p.preload = function() {
      // can preload assets here...
      // font = p.loadFont(
      //   new URL("/public/fonts/inconsolata.otf", import.meta.url).href
      // );
    };
    
    let buffer;

    p.setup = function() {
      // Keep the fixed dimensions - this is the actual size of your visualization
      p.createCanvas(600, 600, p.WEBGL);
      buffer = p.createGraphics(600, 600, p.WEBGL);
      console.log("loading blurFrag");
      console.log(blurFrag);
      blurShader = (buffer as any).createFilterShader(blurFrag);
      // mainBlurShader = (p as any).createFilterShader(blurFrag);
      
      // Make sure we're using the right coordinate system
      // p.translate(-p.width/2, -p.height/2); // Move to top-left for image drawing
      
      // Fix any potential canvas styling issues
      const canvas = document.querySelector('.p5Canvas');
      if (canvas) {
        (canvas as any).style.margin = '0 auto';
        (canvas as any).style.display = 'block';
      }

      // draw a black background
      // buffer.background("#000000");
      
    }
    

    let frameCount = 0;
    let prevTime = 0;

    let circles = [];

    p.draw = function() {
      frameCount++;

      // Make comment match the actual value
      // const frameRate = 30; // Simulate 30fps
      let frameRate = 30
      const deltaTimePerFrame = 1000 / frameRate;
      const currentTime = frameCount * deltaTimePerFrame;

        
      p.translate(-p.width/2, -p.height/2);
      // buffer.translate(-p.width/2, -p.height/2);

      // draw a black transparentrectangle over the whole canvas
      let alphaHex = Math.floor(currentParams.transparencyStrength).toString(16).padStart(2, '0');

      buffer.fill("#000000" + alphaHex);
      buffer.rect(-p.width / 2, -p.height / 2, p.width * 2, p.height * 2);

      let drawFrameInterval = Math.ceil(frameRate * currentParams.timeMultiplier);

      // draw the circles
      circles.forEach(circle => {
        if (circle.frame + currentParams.echoDelay == frameCount) {
          console.log("drawing reflectedcircle:", circle);
          let reflected_x = -1 * circle.x;
          let echo_color = "#4422FF"
          buffer.noStroke();
          buffer.fill(echo_color);
          let x = reflected_x;
          let y = circle.y;
          buffer.circle(x, y, circle.size);
          circle.echoCount++;
          circle.x = reflected_x;
          circle.frame = frameCount;
        }
      });

      // remove circles that have reached the echo count
      circles = circles.filter(circle => circle.echoCount < currentParams.echoCount);

      // apply the blur shader
      buffer.filter(blurShader);
      // p.filter(mainBlurShader);

      if (frameCount % drawFrameInterval == 0) {        
        // draw a red circle at a random position on the canvas
        let circleSize = p.random(currentParams.circleSizeMin, currentParams.circleSizeMin + currentParams.circleSizeMaxInc);
        let x = p.random(circleSize, p.width / 2 - circleSize);
        let y = p.random(circleSize, p.height - circleSize);
        y -= p.height / 2;
        buffer.noStroke();
        buffer.fill("#4422FF");
        buffer.circle(x, y, circleSize);     
        circles.push({x:x, y:y, size: circleSize, frame: frameCount, echoCount: 1});
        console.log("drew circle:", circles[circles.length - 1]);

        let x2 = -x;
        let y2 = -y;
        buffer.circle(x2, y2, circleSize);
        circles.push({x:x2, y:y2, size: circleSize, frame: frameCount, echoCount: 1});
        console.log("drew circle:", circles[circles.length - 1]);
      }


      // composite the buffer over the main canvas
      p.imageMode(p.CORNER);

      // p.image(buffer, -p.width /2, -p.height /2, p.width * 2, p.height * 2);
      p.image(buffer, 0, 0, p.width, p.height);

    }

  };
}