const CryptoJS = require("crypto-js");

var E = {
    m: 256,
    d: function(r, t) {
        var e = JSON.parse(CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(r))),
            o = CryptoJS.enc.Hex.parse(e.salt),
            p = CryptoJS.enc.Hex.parse(e.iv),
            a = e.ciphertext,
            S = parseInt(e.iterations);
        S <= 0 && (S = 999);
        var i = this.m / 4,
            n = CryptoJS.PBKDF2(t, o, {
                hasher: CryptoJS.algo.SHA512,
                keySize: i / 8,
                iterations: S
            });
        let result = CryptoJS.AES.decrypt(a, n, {
            mode: CryptoJS.mode.CBC,
            iv: p
        })
        return result
    }
};

module.exports = {
    E
}