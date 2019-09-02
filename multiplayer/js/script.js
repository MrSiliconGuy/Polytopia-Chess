"use-strict";
// Yea, I'm sorry the code is very spaghetti

const DEBUG = false;

var GameBoard;
let SelectedLoc = null;
// For very specific case
let VetLoc = null;

$(document).ready(function () {
    // For now just do empty setup
    GameBoard = GameFuncs.getEmptySetup();

    for (let i = 7; i >= 0; i--) {
        for (let j = 0; j < 8; j++) {
            template = $($("#cell-template").html()).attr("id", "cell-" + i + j);
            $("#board").append(template);
        }
    }
    Display.UpdateDisplay();
    
    // Deleteable once finished
    // if (DEBUG) {
    //     Connection.CreateClick();
    // }
});
$(document).keyup(function (e) {
    // Enter (Turn end)
    if (e.keyCode == 13) {
        EndTurn();
    }
    // Escape 
    else if (e.keyCode == 27) {
        DeSelect();
    }
});


const Capitalize = text => text.replace(/\b\w/g, l => l.toUpperCase());

const Display = {
    // draw - functions directly related to drawing things on the HTML display
    UpdateDisplay: function () {
        Display.DrawGameInfo();
        Display.DrawBoard();
        Display.DrawUnitBox(null);
    },

    DrawGameInfo: function () {
        $("#game-info-turn").html(GameBoard.turn);
        $("#game-info-toMove").html(Capitalize(GameBoard.tribeOrder[GameBoard.tribeToMove]));
        $("#game-info-moves").html(GameBoard.movements.move < 0 ? "Unlimited" : GameBoard.movements.move);
        $("#game-info-attacks").html(GameBoard.movements.attack < 0 ? "Unlimited" : GameBoard.movements.attack);
        $("#game-info-any").html(GameBoard.movements.any < 0 ? "Unlimited" : GameBoard.movements.any);
    },

    DrawUnitBox: function (unit, isFriendly) {
        if (unit === null) {
            $("#unit-box").hide();
        } else {
            const unitTribe = GameFuncs.unitAtTribe(GameBoard, unit.location);

            $("#unit-box").show();
            if (isFriendly) {
                const actionsLeft = GameFuncs.unitHasActions(GameBoard, unit);
                $("#unit-actions").show();
                if (actionsLeft && myTurn) {
                    $("#unit-action-recover").show();
                    if (GameFuncs.unitCanRecover(GameBoard, unit)) {
                        $("#unit-action-recover").removeClass("cell-dis");
                    } else {
                        $("#unit-action-recover").addClass("cell-dis");
                    }
                } else {
                    $("#unit-action-recover").hide();
                }
                if (actionsLeft && myTurn && GameFuncs.unitCanHeal(GameBoard, unit)) {
                    $("#unit-action-heal").show();
                } else {
                    $("#unit-action-heal").hide();
                }
                if (GameFuncs.unitCanUpgradeVet(unit)) {
                    $("#unit-action-vet").show();
                    if (myTurn) {
                        VetLoc = unit.location;
                        $("#unit-action-vet").removeClass("cell-dis");
                    } else {
                        $("#unit-action-vet").addClass("cell-dis");
                    }
                } else {
                    $("#unit-action-vet").hide();
                }
                if (actionsLeft && myTurn) {
                    $("#unit-action-disband").show();
                } else {
                    $("#unit-action-disband").hide();
                }
            } else {
                $("#unit-actions").hide();
            }

            $("#info-img").attr("src", "../lib/img/" + unitTribe.name + "/" + unit.type + ".png");
            $("#info-span1").html(Capitalize(unitTribe.name + " " + unit.type) + (isFriendly ? "" : " [ENEMY]"));
            $("#info-span2").html(unit.health + "/" + GameFuncs.unitMaxHealth(unit) + " HP. " + (unit.isVet ? "Veteran. " : "") + unit.kills + " kills");
        }
    },

    DrawBoard: function () {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                $cell(i, j).image.attr("src", "../lib/img/blank.png");
                $cell(i, j).span.html("");
            }
        }
        $("#turn-num").html(GameBoard.turn);
        for (const t of GameBoard.tribes) {
            for (const u of t.units) {
                const loc = u.location;
                $cell(loc[0], loc[1]).image.attr("src", "../lib/img/" + t.name + "/" + u.type + ".png");
                $cell(loc[0], loc[1]).span.html(u.health);

                if (t.name == GameBoard.tribeOrder[GameBoard.tribeToMove] && !GameFuncs.unitHasActions(GameBoard, u)) {
                    $cell(loc[0], loc[1]).cell.addClass("cell-dis");
                } else {
                    $cell(loc[0], loc[1]).cell.removeClass("cell-dis");
                }
            }
        }
    },

    HighlightMoves: function (unitSpot) {
        const unit = GameFuncs.unitAt(GameBoard, unitSpot);
        if (unit === null) {
            return;
        }
        Display.ClearHighlights();

        $cell(unitSpot[0], unitSpot[1]).cell.addClass("cell-sel");
        if (GameFuncs.unitCanMove(GameBoard, unit)) {
            for (const loc of GameFuncs.spotsCanMoveTo(GameBoard, unitSpot)) {
                $cell(loc[0], loc[1]).cell.addClass("cell-blue");
            }
        }
        if (GameFuncs.unitCanAttack(GameBoard, unit)) {
            for (const loc of GameFuncs.spotsCanAttack(GameBoard, unitSpot)) {
                $cell(loc[0], loc[1]).cell.addClass("cell-red");
            }
        }
    },

    ClearHighlights: function () {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                $cell(i, j).cell.removeClass("cell-blue");
                $cell(i, j).cell.removeClass("cell-red");
                $cell(i, j).cell.removeClass("cell-sel");
            }
        }
    }
};

const UI = {
    // UI - all UI click functions etc
    CellClick: function (cellid) {
        const loc = [$cell(cellid).x, $cell(cellid).y];
        if ($cell(loc[0], loc[1]).cell.hasClass("cell-blue")) {
            if (!myTurn) return;
            GameBoard = GameFuncs.moveUnit(GameBoard, SelectedLoc, loc, turnDeltas);
            if (GameFuncs.unitHasActions(GameBoard, GameFuncs.unitAt(GameBoard, loc))) {
                SelectUnit(loc);
            } else {
                DeSelect();
            }
            Display.DrawBoard();
            Display.DrawGameInfo();
            return;
        }
        if ($cell(loc[0], loc[1]).cell.hasClass("cell-red")) {
            if (!myTurn) return;
            GameBoard = GameFuncs.attackUnit(GameBoard, SelectedLoc, loc, turnDeltas);
            if (GameFuncs.unitAt(GameBoard, SelectedLoc) !== null) {
                if (GameFuncs.unitHasActions(GameBoard, GameFuncs.unitAt(GameBoard, SelectedLoc))) {
                    SelectUnit(SelectedLoc);
                } else {
                    DeSelect();
                }
            } else {
                if (GameFuncs.unitHasActions(GameBoard, GameFuncs.unitAt(GameBoard, loc))) {
                    SelectUnit(loc);
                } else {
                    DeSelect();
                }
            }
            Display.DrawBoard();
            Display.DrawGameInfo();
            return;
        }

        const unit = GameFuncs.unitAt(GameBoard, loc);
        const tribe = GameFuncs.unitAtTribe(GameBoard, loc);
        const tribeToMove = GameBoard.tribeOrder[GameBoard.tribeToMove];
        if (unit === null) {
            DeSelect();
        } else if (tribe.name != GameBoard.tribeOrder[playerNum]) {
            // Enemy unit
            DeSelect();
            Display.DrawUnitBox(unit, false);
        } else if (!myTurn) {
            // Your unit, not your turn
            DeSelect();
            Display.DrawUnitBox(unit, true);
        } else if (!GameFuncs.unitHasActions(GameBoard, unit)) {
            // Your unit, out of moves
            DeSelect();
            Display.DrawUnitBox(unit, true);
        } else {
            // Select your unit
            if (SelectedLoc !== null && SelectedLoc[0] == loc[0] && SelectedLoc[1] == loc[1]) {
                DeSelect();
            } else {
                SelectUnit(loc);
            }
        }
    },
    RecoverClick: function () {
        if (!myTurn) return;
        GameBoard = GameFuncs.recoverUnit(GameBoard, SelectedLoc, turnDeltas);
        DeSelect();
        Display.DrawBoard();
    },
    HealClick: function () {
        if (!myTurn) return;
        GameBoard = GameFuncs.healUnit(GameBoard, SelectedLoc, turnDeltas);
        DeSelect();
        Display.DrawBoard();
    },
    VetClick: function () {
        if (!myTurn) return;
        GameBoard = GameFuncs.vetUpgradeUnit(GameBoard, VetLoc, turnDeltas);
        Display.DrawUnitBox(GameFuncs.unitAt(GameBoard, VetLoc), true);
        Display.DrawBoard();
    },
    DisbandClick: function () {
        if (!myTurn) return;
        if (confirm("Are you sure you want to Disband this unit?")) {
            GameBoard = GameFuncs.removeUnitAt(GameBoard, SelectedLoc);
            turnDeltas.push({
                type: "disband",
                spot: SelectedLoc
            });
            DeSelect();
            Display.UpdateDisplay();
        }
    },
    EndTurnClick: function () {
        if (!myTurn) return;
        EndTurn();
    },

    ExportClick: function () {
        $("#export-box").show();
        $("#export-box").val(JSONUtil.pack(GameBoard));
        $("#export-box").select();
        $("#export-box").focusout(function () {
            $("#export-box").fadeOut();
        });
    },
    CreditsClick: function () {
        const credits =
            "Polytopia Chess by MrSiliconGuy\n" +
            "Credits to:\n" +
            "    Zebastian1 for the Google Drawings game\n" +
            "    FrothFrenzy for Battle Calculator formulas\n" +
            "    And of course Midjiwan for the original game\n";
        alert(credits);
    },
};

function DeSelect() {
    Display.ClearHighlights();
    Display.DrawUnitBox(null);
    SelectedLoc = null;
}

function SelectUnit(loc) {
    const unit = GameFuncs.unitAt(GameBoard, loc);
    SelectedLoc = loc;
    Display.DrawUnitBox(unit, true);
    Display.HighlightMoves(unit.location);
}

function EndTurn() {
    if (!myTurn) return;
    if (confirm("End Turn?")) {
        GameBoard = GameFuncs.endTurn(GameBoard);
        myTurn = false;
        DeSelect();
        Display.UpdateDisplay();

        let data = {
            deltas: JSONUtil.pack(turnDeltas),
            gameState: JSONUtil.pack(GameBoard),
            gameID
        };
        socket.emit("turn", data);
    }
}

// Helper function for interacting with Cell DOM :ok_hand:
function $cell(x, y) {
    let cellID = "";
    if (typeof (y) == "undefined") {
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
        y: y
    };
}

// Temp
function ReplayDeltas(deltas, gameState, callback) {
    const TimerDelay = 1000;
    let i = 0;
    $("#status-bar").slideDown();
    $("#status-bar span").html("Replaying...");

    function loop(c) {
        if (i === deltas.length) {
            c();
            return;
        } else {
            GameBoard = GameFuncs.doDelta(GameBoard, deltas[i]);
            Display.UpdateDisplay();
            i++;
            setTimeout(loop, TimerDelay, c);
        }
    }
    setTimeout(loop, TimerDelay, function () {
        GameBoard = gameState;
        Display.UpdateDisplay();
        callback();
    });
}


// Connection Info
let playerNum = -1;
let myTurn = false;
let turnDeltas = [];
let gameID = "";

const socket = io();
socket.on('err', function (data) {
    console.log(data.message);
    if (data.message === "Invalid Create Request") {
        alert("Unable to create game");
    }
    if (data.message === "Game Full") {
        alert("Unable to join game: Game full\n(All players already joined)");
    }
    if (data.message === "Invalid Join Key") {
        alert("Unable to join game: No game with Join Key of " + data.key);
    }
});
socket.on("joinGame", function (data) {
    gameID = data.gameID;
    GameBoard = JSONUtil.unpack(data.gameInitSetup);
    playerNum = data.playerNum;
    $("#create-join-game").hide();
    $("#create-game-box").hide();
    $("#join-game-box").hide();
    $("#content").css("filter", "");
    $("#game-info-player").html("Player " + (playerNum + 1));
    $("#game-info-tribe").html(Capitalize(GameBoard.tribeOrder[playerNum]));
    $("#game-info-gameID").html(gameID);
    if (data.gameHost) {
        $("#create-game-copy-id>input").val(gameID);
        $("#create-game-copy-id").slideDown();
        $("#create-game-copy-id>input").select();
        $("#create-game-copy-id>input").focusout(function () {
            $("#create-game-copy-id").fadeOut();
        });
    }

    $("#status-bar span").html("Waiting for players...");
    $("#status-bar").slideDown();
    Display.UpdateDisplay();
    console.log("Joined game " + data.gameID);
});
socket.on("gameStart", function (data) {
    NextTurnState();
});
socket.on("turn", function (data) {
    myTurn = false;
    if (data.lastPlayerID !== socket.id) {
        ReplayDeltas(JSONUtil.unpack(data.deltas), JSONUtil.unpack(data.gameState), NextTurnState);
    } else {
        NextTurnState();
    }
});
function NextTurnState() {
        if (GameBoard.tribeToMove === playerNum) {
            myTurn = true;
            turnDeltas = [];
            $("#status-bar span").html("");
            $("#status-bar").slideUp();
        } else {
            myTurn = false;
            $("#status-bar").slideDown();
            $("#status-bar span").html("Waiting for " + Capitalize(GameBoard.tribeOrder[GameBoard.tribeToMove]));
        }
}

const Connection = {
    CreateClick: function () {
        $("#create-join-game").slideUp();
        $("#create-game-box").slideDown();
        $("#create-game-box>div>input").select();
    },
    JoinClick: function () {
        $("#create-join-game").slideUp();
        $("#join-game-box").slideDown();
        $("#join-game-box>div>input").select();
    },
    CreateSubmitClick: function () {
        let gameCode = "";
        if (DEBUG) gameCode = "𢉸𡦥𐛁斃𠰌𤯟臧𦌊强雞𢟚揓碈䂀紬䚂𣲳𤉃𤣻篨𣌪𧀓𣝮𨇳哳仙𠂀嚫䃡韈𢔮幭夭𢘩𢫪𦓅𠤁𧀣眣譶𡺼𧤧𤔮𓀪ꌣ𤶹吏炥𨆶浖䈟𠮠𧿲𥦐𢩫𣓹𠬵椠𒂾今𧂟𦍎𐘤謴𖤵扩聅夵𡳑𤀁繗𤊐𥲉㩉𣰍𠶭筬𠝶趉閴䠪𢨺𧘼䢕毎𦬋𣈠顅汃滫傁敷𓊶𦹊𦑛𥿅矽𣰒𦮨硊㣙𥔺占𡯠𤨁錬𧸺𦺬𡳺𧕾𣱁𧒿䈴徝𦯔捝𣽵𧓖𧄥𤍱𤖧𦅁𧨐𠞏𦟆𦒖鎼𡏱𢁋𤒍绌𥨢蒕𢘌䏼蝔蓓諠㠌嶑𧾚蒨𓏾淣㙾𦨇𣽁";
        else gameCode = $("#create-game-box>div>input").val();
        // Test valid
        if (!gameCode) {
            alert("Invalid Game Code");
            return;
        }
        try {
            let parsed = JSONUtil.unpack(gameCode);
            console.log("Game startup parsed:", parsed);
            // In case this is a new setup (which it probably is)
            let genMvt = GameFuncs.genMvtObjectsTribe(parsed);
            gameCode = JSONUtil.pack(genMvt);
        } catch (err) {
            console.log(err);
            gameCode = "";
        }
        if (gameCode === "") {
            alert("Invalid Game Code");
            return;
        }

        let data = {
            gameCode
        };
        socket.emit("createReq", data);
    },
    JoinSubmitClick: function () {
        key = $("#join-game-box>div>input").val().trim();
        if (!key) {
            return;
        }

        let data = {
            key
        };
        socket.emit("joinReq", data);
    },
};

const JSONUtil = {
    pack: function (data) {
        return Base65536.encode(pako.deflate(JSON.stringify(data)));
    },

    unpack: function (str) {
        return JSON.parse(pako.inflate(Base65536.decode(str), {"to": "string"}));
    }
};