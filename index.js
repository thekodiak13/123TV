const { simpleGrab, fullGrab } = require('./utils/grabber');
const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express()
const ip = "192.168.1.11";
const port = 3000;

const customLog = (msg) => {
    let date = new Date()
    console.log(`[${date.toLocaleString()}] ${msg}`)
}

app.get('/', function (req, res) {
    customLog("/");
    res.send('123TV Proxy Server')
})

app.get('/playlist.m3u', function (req, res) {
    customLog("/playlist.m3u");
    fs.readFile('./channelInfo.txt', 'utf8', function (err, data) {
        if (err) throw err;
        let m3u = "#EXTM3U\n";
        let lines = data.split("\n");
        const requestedUrl = req.protocol + '://' + req.get('Host');
        lines.forEach(line => {
            line = line.replace(/\r?\n|\r/g, "");
            let parts = line.split(" | ");
            let url =  `${requestedUrl}/play/${parts[1]}.m3u8`;
            m3u += `#EXTINF:-1 tvg-name="${parts[0]}" tvg-logo="${parts[2]}" group-title="123TV", ${parts[0]}\n${url}\n`;
        });
        res.send(m3u);
    });
})

app.get('/play/:id.m3u8', function (req, res) {
    const id = req.params.id;
    customLog(`/play/${id}.m3u8`);
    const url = `http://123tv.live/watch/${id}/`
    let headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
        'Referer': 'http://live94today.com/'
    }
    axios.get(url, {headers: headers})
        .then(response => {
            const match = /src="(.*?)\?embed=true"/.exec(response.data);
            if (match) {
                simpleGrab(match[1], headers)
                .then(token => {
                    res.redirect(`/playlist.m3u8?token=${token}`);
                });
            } else {
                fullGrab(url, headers)
                .then(token => {
                    res.redirect(`/playlist.m3u8?token=${token}`);
                })
                .catch(err => {
                    console.log(err);
                });
            }
        });
})

app.get('/playlist.m3u8', function (req, res) {
    customLog("/playlist.m3u8");
    const token = req.query.token;
    if (!token) { res.send("Token Where?"); return; }
    const data = JSON.parse(Buffer.from(token, 'base64').toString('ascii'));
    let url = data.url;
    axios.get(url, {headers: data.headers})
        .then(response => {
            let resp = "";
            resp = response.data;
            if (data.type == "s") {
                resp = resp.replace(/https/g, "/chunk.ts?type=s&url=https");
                resp = resp.replace(/\/key/g, "/AES.key?url=http://hls.123tv.live/key");
            } else {
                const baseURL = url.split("chunks.m3u8")[0];
                resp = resp.replace(/l_/g, `/chunk.ts?type=f&url=${baseURL}l_`);
            }
            res.send(resp);
        })
        .catch(err => {
            console.log(err);
        });
})

app.get('/chunk.ts', function (req, res) {
    customLog("/chunk.ts");
    const url = req.query.url;
    const type = req.query.type;
    if (!url) { res.send("URL Where?"); return; }
    if (!type) { res.send("Type Where?"); return; }
    let headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36"};
    headers = {...headers, "Accept-Encoding": "gzip, deflate, br"};

    // Set Headers based on type
    if (type == "s") {headers = {...headers, "Referer": "http://azureedge.xyz/"};}
    else {headers = {...headers, "Referer": "http://123tv.live/"};}

    // Return bytes
    axios({
        method: 'get',
        url: url,
        headers: headers,
        responseType: 'arraybuffer'
    }).then(response => {
        res.type('ts');
        res.end(Buffer.from(response.data, 'binary'));
    }).catch(error => {
        console.log(error);
    });
})

app.get('/AES.key', function (req, res) {
    customLog("/AES.key");
    const url = req.query.url;
    if (!url) { res.send("URL Where?"); return; }
    let headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36"};
    headers = {...headers, "Referer": "http://azureedge.xyz/"};
    axios({
        method: 'get',
        url: url,
        headers: headers,
        responseType: 'arraybuffer'
    }).then(response => {
        res.type('key');
        res.end(Buffer.from(response.data, 'binary'));
    }).catch(error => {
        console.log(error);
    });
})

console.log(`Listening on http://${ip}:${port}`);
console.log(`Playlist M3U: http://${ip}:${port}/playlist.m3u`);
app.listen(port, ip)