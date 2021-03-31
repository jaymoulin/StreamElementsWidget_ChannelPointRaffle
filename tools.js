module.exports = {
    sleep: function (milliseconds) {
        return new Promise(res => {
            setTimeout(res, milliseconds)
        });
    }
}