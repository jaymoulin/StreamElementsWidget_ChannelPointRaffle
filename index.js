const Raffle = require('./raffle')
const sleep = require('./tools').sleep

let titleColor = `{titleColor}`,
    titleSize = `{titleSize}`,
    titleStyle = `font-weight: bold`,
    wheelAudioUrl = `{wheelAudioUrl}`,
    wheelSpinTimeMs = `{wheelSpinTimeMs}`,
    playText = `{playText}`,
    wonText = `{wonText}`,
    allowed = `{allowed}`;

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
    `{prize1}`,
    `{prize2}`,
    `{prize3}`,
    `{prize4}`,
    `{prize5}`,
    `{prize6}`,
    `{prize7}`,
    `{prize8}`,
    `{prize9}`,
    `{prize10}`,
    `{prize11}`,
    `{prize12}`,
    `{prize13}`,
    `{prize14}`,
    `{prize15}`,
    `{prize16}`,
    `{prize17}`,
    `{prize18}`,
    `{prize19}`,
    `{prize20}`,
    `{prize21}`,
    `{prize22}`,
    `{prize23}`,
    `{prize24}`,
    `{prize25}`,
    `{prize26}`,
    `{prize27}`,
    `{prize28}`,
    `{prize29}`,
    `{prize30}`,
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
                "nonce": "cpraffle" + CHANNEL_ID,
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
