const sleep = require('./tools').sleep

let shuffle = function (o) {
    for (let j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

class wheel {
    constructor(prize=[]) {
        this.angleCurrent= 0
        this.angleDelta= 0
        this.canvasContext= null;
        this.canvasElement= null;
        this.centerX= 300;
        this.centerY= 300;
        this.colorCache= [];
        this.downTime= 12000;
        this.frames= 0;
        this.maxSpeed= Math.PI / 16;
        this.segments= prize;
        this.size= 290;
        this.spinStart= 0;
        this.timerDelay= 7;
        this.timerHandle= 0
        this.upTime= 1000;
    }

    spin() {
        // Start the wheel only if it's not already spinning
        if (this.timerHandle === 0) {
            this.spinStart = new Date().getTime();
            this.maxSpeed = Math.PI / (16 + (Math.random() * 10)); // Randomly vary how hard the spin is
            this.frames = 0;
            this.timerHandle = setInterval(this.onTimerTick, this.timerDelay);
            this.canvasElement.dispatchEvent(new Event('wheel-start'));
        }
    }

    onTimerTick() {
        this.frames++;
        this.draw();

        let duration = (new Date().getTime() - this.spinStart);
        let progress = 0;
        let finished = false;

        if (duration < this.upTime) {
            progress = duration / this.upTime;
            this.angleDelta = this.maxSpeed * Math.sin(progress * Math.PI / 2);
        } else {
            progress = duration / this.downTime;
            this.angleDelta = this.maxSpeed * Math.sin(progress * Math.PI / 2 + Math.PI / 2);
            if (progress >= 1) {
                finished = true;
            }
        }

        this.angleCurrent += this.angleDelta;
        while (this.angleCurrent >= Math.PI * 2)
            // Keep the angle in a reasonable range
            this.angleCurrent -= Math.PI * 2;

        if (finished) {
            clearInterval(this.timerHandle);
            this.timerHandle = 0;
            this.angleDelta = 0;
            let i = this.segments.length - Math.floor((this.angleCurrent / (Math.PI * 2)) * this.segments.length) - 1;
            this.canvasElement.dispatchEvent(new CustomEvent('wheel-finished', {detail:this.segments[i]}));
        }
    }

    init(spinTime) {
        try {
            this.downTime = spinTime;
            this.initWheel();
            this.initCanvas();
            this.draw();
        } catch (exceptionData) {
            console.error('Wheel is not loaded ' + exceptionData);
        }
    }

    initCanvas() {
        let canvas = document.getElementById('canvas');
        this.canvasElement = canvas;
        this.canvasContext = canvas.getContext('2d');
    }

    initWheel() {
        shuffle(spectrum);
    }

    update() {
        // Ensure we start mid way on a item
        let r = Math.floor(Math.random() * this.segments.length);
        //let r = 0;
        this.angleCurrent = ((r + 0.5) / this.segments.length) * Math.PI * 2;

        let segments = this.segments;
        let len = segments.length;
        let colorLen = spectrum.length;

        let colorCache = [];
        for (let i = 0; i < len; i++) {
            let color = spectrum[i % colorLen];
            colorCache.push(color);
        }
        this.colorCache = colorCache;
        this.draw();
    }

    draw() {
        this.clear();
        this.drawWheel();
        this.drawNeedle();
    }

    clear() {
        let ctx = this.canvasContext;
        ctx.clearRect(0, 0, 1600, 800);
    }

    drawNeedle() {
        let ctx = this.canvasContext;
        let centerX = this.centerX;
        let centerY = this.centerY;
        let size = this.size;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.fileStyle = '#ffffff';

        ctx.beginPath();

        ctx.moveTo(centerX + size - 40, centerY);
        ctx.lineTo(centerX + size + 20, centerY - 10);
        ctx.lineTo(centerX + size + 20, centerY + 10);
        ctx.closePath();

        ctx.stroke();
        ctx.fill();

        // Which segment is being pointed to?
        let i = this.segments.length - Math.floor((this.angleCurrent / (Math.PI * 2)) * this.segments.length) - 1;

        // Now draw the winning name
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.font = '2em Arial';
        ctx.fillText(this.segments[i], centerX + size + 25, centerY);
    }

    drawSegment(key, lastAngle, angle) {
        let ctx = this.canvasContext;
        let centerX = this.centerX;
        let centerY = this.centerY;
        let size = this.size;
        let value = this.segments[key];

        ctx.save();
        ctx.beginPath();

        // Start in the centre
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, size, lastAngle, angle, false); // Draw a arc around the edge
        ctx.lineTo(centerX, centerY); // Now draw a line back to the centre
        // Clip anything that follows to this area
        //ctx.clip(); // It would be best to clip, but we can double performance without it
        ctx.closePath();

        ctx.fillStyle = this.colorCache[key];
        ctx.fill();
        ctx.stroke();

        // Now draw the text
        ctx.save(); // The save ensures this works on Android devices
        ctx.translate(centerX, centerY);
        ctx.rotate((lastAngle + angle) / 2);

        ctx.fillStyle = '#000000';
        ctx.fillText(value.substr(0, 20), size / 2 + 20, 0);
        ctx.restore();

        ctx.restore();
    }

    drawWheel() {
        let ctx = this.canvasContext;

        let angleCurrent = this.angleCurrent;
        let lastAngle = angleCurrent;

        let len = this.segments.length;

        let centerX = this.centerX;
        let centerY = this.centerY;
        let size = this.size;

        let PI2 = Math.PI * 2;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = '1.4em fantasy';

        for (let i = 1; i <= len; i++) {
            let angle = PI2 * (i / len) + angleCurrent;
            this.drawSegment(i - 1, lastAngle, angle);
            lastAngle = angle;
        }
        // Draw a center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, PI2, false);
        ctx.closePath();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.fill();
        ctx.stroke();

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, PI2, false);
        ctx.closePath();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
    }
}

let spectrum = ['#0074D9', '#2ECC40', '#FFDC00', '#FF4136', '#FF851B', '#B10DC9'];

class Raffle {
    constructor(settings, prizes) {
        this.settings = settings;
        this.prizes = prizes;
        this.audioUrl = settings.wheelAudioUrl;
        this.container = document.getElementById('wheel');
        this.winner = document.getElementById('wheel-winner');
        this.player = null
        this.wheel = new wheel(this.prizes)

        this.init();
    }

    init() {
        this.wheel.init(this.settings.spinTime);
        this.wheel.update();
        this.wheel.canvasElement.addEventListener('wheel-finished', this.wheelFinishedEvent.bind(this));
        this.winner.setAttribute("style", `color: ${this.settings.titleColor};font-size: ${this.settings.titleSize};${this.settings.titleStyle}`);

        setTimeout(function () {
            window.scrollTo(0, 1);
        }, 0);

        return this;
    }

    _replaceAll(text, find, replaceWith) {
        let re = new RegExp(find, "g");
        return text.replace(re, replaceWith);
    }

    canHandle(message) {
        return (
            message &&
            message.type &&
            message.type === 'reward-redeemed' &&
            message['data'] &&
            message['data']['redemption'] &&
            message['data']['redemption']['user'] &&
            message['data']['redemption']['user']['display_name'] &&
            message['data']['redemption']['reward'] &&
            message['data']['redemption']['reward']['id'] &&
            this.settings.allowed == message['data']['redemption']['reward']['id'] // do handle a specific reward
        )
    }

    async handle(message) {
        let reward = message.data['redemption']['reward'];
        this.player = message.data['redemption']['user']['display_name'];
        this.winner.innerText = this._replaceAll(this.settings.playText, '{user}', this.player)
        this.winner.innerText = this._replaceAll(this.winner.innerText,'{price}', reward['cost'])
        this.container.setAttribute("class", "");
        console.log("Playing audio", this.audioUrl);
        try {
            let audio = new Audio();
            audio.src = this.audioUrl;
            audio.volume = 0.5;
            audio.play();
            new Promise((res) => {
                audio.onended = res;
                audio.onerror = (e) => {
                    console.log(e);
                    res()
                };
            });
        } catch (e) {
            console.log("Audio playback error:", e);
        }
        await sleep(1000);
        wheel.spin();
    }

    async wheelFinishedEvent (event) {
        this.winner.innerText = this._replaceAll(this.settings.wonText, '{user}', this.player)
        this.winner.innerText = this._replaceAll(this.winner.innerText,'{reward}', event.detail)
        await sleep(3000);
        this.container.setAttribute("class", "hide");
    }
}

module.exports = Raffle