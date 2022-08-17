const { hex2a } = require('./common');
const { E } = require('./decrypt');
const axios = require('axios');

const simpleGrab = async (url, headers) => {
    const response = await axios.get(url, {headers: headers});
    headers = {...headers, 'Referer': url};
    const respData = {url: response.data, headers: headers, type: "s"};
    return Buffer.from(JSON.stringify(respData)).toString('base64');
} 

const fullGrab = async (url, headers) => {
    let response = await axios.get(url, {headers: headers});
    let code = response.data.split("var post_id = parseInt($('#'+'v'+'i'+'d'+'eo'+'-i'+'d').val());")[1];
    code = code.split("var options")[0];
    code = code.replace(/\$\(document\).ready\(function\(\)\{/g, "");
    let vars = code.match(/var\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+);/g);
    let var2 = vars[1].split("=")[0].trim();
    var2 = var2.split(" ")[1];
    code = code.replace(/\.indexOf\('get.123tv.live\/channel\/'\)/g, "");
    let result = eval(`${code} ;${var2}();`).split("?");
    let hlsurl = hex2a(result[0]);
    let query = result[1];
    hlsurl = hlsurl + "?" + query;
    response = await axios.get(hlsurl, {headers: headers});
    const respData = {url: response.data[0]["file"].replace("playlist.m3u8", "chunks.m3u8"), headers: headers, type: "f"};
    return Buffer.from(JSON.stringify(respData)).toString('base64');
}

module.exports = {
    simpleGrab,
    fullGrab
}