"use-strict";

var GameBoard;
let SelectedLoc = null;
// For very specific case
let VetLoc = null;

$(document).ready(function () {
    try {
        if (Cookies.getJSON("game") !== undefined) {
            GameBoard = Cookies.getJSON("game");

            if (!GameBoard.hasOwnProperty("movements")) {
                GameBoard = GameFuncs.genMvtObjectsTribe(GameBoard);
            }
            $("#get-started").hide();
        } else if (Cookies.getJSON("game-setup") !== undefined) {
            GameBoard = Cookies.getJSON("game-setup");
            GameBoard = GameFuncs.genMvtObjectsTribe(GameBoard);
            $("#get-started").hide();
        } else {
            GameBoard = GameFuncs.getEmptySetup();
        }
    } catch (error) {
        if (error === "game" || error === "game-setup") {
            Cookies.remove(error);
        }
        GameBoard = GameFuncs.getEmptySetup();
    }

    for (let i = 7; i >= 0; i--) {
        for (let j = 0; j < 8; j++) {
            template = $($("#cell-template").html()).attr("id", "cell-" + i + j);
            $("#board").append(template);
        }
    }
    Display.UpdateDisplay();
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
                if (!actionsLeft) {
                    $("#unit-action-recover").hide();
                } else {
                    $("#unit-action-recover").show();
                    if (GameFuncs.unitCanRecover(GameBoard, unit)) {
                        $("#unit-action-recover").removeClass("cell-dis");
                    } else {
                        $("#unit-action-recover").addClass("cell-dis");
                    }
                }
                if (actionsLeft && GameFuncs.unitCanHeal(GameBoard, unit)) {
                    $("#unit-action-heal").show();
                } else {
                    $("#unit-action-heal").hide();
                }
                if (GameFuncs.unitCanUpgradeVet(unit)) {
                    $("#unit-action-vet").show();
                    VetLoc = unit.location;
                } else {
                    $("#unit-action-vet").hide();
                }
                if (actionsLeft) {
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
            GameBoard = GameFuncs.moveUnit(GameBoard, SelectedLoc, loc);
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
            GameBoard = GameFuncs.attackUnit(GameBoard, SelectedLoc, loc);
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
        } else if (tribe.name != tribeToMove) {
            DeSelect();
            Display.DrawUnitBox(unit, false);
        } else if (!GameFuncs.unitHasActions(GameBoard, unit)) {
            DeSelect();
            Display.DrawUnitBox(unit, true);
        } else {
            if (SelectedLoc !== null && SelectedLoc[0] == loc[0] && SelectedLoc[1] == loc[1]) {
                DeSelect();
            } else {
                SelectUnit(loc);
            }
        }
    },
    RecoverClick: function () {
        GameBoard = GameFuncs.recoverUnit(GameBoard, SelectedLoc);
        DeSelect();
        Display.DrawBoard();
    },
    HealClick: function () {
        GameBoard = GameFuncs.healUnit(GameBoard, SelectedLoc);
        DeSelect();
        Display.DrawBoard();
    },
    VetClick: function () {
        GameBoard = GameFuncs.vetUpgradeUnit(GameBoard, VetLoc);
        Display.DrawUnitBox(GameFuncs.unitAt(GameBoard, VetLoc), true);
        Display.DrawBoard();
    },
    DisbandClick: function () {
        if (confirm("Are you sure you want to Disband this unit?")) {
            GameBoard = GameFuncs.removeUnitAt(GameBoard, SelectedLoc);
            DeSelect();
            Display.UpdateDisplay();
        }
    },
    EndTurnClick: function () {
        EndTurn();
    },

    ImportClick: function () {
        let input = prompt("Enter in Input Code");
        GameBoard = JSONUtil.unpack(input);
        if (!GameBoard.hasOwnProperty("movements")) {
            GameBoard = GameFuncs.genMvtObjectsTribe(GameBoard);
        }
        $("#get-started").slideUp();
		SaveToCookies(true);
        Display.UpdateDisplay();
    },
    ExportClick: function () {
        $("#export-box").show();
        $("#export-box").val(JSONUtil.pack(GameBoard));
        $("#export-box").select();
        $("#export-box").focusout(function() {
            $("#export-box").fadeOut();
        });
    },
    ClearGameClick: function () {
        Cookies.remove("game");
        GameBoard = GameFuncs.getEmptySetup();
        $("#get-started").show();
        Display.UpdateDisplay();
    },
    CreditsClick: function () {
        const credits =
            "Polytopia Chess by MrSiliconGuy\n" +
            "Credits to:\n" +
            "    Zebastian1 for OG Google Drawings game\n" +
            "    FrothFrenzy for Battle Calculations\n" +
            "    And of course Midjiwan for the original game!!\n";
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
    if (confirm("End Turn?")) {
        GameBoard = GameFuncs.endTurn(GameBoard);
        Cookies.remove("game");
		SaveToCookies(true);
        DeSelect();
        Display.UpdateDisplay();
    }
}

function SaveToCookies(doAsync) {
	Cookies.set("game", GameBoard, {
		expires: 30,
		}, true);
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