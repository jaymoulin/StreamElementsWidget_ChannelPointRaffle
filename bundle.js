(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Raffle = require('./raffle')
const sleep = require('./tools').sleep

let titleColor = '{titleColor}',
    titleSize = '{titleSize}',
    titleStyle = 'font-weight: bold',
    wheelAudioUrl = '{wheelAudioUrl}',
    wheelSpinTimeMs = '{wheelSpinTimeMs}',
    playText = '{playText}',
    wonText = '{wonText}',
    allowed = '{allowed}';

let SETTINGS = {
    titleColor: titleColor,
    titleSize: titleSize + 'px',
    titleStyle: titleStyle,
    wheelAudioUrl: wheelAudioUrl,
    spinTime: wheelSpinTimeMs,
    allowed: allowed,
    wonText: wonText,
    playText: playText,
};

let Prizes = [
    '{prize1}',
    '{prize2}',
    '{prize3}',
    '{prize4}',
    '{prize5}',
    '{prize6}',
    '{prize7}',
    '{prize8}',
    '{prize9}',
    '{prize10}',
    '{prize11}',
    '{prize12}',
    '{prize13}',
    '{prize14}',
    '{prize15}',
    '{prize16}',
    '{prize17}',
    '{prize18}',
    '{prize19}',
    '{prize20}',
    '{prize21}',
    '{prize22}',
    '{prize23}',
    '{prize24}',
    '{prize25}',
    '{prize26}',
    '{prize27}',
    '{prize28}',
    '{prize29}',
    '{prize30}',
]

window.addEventListener('onWidgetLoad', function (obj) {
    const CHANNEL_ID = obj.detail.channel.providerId
    const loadedModules = [
        new Raffle(SETTINGS, Prizes.filter(value => value.length)),
    ]

    let ws = undefined;
    let pong = false;
    let interval = false;

    function connect() {
        ws = new WebSocket("wss://pubsub-edge.twitch.tv");
        listen();
    }

    function disconnect() {
        if (interval) {
            clearInterval(interval);
            interval = false;
        }
        ws.close();
    }

    function listen() {
        ws.onmessage = (a) => {
            let o = JSON.parse(a.data);
            switch (o.type) {
                case "PING":
                    ws.send(JSON.stringify({
                        "type": "PONG"
                    }));
                    break;
                case "PONG":
                    pong = true;
                    break;
                case "RECONNECT":
                    disconnect();
                    connect();
                    break;
                case "MESSAGE":
                    switch (o.data['topic']) {
                        case `community-points-channel-v1.${CHANNEL_ID}`:
                            let msg = JSON.parse(o.data.message);
                            console.log(msg);
                            loadedModules.forEach(module => module.canHandle(msg) && module.handle(msg))
                            break;
                    }
                    break;
            }
        }
        ws.onopen = () => {
            ws.send(JSON.stringify({
                "type": "LISTEN",
                "nonce": "pepega",
                "data": {"topics": ["community-points-channel-v1." + CHANNEL_ID], "auth_token": ""}
            }));
            interval = setInterval(async () => {
                ws.send(JSON.stringify({
                    "type": "PING"
                }));
                await sleep(5000);
                if (pong) {
                    pong = false;
                    return
                }
                pong = false;
                disconnect();
                connect();
            }, 5 * 60 * 1000)
        }
    }

    connect();
})

},{"./raffle":2,"./tools":3}],2:[function(require,module,exports){
const sleep = require('./tools').sleep

let shuffle = function (o) {
    for (let j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

const wheel = {
    angleCurrent: 0,
    angleDelta: 0,
    canvasContext: null,
    canvasElement: null,
    centerX: 300,
    centerY: 300,
    colorCache: [],
    downTime: 12000,
    frames: 0,
    maxSpeed: Math.PI / 16,
    segments: [],
    size: 290,
    spinStart: 0,
    timerDelay: 7,
    timerHandle: 0,
    upTime: 1000,

    spin: function () {
        // Start the wheel only if it's not already spinning
        if (wheel.timerHandle === 0) {
            wheel.spinStart = new Date().getTime();
            wheel.maxSpeed = Math.PI / (16 + (Math.random() * 10)); // Randomly vary how hard the spin is
            wheel.frames = 0;
            wheel.timerHandle = setInterval(wheel.onTimerTick, wheel.timerDelay);
            wheel.canvasElement.dispatchEvent(new Event('wheel-start'));
        }
    },

    onTimerTick: function () {
        wheel.frames++;
        wheel.draw();

        let duration = (new Date().getTime() - wheel.spinStart);
        let progress = 0;
        let finished = false;

        if (duration < wheel.upTime) {
            progress = duration / wheel.upTime;
            wheel.angleDelta = wheel.maxSpeed * Math.sin(progress * Math.PI / 2);
        } else {
            progress = duration / wheel.downTime;
            wheel.angleDelta = wheel.maxSpeed * Math.sin(progress * Math.PI / 2 + Math.PI / 2);
            if (progress >= 1) {
                finished = true;
            }
        }

        wheel.angleCurrent += wheel.angleDelta;
        while (wheel.angleCurrent >= Math.PI * 2)
            // Keep the angle in a reasonable range
            wheel.angleCurrent -= Math.PI * 2;

        if (finished) {
            clearInterval(wheel.timerHandle);
            wheel.timerHandle = 0;
            wheel.angleDelta = 0;
            let i = wheel.segments.length - Math.floor((wheel.angleCurrent / (Math.PI * 2)) * wheel.segments.length) - 1;
            wheel.canvasElement.dispatchEvent(new CustomEvent('wheel-finished', {detail:wheel.segments[i]}));
        }
    },

    init: function (spinTime) {
        try {
            wheel.downTime = spinTime;
            wheel.initWheel();
            wheel.initCanvas();
            wheel.draw();
        } catch (exceptionData) {
            console.error('Wheel is not loaded ' + exceptionData);
        }
    },

    initCanvas: function () {
        let canvas = document.getElementById('canvas');
        wheel.canvasElement = canvas;
        wheel.canvasContext = canvas.getContext('2d');
    },

    initWheel: function () {
        shuffle(spectrum);
    },

    update: function () {
        // Ensure we start mid way on a item
        let r = Math.floor(Math.random() * wheel.segments.length);
        //let r = 0;
        wheel.angleCurrent = ((r + 0.5) / wheel.segments.length) * Math.PI * 2;

        let segments = wheel.segments;
        let len = segments.length;
        let colorLen = spectrum.length;

        let colorCache = [];
        for (let i = 0; i < len; i++) {
            let color = spectrum[i % colorLen];
            colorCache.push(color);
        }
        wheel.colorCache = colorCache;
        wheel.draw();
    },

    draw: function () {
        wheel.clear();
        wheel.drawWheel();
        wheel.drawNeedle();
    },

    clear: function () {
        let ctx = wheel.canvasContext;
        ctx.clearRect(0, 0, 1600, 800);
    },

    drawNeedle: function () {
        let ctx = wheel.canvasContext;
        let centerX = wheel.centerX;
        let centerY = wheel.centerY;
        let size = wheel.size;

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
        let i = wheel.segments.length - Math.floor((wheel.angleCurrent / (Math.PI * 2)) * wheel.segments.length) - 1;

        // Now draw the winning name
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.font = '2em Arial';
        ctx.fillText(wheel.segments[i], centerX + size + 25, centerY);
    },

    drawSegment: function (key, lastAngle, angle) {
        let ctx = wheel.canvasContext;
        let centerX = wheel.centerX;
        let centerY = wheel.centerY;
        let size = wheel.size;
        let value = wheel.segments[key];

        ctx.save();
        ctx.beginPath();

        // Start in the centre
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, size, lastAngle, angle, false); // Draw a arc around the edge
        ctx.lineTo(centerX, centerY); // Now draw a line back to the centre
        // Clip anything that follows to this area
        //ctx.clip(); // It would be best to clip, but we can double performance without it
        ctx.closePath();

        ctx.fillStyle = wheel.colorCache[key];
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
    },

    drawWheel: function () {
        let ctx = wheel.canvasContext;

        let angleCurrent = wheel.angleCurrent;
        let lastAngle = angleCurrent;

        let len = wheel.segments.length;

        let centerX = wheel.centerX;
        let centerY = wheel.centerY;
        let size = wheel.size;

        let PI2 = Math.PI * 2;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = '1.4em fantasy';

        for (let i = 1; i <= len; i++) {
            let angle = PI2 * (i / len) + angleCurrent;
            wheel.drawSegment(i - 1, lastAngle, angle);
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
};

let spectrum = ['#0074D9', '#2ECC40', '#FFDC00', '#FF4136', '#FF851B', '#B10DC9'];

class Raffle {
    constructor(settings, prizes) {
        this.settings = settings;
        this.prizes = prizes;
        this.audioUrl = settings.wheelAudioUrl;
        this.container = document.getElementById('wheel');
        this.winner = document.getElementById('wheel-winner');
        this.player = null

        this.init();
    }

    init() {
        wheel.segments = this.prizes;
        wheel.init(this.settings.spinTime);
        wheel.update();
        wheel.canvasElement.addEventListener('wheel-finished', this.wheelFinishedEvent.bind(this));
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
},{"./tools":3}],3:[function(require,module,exports){
module.exports = {
    sleep: function (milliseconds) {
        return new Promise(res => {
            setTimeout(res, milliseconds)
        });
    }
}
},{}]},{},[1]);
