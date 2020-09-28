const EMPTY = {
    turn: 0,
    tribeOrder: ["xinxi", "imperius"],
    tribeToMove: 0,
    boardSize: [8, 8],
    tribes: [
        {
            name: "imperius",
            units: [],
        },
        {
            name: "xinxi",
            units: [],
        },
        {
            name: "bardur",
            units: [],
        },
        {
            name: "oumaji",
            units: [],
        },
    ],
    settings: {
        movements: {
            move: 2,
            attack: 2,
            any: 1,
        },
    },
};

let GameBoard;

$(function () {
    let cookie;
    try {
        cookie = Cookies.getJSON("game-setup");
        if (cookie === undefined) {
            Clear(true);
        } else {
            GameBoard = cookie;
        }
    } catch (error) {
        Clear(true);
    }

    function Click(event) {
        let id = $(this).attr("id");
        let rClick = event.which == 3;
        CellClick(id, rClick);
    }

    let lDown = false;
    let rDown = false;
    $(document.body)
        .mousedown((event) => {
            if (event.which === 3) {
                rDown = true;
            } else {
                lDown = true;
            }
        })
        .mouseup((event) => {
            lDown = false;
            rDown = false;
        })
        .contextmenu(() => false);

    function Hover(event) {
        if (lDown) {
            CellClick($(this).attr("id"), false);
        } else if (rDown) {
            CellClick($(this).attr("id"), true);
        }
        return false;
    }

    let template;
    for (let i = 7; i >= 0; i--) {
        for (let j = 0; j < 8; j++) {
            template = $($("#cell-template").html())
                .attr("id", "cell-" + i + j)
                .mousedown(Click)
                .mouseenter(Hover);
            $("#board").append(template);
        }
    }

    TribeOrder();
    DrawBoard();
});

const Capitalize = function (text) {
    return text.replace(/\b\w/g, (l) => l.toUpperCase());
};

function DrawBoard() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            $cell(i, j).image.attr("src", "../lib/img/blank.png");
            $cell(i, j).span.html("");
        }
    }

    for (const tribe of GameBoard.tribes) {
        for (const unit of tribe.units) {
            const loc = unit.location;
            $cell(loc[0], loc[1]).image.attr("src", "../lib/img/" + tribe.name + "/" + unit.type + ".png");
        }
    }
}

function CellClick(cellid, rightClick) {
    const loc = [$cell(cellid).x, $cell(cellid).y];
    const selectedTribe = $("#select-tribe").val();
    const selectedUnit = $("#select-unit").val();
    if (rightClick) {
        GameBoard = GameFuncs.removeUnitAt(GameBoard, loc);
    } else {
        if (GameFuncs.unitAt(GameBoard, loc) !== null) {
            GameBoard = GameFuncs.removeUnitAt(GameBoard, loc);
        }
        for (let tribe of GameBoard.tribes) {
            if (tribe.name === selectedTribe) {
                let unit = {
                    location: loc,
                    type: selectedUnit,
                    health: UNITS[selectedUnit][2],
                    isVet: false,
                    kills: 0,
                };
                tribe.units.push(unit);
                break;
            }
        }
    }
    SaveToCookie(true);
    DrawBoard();
}

function Copy() {
    $("#copy-box").show();
    $("#copy-box").val(JSONUtil.pack(GameBoard));
    $("#copy-box").select();
    $("#copy-box").focusout(function () {
        $("#copy-box").fadeOut();
    });
}

function Clear(skipConfirm) {
    if (!skipConfirm && !confirm("Are you sure you want to clear you current setup?")) return;
    Cookies.remove("game-setup");
    GameBoard = JSON.parse(JSON.stringify(EMPTY));
    DrawBoard();
    TribeOrder();
}

function ReturnToGameBoard() {
    SaveToCookie(false);
    window.top.location.href = "../singleplayer";
}

function SaveToCookie(doAsync) {
    Cookies.set(
        "game-setup",
        GameBoard,
        {
            expires: 30,
        },
        doAsync
    );
}

// Helper function for interacting with Cell DOM :ok_hand:
function $cell(x, y) {
    let cellID = "";
    if (typeof y == "undefined") {
        var num = x.split("-")[1];
        x = parseInt(num.charAt(0));
        var y = parseInt(num.charAt(1));
    }
    cellID = "#cell-" + x + y;
    let cell = $(cellID);
    let image = cell.find("img.cell-img");
    let span = cell.find("span.health-span");
    return {
        cell: cell,
        image: image,
        span: span,
        x: x,
        y: y,
    };
}

function TribeOrder(event) {
    function addTemplate(tribe, i) {
        let $template = $($("#tribe-order-template").html());
        let $select = $template.find("select");
        $select.change(TribeOrder);
        $select.val(tribe);
        $select.attr("id", "tribe-order-select-" + i);

        $("#tribe-order").append($template);
    }
    if (event === undefined) {
        const order = GameBoard.tribeOrder;

        $("#tribe-order").empty();
        $("#tribe-order").html("Tribe Turn Order:<br/>");
        for (let i = 0; i < order.length; i++) {
            const tribe = order[i];
            addTemplate(tribe, i);
        }
        const addRemoveHTML = "<br/><a href='javascript:TribeOrder(true)'>Add Tribe</a> " + "<a href='javascript:TribeOrder(false)'>Remove Tribe</a>";
        $("#tribe-order").append(addRemoveHTML);

        let previewString = 'Turn Order: <span style="font-weight: bold;">';
        for (let i = 0; i < order.length; i++) {
            const t = order[i];
            previewString += Capitalize(t);
            if (i + 1 < order.length) {
                previewString += " &gt; ";
            }
        }
        previewString += '</span> <a href="javascript:TribeOrderShowHide()">Edit</a>';
        $("#tribe-order-preview").html(previewString);

        SaveToCookie(true);
    } else if (typeof event == "boolean") {
        let order = GameBoard.tribeOrder;
        if (event) {
            order.push($($("#tribe-order-template").html()).find("select").val());
        } else {
            if (order.length > 1) {
                order.pop();
            }
        }
        TribeOrder();
    } else {
        let order = GameBoard.tribeOrder;
        let $select = $(event.target);
        let selectedVal = $select.val();
        let id = parseInt($select.attr("id").split("-")[3]);

        order[id] = selectedVal;

        TribeOrder();
    }
}

function DefaultBoard() {
    if (!confirm("Are you sure you want to clear you current setup?")) return;
    let DEFAULT =
        "𢉸𡲭蟍嗃𠘐髟淏𥬃𢌶𠦼監胇㮧藒殻㩀ꖈ𦫌嫝𣟽牘𧁤𣣞𧵡𤠃僦㰺梍𓆐𤜆𢝡醞冩㿤𢧘壙田恝𡎇𦮇𦤩珅䏚𢹵𣈨𦭴𠐳鷆鰱𓇳𡖆㭡𧁆𨓸𥕒暠𡐘𡭣𤽝殀𤇎暘𥨾𧮵𤊐𥒓𓎡𔔱馣欕𡆐䄸賺唕𥅟惊逆𣂬𦝈𤄽㳢𥐢𠺄娳𥋢消䔙𨓧廂迕𢞙䙡𓋐𦸴㪁𢮔𧔧𡃰𔐲蹟𢏺盿𤁉𢥇𧔩钊俻𢃏𣠒𤖒𤁌𦳕腖𠥆𡑉𧗞悬𡲽𣳦蒳𣞺誶餛𣠳𡲉𧀃𢼤𧊳槾喔𡨲朠喔𡨲朠喔𡨲朠𢚔𡨲枠尔𔗫𦡎茺濢𦹎茺濨𦥎茺濣顎垨𣫞𓌎穧𠦥𥞶勲䁿滆㺽𥌁𡉛𥘻𥃱𡮦𦔉𦨁㨓㠲𦂹吞偍𥣗𨏷㤗生ᕭ";
    Cookies.set("game-setup", DEFAULT);
    GameBoard = Cookies.getJSON("game-setup");
    DrawBoard();
    TribeOrder();
}
