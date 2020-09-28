const JSONUtil = {
    pack: function (data) {
        return Base65536.encode(pako.deflate(JSON.stringify(data)));
    },

    unpack: function (str) {
        return JSON.parse(pako.inflate(Base65536.decode(str), { to: "string" }));
    },
};

let Cookies = (function () {
    let _cookie = Cookies.noConflict();
    let ret = {};

    ret.set = function (name, value, options, doAsync) {
        function set() {
            if (typeof value != "string") {
                value = JSONUtil.pack(value);
            }
            _cookie.set(name, value, options);
        }
        if (doAsync !== undefined && doAsync) {
            setTimeout(set, 0);
        } else {
            set();
        }
    };

    ret.getJSON = function (name) {
        let val = _cookie.get(name);
        if (val === undefined) {
            return undefined;
        }
        try {
            return JSONUtil.unpack(val);
        } catch (error) {
            throw name;
        }
    };

    ret.remove = function (name, args) {
        _cookie.remove(name, args);
    };
    return ret;
})();
