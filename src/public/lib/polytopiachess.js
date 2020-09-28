"use-strict";
// 0: attack,
// 1: defense,
// 2: max health
// 3: mov. range
// 4: att. range
// 5: abilities
const UNITS = {
    warrior: [2, 2, 10, 1, 1, ["dash"]],
    rider: [2, 1, 10, 2, 1, ["dash", "escape"]],
    defender: [1, 3, 15, 1, 1, []],
    swordsman: [3, 3, 15, 1, 1, ["dash"]],
    archer: [2, 1, 10, 1, 2, ["dash"]],
    catapult: [4, 0, 10, 1, 3, []],
    knight: [3.5, 1, 15, 3, 1, ["dash", "persist"]],
    giant: [5, 4, 40, 1, 1, []],
    boat: [1, 1, NaN, 2, 2, ["dash", "carry"]],
    ship: [2, 2, NaN, 3, 2, ["dash", "carry"]],
    battleship: [4, 3, NaN, 3, 2, ["dash", "carry", "scout"]],
    "mind-bender": [0, 1, 10, 1, 1, ["heal", "convert"]],
    amphibian: [2, 1, 10, 2, 1, ["dash", "escape", "swim"]],
    tridention: [3, 1, 15, 2, 2, ["dash", "escape", "swim"]],
    crab: [4, 4, 40, 1, 1, ["escape", "swim"]],
    polytaur: [3, 1, 15, 1, 1, ["dash"]],
    navalon: [4, 4, 30, 3, 1, ["dash", "navigate", "persist"]],
    "dragon-egg": [0, 2, 10, 1, 0, ["dash", "grow"]],
    "baby-dragon": [3, 3, 15, 2, 1, ["dash", "escape", "fly", "grow"]],
    "fire-dragon": [4, 3, 20, 3, 2, ["dash", "fly", "splash"]],
    "nature-bunny": [10, 10, 1000, 7, 7, ["dash", "escape", "persist", "crush"]],
};

const EXAMPLEUNIT = {
    location: [0, 0],
    type: "warrior",
    health: 10,
    isVet: false,
    kills: 0,
};

const EXAMPLEGAMESETUP = {
    turn: 0,
    tribeOrder: ["imperius", "xinxi"],
    tribeToMove: 0,
    boardSize: [8, 8],
    tribes: [
        {
            name: "imperius",
            units: [
                {
                    location: [0, 0],
                    type: "knight",
                    health: 15,
                    isVet: false,
                    kills: 2,
                },
                {
                    location: [1, 1],
                    type: "giant",
                    health: 40,
                    isVet: false,
                    kills: 2,
                },
                {
                    location: [0, 2],
                    type: "warrior",
                    health: 10,
                    isVet: false,
                    kills: 2,
                },
                {
                    location: [0, 1],
                    type: "swordsman",
                    health: 15,
                    isVet: false,
                    kills: 2,
                },
                {
                    location: [0, 3],
                    type: "archer",
                    health: 10,
                    isVet: false,
                    kills: 2,
                },
            ],
        },
        {
            name: "xinxi",
            units: [
                {
                    location: [7, 7],
                    type: "catapult",
                    health: 10,
                    isVet: true,
                    kills: 2,
                },
                {
                    location: [7, 3],
                    type: "mind-bender",
                    health: 10,
                    isVet: false,
                    kills: 2,
                },
                {
                    location: [6, 7],
                    type: "catapult",
                    health: 10,
                    isVet: false,
                    kills: 2,
                },
                {
                    location: [5, 7],
                    type: "warrior",
                    health: 10,
                    isVet: false,
                    kills: 2,
                },
                {
                    location: [7, 0],
                    type: "giant",
                    health: 40,
                    isVet: false,
                    kills: 2,
                },
                {
                    location: [7, 1],
                    type: "giant",
                    health: 40,
                    isVet: false,
                    kills: 2,
                },
            ],
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

const EMPTYGAMESETUP = {
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
    ],
    settings: {
        movements: {
            move: 2,
            attack: 2,
            any: 1,
        },
    },
};

const GameFuncs = {
    getExampleSetup: function () {
        let game = JSON.parse(JSON.stringify(EXAMPLEGAMESETUP));
        return GameFuncs.genMvtObjectsTribe(game);
    },
    getEmptySetup: function () {
        let game = JSON.parse(JSON.stringify(EMPTYGAMESETUP));
        return GameFuncs.genMvtObjectsTribe(game);
    },

    /**
     * Returns the unit at a certain spot
     * @param {Game} game Game object
     * @param {number | [number, number]} x x-coordinate of the unit OR [x,y] of the unit
     * @param {number} y y-coordinate of the unit
     * @returns {*|null} Unit at x, y, or null if there is no unit
     */
    unitAt: function (game, unitSpot) {
        if (typeof unitSpot == "undefined") {
            console.error("EEE You forgot to assign the variable game I think");
        }
        for (const t of game.tribes) {
            for (let i = 0; i < t.units.length; i++) {
                if (t.units[i].location[0] == unitSpot[0] && t.units[i].location[1] == unitSpot[1]) {
                    return t.units[i];
                }
            }
        }
        return null;
    },

    /**
     * Returns the tribe that the unit is at
     * @param {*} game
     * @param {*} x
     * @param {*} y
     */
    unitAtTribe: function (game, unitSpot) {
        if (typeof unitSpot == "undefined") {
            console.error("EEE You forgot to assign the variable game I think");
        }
        for (const t of game.tribes) {
            for (let i = 0; i < t.units.length; i++) {
                if (t.units[i].location[0] == unitSpot[0] && t.units[i].location[1] == unitSpot[1]) {
                    return t;
                }
            }
        }
        return null;
    },

    /**
     * Removes the Unit at a certain spot from the board, or return the normal board otherwise
     * @param {Game} game Game object
     * @param {number | [number, number]} x x-coordinate of the unit OR [x,y] of the unit
     * @param {number} y y-coordinate of the unit
     * @returns {game} The resulting game board
     */
    removeUnitAt: function (game, loc) {
        if (typeof loc == "undefined") {
            console.error("EEE You forgot to assign the variable game I think");
        }
        var doBreak = false;
        for (let t of game.tribes) {
            for (let i = 0; i < t.units.length; i++) {
                if (t.units[i].location[0] == loc[0] && t.units[i].location[1] == loc[1]) {
                    t.units.splice(i--, 1);
                    doBreak = true;
                    break;
                }
            }
            if (doBreak) {
                break;
            }
        }
        return game;
    },

    /**
     * Returns all the spots a unit can move to
     * @param {Game} game A Game Object
     * @param {number} tribeNum The index of the Tribe in game.tribes[]
     * @param {[number, number]} unitSpot The Location of the unit
     * @returns {Number[]} An array of spots the piece can move to, (null if there is no piece at the spot)
     */
    spotsCanMoveTo: function (game, unitSpot) {
        const UNIT = GameFuncs.unitAt(game, unitSpot);
        if (UNIT === null) {
            return null;
        }
        const UNITRANGE = UNITS[UNIT.type][3];
        const EIGHTDIRECTIONS = [
            [-1, 1],
            [0, 1],
            [1, 1],
            [-1, 0],
            [1, 0],
            [-1, -1],
            [0, -1],
            [1, -1],
        ];

        let discoveredspots = [];
        let Q = [];
        Q.push({
            loc: UNIT.location,
            r: UNITRANGE,
        });
        discoveredspots.push({
            loc: UNIT.location,
            r: UNITRANGE,
        });
        while (Q.length > 0) {
            // Pop new node from queue
            let v = Q.shift();
            if (v.r > 0) {
                // Iterate throught each neighbour of the node (square)
                for (const p of EIGHTDIRECTIONS) {
                    // New location (neighbour)
                    wLoc = [v.loc[0] + p[0], v.loc[1] + p[1]];
                    // Check that wLoc is valid
                    if (wLoc[0] < 0 || wLoc[0] >= game.boardSize[0] || wLoc[1] < 0 || wLoc[1] >= game.boardSize[1]) {
                        continue;
                    }
                    // Check that wLoc is not in discoveredspots
                    var inD = false;
                    for (let i = 0; i < discoveredspots.length; i++) {
                        const d = discoveredspots[i];
                        if (d.loc[0] == wLoc[0] && d.loc[1] == wLoc[1]) {
                            // Remove the original d if v range is greater than d range, to be iterated again
                            if (v.r - 1 > d.r) {
                                discoveredspots.splice(i, 1);
                            }
                            // Otherwise don't add wLoc to queue
                            else {
                                inD = true;
                                break;
                            }
                        }
                    }
                    if (inD) {
                        continue;
                    }

                    // Check for movement-stopping by enemy units
                    let rStop = false;
                    for (const d of [...EIGHTDIRECTIONS, [0, 0]]) {
                        let dLoc = [wLoc[0] + d[0], wLoc[1] + d[1]];
                        if (
                            GameFuncs.unitAtTribe(game, dLoc) !== null &&
                            GameFuncs.unitAtTribe(game, dLoc) !== GameFuncs.unitAtTribe(game, unitSpot)
                        ) {
                            rStop = true;
                            break;
                        }
                    }

                    newSpot = {
                        loc: wLoc,
                        r: rStop ? 0 : v.r - 1,
                    };
                    Q.push(newSpot);
                    discoveredspots.push(newSpot);
                }
            }
        }
        let ret = [];
        for (const i of discoveredspots) {
            ret.push(i.loc);
        }
        for (let i = 0; i < ret.length; i++) {
            const loc = ret[i];
            if (GameFuncs.unitAt(game, loc) !== null) {
                ret.splice(i, 1);
                i--;
            }
        }
        return ret;
    },

    /**
     * Returns a list of spots where a unit can attack
     * @param {Game} game
     * @param {[number,number]} unitSpot
     */
    spotsCanAttack: function (game, unitSpot) {
        const tribe = GameFuncs.unitAtTribe(game, unitSpot);
        let ret = [];
        for (const t of game.tribes) {
            if (t.name == tribe.name) {
                continue;
            }
            for (const u of t.units) {
                if (GameFuncs.inRange(game, unitSpot, u.location)) {
                    ret.push([u.location[0], u.location[1]]);
                }
            }
        }
        return ret;
    },

    unitHasActions: function (game, unit) {
        return GameFuncs.unitCanMove(game, unit) || GameFuncs.unitCanAttack(game, unit) || GameFuncs.unitCanRecover(game, unit);
    },

    unitCanMove: function (game, unit) {
        if (!unit.hasOwnProperty("movements")) {
            return false;
        }
        if (game.movements.move == 0 && game.movements.any == 0) {
            return false;
        }
        const unitTraits = UNITS[unit.type][5];
        if (unit.movements.recover == true || (unitTraits.includes("heal") && unit.movements.heal == true)) {
            return false;
        }
        if (unit.movements.move == true || unit.movements.attack == true) {
            if (unitTraits.includes("escape") && unit.movements.attack == true && unit.movements.escape == false) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    },

    unitCanAttack: function (game, unit) {
        // Special: game --> null when healing as it doesn't count as an attack
        if (!unit.hasOwnProperty("movements")) {
            return false;
        }
        if (game.movements.attack == 0 && game.movements.any == 0) {
            return false;
        }
        const unitTraits = UNITS[unit.type][5];
        if (unit.movements.recover == true || (unitTraits.includes("heal") && unit.movements.heal == true)) {
            return false;
        }
        if (unitTraits.includes("dash")) {
            if (unit.movements.attack == true) {
                return false;
            }
        } else {
            if (unit.movements.attack == true || unit.movements.move == true) {
                return false;
            }
        }
        if (game === null) {
            return true;
        } else {
            return GameFuncs.spotsCanAttack(game, unit.location).length > 0;
        }
    },

    unitCanRecover: function (game, unit) {
        if (!unit.hasOwnProperty("movements")) {
            return false;
        }

        const unitTraits = UNITS[unit.type][5];
        if (
            unit.movements.recover == true ||
            unit.movements.move == true ||
            unit.movements.attack == true ||
            (unitTraits.includes("heal") && unit.movements.heal == true)
        ) {
            return false;
        } else if (unit.health == GameFuncs.unitMaxHealth(unit)) {
            return false;
        } else {
            return true;
        }
    },

    unitCanHeal: function (game, unit) {
        if (!unit.hasOwnProperty("movements")) {
            return false;
        }
        const unitTraits = UNITS[unit.type][5];
        if (!unitTraits.includes("heal")) {
            // DUH
            return false;
        }
        if (unit.movements.recover == true || unit.movements.heal == true) {
            return false;
        }
        if (unitTraits.includes("dash")) {
            if (unit.movements.heal == true || unit.movements.attack == true) {
                return false;
            }
        } else {
            if (unit.movements.move == true || unit.movements.heal == true || unit.movements.attack == true) {
                return false;
            }
        }

        // It uses the same logic, bc. healing is basically like attacking
        // Check if any units can be healed
        const tribe = GameFuncs.unitAtTribe(game, unit.location);
        for (const u of tribe.units) {
            if (GameFuncs.inRange(game, unit.location, u.location) && u.health < GameFuncs.unitMaxHealth(u)) {
                return true;
            }
        }
        return false;
    },

    unitCanUpgradeVet: function (unit) {
        return !unit.isVet && unit.kills >= 3;
    },

    unitMaxHealth: function (unit) {
        return unit.isVet ? UNITS[unit.type][2] + 5 : UNITS[unit.type][2];
    },

    /**
     * Returns the distance between 2 units (max horizonal/vertical distance)
     * @param {Game} game
     * @param {[number,number]} attSpot
     * @param {[number, number]} defSpot
     */
    distance: function (game, unit1Spot, unit2Spot) {
        distx = Math.abs(unit1Spot[0] - unit2Spot[0]);
        disty = Math.abs(unit1Spot[1] - unit2Spot[1]);
        return Math.max(distx, disty);
    },

    /**
     * Returns if the object is within attacking range
     * @param {Game} game
     * @param {[number,number]} attSpot
     * @param {[number, number]} defSpot
     */
    inRange: function (game, attSpot, defSpot) {
        const unit = GameFuncs.unitAt(game, attSpot);
        return GameFuncs.distance(game, attSpot, defSpot) <= UNITS[unit.type][4];
    },

    /**
     * Completes that attack of one unit upon another unit
     * This function accounts for range checking, if the move is valid
     * It also marks the unit as "has attacked (if applicable)"
     * It also handles healing for units with the "heal" ability,
     * conversion for units with the "convert" ability
     * @param {*} game
     * @param {*} attSpot
     * @param {*} defSpot
     */
    attackUnit: function (game, attSpot, defSpot, deltas) {
        function calculate_formula(att, def, defbonus, defwall, retaliate) {
            // att - Attacker info [att, hp, max_hp]
            // def - Defender into [def, hp, max_hp]
            // defbonus - If the defender has defense bonus
            // defwall - If the defender has wall bonus
            // retaliate - If the defender will retaliate
            // return: [att_remaining_hp, def_remaining_hp]
            let accel = 4.5;
            var atthp = att[1];
            var defhp = def[1];
            var attForce, defForce, totalDam, res;
            // Attacker attacking
            attForce = att[0] * (att[1] / att[2]);
            defForce = (defbonus ? def[0] * 1.5 : defwall ? def[0] * 4 : def[0]) * (def[1] / def[2]);
            totalDam = attForce + defForce;
            res = Math.round((attForce / totalDam) * att[0] * accel);
            defhp -= res;
            if (defhp > 0 && retaliate) {
                attForce = def[0] * (def[1] / def[2]);
                defForce = att[0] * (att[1] / att[2]);
                totalDam = attForce + defForce;
                res = Math.round((attForce / totalDam) * def[0] * accel);
                atthp -= res;
            }
            return [atthp, defhp];
        }

        // Declare Variables
        let attUnit = GameFuncs.unitAt(game, attSpot);
        let defUnit = GameFuncs.unitAt(game, defSpot);
        const attStat = UNITS[attUnit.type];
        const defStat = UNITS[defUnit.type];
        const attMaxHP = attUnit.isVet ? attStat[2] + 5 : attStat[2];
        const defMaxHP = defUnit.isVet ? defStat[2] + 5 : defStat[2];

        // Some basic checks
        if (attUnit === null || defUnit === null) {
            return game;
        }
        if (!GameFuncs.unitCanAttack(game, GameFuncs.unitAt(game, attSpot))) {
            return game;
        }
        if (!GameFuncs.inRange(game, attSpot, defSpot)) {
            return game;
        }

        // If the unit is a converting type unit
        if (attStat[5].includes("convert")) {
            GameFuncs.removeUnitAt(game, defSpot);
            let tribe = GameFuncs.unitAtTribe(game, attSpot);
            tribe.units.push(defUnit);
            attUnit.kills += 1;
            attUnit.movements.attack = true;
        } else {
            let ret = true;
            if (GameFuncs.distance(game, attSpot, defSpot) > defStat[4] || defStat[5].includes("convert")) {
                ret = false;
            }
            // Do actual attacking calculations
            let results = calculate_formula([attStat[0], attUnit.health, attMaxHP], [defStat[1], defUnit.health, defMaxHP], false, false, ret);

            // Calculate splash damage
            if (attStat[5].includes("splash")) {
                for (const t of game.tribes) {
                    if (t.name != GameFuncs.unitAtTribe(game, attSpot).name) {
                        let removeSpots = [];
                        for (const u of t.units) {
                            if (GameFuncs.distance(game, defSpot, u.location) <= 1 && !(u.location[0] == defSpot[0] && u.location[1] == defSpot[1])) {
                                const uStat = UNITS[u.type];
                                const uMaxHP = u.isVet ? uStat[2] + 5 : uStat[2];
                                let tempRes = calculate_formula(
                                    [attStat[0] / 2, attUnit.health, attMaxHP],
                                    [uStat[0], u.health, uMaxHP],
                                    false,
                                    false,
                                    false
                                );
                                if (tempRes[1] <= 0) {
                                    removeSpots.push(u.location);
                                } else {
                                    u.health = tempRes[1];
                                }
                            }
                        }
                        for (const loc of removeSpots) {
                            game = GameFuncs.removeUnitAt(game, loc);
                        }
                    }
                }
            }

            // Ending results
            if (results[0] <= 0) {
                // Attacker died - kill attacker
                game = GameFuncs.removeUnitAt(game, attSpot);
                defUnit.health = results[1];
                defUnit.kills += 1;
            } else if (results[1] <= 0) {
                // Defender died - kill defender and move attacker to defender spot
                game = GameFuncs.removeUnitAt(game, defSpot);
                attUnit.health = results[0];
                attUnit.kills += 1;
                if (attStat[4] <= 1) {
                    attUnit.location = defSpot;
                }

                if (!attStat[5].includes("persist")) {
                    attUnit.movements.attack = true;
                }
            } else {
                // Noone died - update health only
                attUnit.health = results[0];
                defUnit.health = results[1];
                attUnit.movements.attack = true;
            }
            if (game.movements.attack > 0) {
                game.movements.attack--;
            } else {
                game.movements.any--;
            }
        }

        if (deltas) {
            let delta = {
                type: "attack",
                spot1: attSpot,
                spot2: defSpot,
            };
            deltas.push(delta);
        }
        return game;
    },

    moveUnit: function (game, unitSpot, moveSpot, deltas) {
        let unit = GameFuncs.unitAt(game, unitSpot);
        if (!GameFuncs.unitCanMove(game, unit)) {
            return game;
        }
        if (unit === null || GameFuncs.unitAt(game, moveSpot)) {
            return game;
        }
        if (unit.movements.attack == false && unit.movements.move == false) {
            unit.movements.move = true;
        } else if (unit.movements.attack == true || unit.movements.escape == false) {
            unit.movements.escape = true;
        } else {
            return game;
        }
        // Lol that's it
        unit.location = moveSpot;

        if (game.movements.move > 0) {
            game.movements.move--;
        } else {
            game.movements.any--;
        }
        // Delta Object
        if (deltas) {
            let delta = {
                type: "move",
                spot1: unitSpot,
                spot2: moveSpot,
            };
            deltas.push(delta);
        }
        return game;
    },

    recoverUnit: function (game, unitSpot, deltas) {
        let unit = GameFuncs.unitAt(game, unitSpot);
        if (GameFuncs.unitCanRecover(game, unit)) {
            unit.movements.recover = true;
            const maxHealth = GameFuncs.unitMaxHealth(unit);
            unit.health = Math.min(unit.health + 4, maxHealth);

            // Delta Object
            if (deltas) {
                let delta = {
                    type: "recover",
                    spot: unitSpot,
                };
                deltas.push(delta);
            }
        }
        return game;
    },

    /**
     * Heals other units around it (mindbender)
     * this DOES NOT recover the unit's health
     * @param {*} game
     * @param {*} unitSpot
     */
    healUnit: function (game, unitSpot, deltas) {
        let unit = GameFuncs.unitAt(game, unitSpot);
        if (GameFuncs.unitCanHeal(game, unit)) {
            unit.movements.heal = true;

            let unitTribe = GameFuncs.unitAtTribe(game, unitSpot);
            for (let u of unitTribe.units) {
                if (GameFuncs.inRange(game, unitSpot, u.location) && u.location != unit.location) {
                    let maxHealth = GameFuncs.unitMaxHealth(u);
                    u.health = Math.min(u.health + 2, maxHealth);
                }
            }

            // Delta Object
            if (deltas) {
                let delta = {
                    type: "heal",
                    spot: unitSpot,
                };
                deltas.push(delta);
            }
        }
        return game;
    },

    vetUpgradeUnit: function (game, unitSpot, deltas) {
        let unit = GameFuncs.unitAt(game, unitSpot);
        if (GameFuncs.unitCanUpgradeVet(unit)) {
            unit.isVet = true;
            unit.health = GameFuncs.unitMaxHealth(unit);

            // Delta Object
            if (deltas) {
                let delta = {
                    type: "vet",
                    spot: unitSpot,
                };
                deltas.push(delta);
            }
        }
        return game;
    },

    genMvtObjectsTribe: function (game) {
        function genMovementObjUnit(game, unitSpot) {
            let unit = GameFuncs.unitAt(game, unitSpot);
            if (unit.hasOwnProperty("movements")) {
                return game;
            }

            let moveObject = {
                move: false,
                attack: false,
                recover: false,
            };
            const unitTraits = UNITS[unit.type][5];
            if (unitTraits.includes("escape")) {
                moveObject.escape = false;
            }
            if (unitTraits.includes("heal")) {
                moveObject.heal = false;
            }

            unit.movements = moveObject;
            return game;
        }

        const tribeName = game.tribeOrder[game.tribeToMove];
        for (const t of game.tribes) {
            if (t.name == tribeName) {
                t.movements = {
                    attack: 2,
                    move: 2,
                    any: 1,
                };
                for (const u of t.units) {
                    game = genMovementObjUnit(game, u.location);
                }
            }
        }
        game.movements = JSON.parse(JSON.stringify(game.settings.movements));
        return game;
    },

    /**
     * Finishes the turn of the current tribe that is moving, and passes the turn to the next tribe
     * @param {game} game
     */
    endTurn: function (game) {
        const tLastMovedName = game.tribeOrder[game.tribeToMove];
        game.tribes.forEach((t) => {
            if (t.name == tLastMovedName) {
                for (let i = 0; i < t.units.length; i++) {
                    let u = t.units[i];
                    if (u.hasOwnProperty("movements")) {
                        delete u.movements;
                    }
                }
            }
        });

        game.tribeToMove += 1;
        if (game.tribeToMove >= game.tribeOrder.length) {
            game.tribeToMove = 0;
            game.turn += 1;
        }
        game = GameFuncs.genMvtObjectsTribe(game);
        return game;
    },

    /**
     * Apply the delta to the game board
     * @param {game} game Game board
     * @param {move_object} move Delta object that describes a single move on the board
     * @returns {game} The game board with the move done
     */
    doDelta: function (game, delta) {
        switch (delta.type) {
            case "attack":
                return GameFuncs.attackUnit(game, delta.spot1, delta.spot2);
            case "move":
                return GameFuncs.moveUnit(game, delta.spot1, delta.spot2);
            case "recover":
                return GameFuncs.recoverUnit(game, delta.spot);
            case "heal":
                return GameFuncs.healUnit(game, delta.spot);
            case "vet":
                return GameFuncs.vetUpgradeUnit(game, delta.spot);
            case "disband":
                return GameFuncs.removeUnitAt(game, delta.spot);
            default:
                throw new Error("Delta has incorrect 'type' property");
        }
    },
};
