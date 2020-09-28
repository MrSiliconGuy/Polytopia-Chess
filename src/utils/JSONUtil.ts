const base65536 = require("base65536");
const pako = require("pako");

export function pack(data: any) {
    return base65536.encode(pako.deflate(JSON.stringify(data)));
}

export function unpack(str: any) {
    return JSON.parse(
        pako.inflate(base65536.decode(str), {
            to: "string",
        })
    );
}
