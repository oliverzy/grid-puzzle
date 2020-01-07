// 参考实现：https://editor.p5js.org/codingtrain/sketches/O2M0SO-WO
import _ from 'lodash';
import * as PIXI from 'pixi.js';
import randomColor from 'randomcolor';

const gravity = {x: 0, y: 0.2};

class Particle {
  constructor(g, x, y, color, firework) {
    this.g = g;
    this.x = x;
    this.y = y;
    this.color = color;
    this.lifespan = 255;
    this.firework = firework;
    if (firework)
      this.vel = {x: 0, y: _.random(-15,-10)};
    else {
      const radians = _.random(0, Math.PI*2);
      const length = _.random(2, 10);
      this.vel = {x: Math.cos(radians)*length, y: Math.sin(radians)*length};
    }

    this.acc = {x:0, y:0};
  }

  done() {
    return this.lifespan < 0;
  }

  applyForce(force) {
    this.acc.x = force.x;
    this.acc.y = force.y;
  }

  update() {
    if (!this.firework) {
      this.vel.x *= 0.9;
      this.vel.y *= 0.9;
      this.lifespan -= 4;
    }

    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;

    this.x += this.vel.x;
    this.y += this.vel.y;
    this.acc = {x: 0, y: 0};
  }

  show() {
    this.g.beginFill(this.color);
    this.g.drawCircle(this.x, this.y, this.firework ? 6 : 3);
    this.g.endFill();
    //console.log(this.x, this.y);
  }
}

class Firework {
  constructor(g, width, height) {
    this.g = g;
    this.color = PIXI.utils.string2hex(randomColor({luminosity: 'light'}));
    this.firework = new Particle(g, _.random(0, width), height, this.color, true);
    this.exploded = false;
    this.particles = [];
  }

  done() {
    return this.exploded && this.particles.length === 0;
  }

  update() {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();
      if (this.firework.vel.y >= 0) {
        this.exploded = true;
        this.explode();
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();

      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
  }

  explode() {
    for (let i = 0; i < 100; i++) {
      const p = new Particle(this.g, this.firework.x, this.firework.y, this.color, false);
      this.particles.push(p);
    }
  }

  show() {
    if (!this.exploded) {
      this.firework.show();
    }

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].show();
    }
  }
}

export function makeFireworks(app) {
  const graphic = new PIXI.Graphics();
  const fireworks = [];

  function play() {
    //console.log('放烟花');
    app.stage.addChild(graphic);
    app.ticker.add(update);
  }

  function stop() {
    //console.log('结束放烟花');
    app.ticker.remove(update);
    app.stage.removeChild(graphic);
  }

  function update() {
    graphic.clear();
    graphic.beginFill(0, 0.5);
    graphic.drawRect(0, 0, app.screen.width, app.screen.height);
    graphic.endFill();
    if (_.random(0, 100) < 3)
      fireworks.push(new Firework(graphic, app.screen.width, app.screen.height))

    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].show();

      if (fireworks[i].done()) {
        fireworks.splice(i, 1);
      }
    }
  }

  return {
    play,
    stop
  }
}
