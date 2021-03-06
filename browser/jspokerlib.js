(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const Suit = {
    CLUBS: { id: 0, name: "Clubs" },
    DIAMONDS: { id: 1, name: "Diamonds" },
    HEARTS: { id: 2, name: "Hearts" },
    SPADES: { id: 3, name: "Spades" }
}

const Rank = {
    ACE: { id: 0, name: "Ace" },
    TWO: { id: 1, name: "Two" },
    THREE: { id: 2, name: "Three" },
    FOUR: { id: 3, name: "Four" },
    FIVE: { id: 4, name: "Five" },
    SIX: { id: 5, name: "Six" },
    SEVEN: { id: 6, name: "Seven" },
    EIGHT: { id: 7, name: "Eight" },
    NINE: { id: 8, name: "Nine" },
    TEN: { id: 9, name: "Ten" },
    JACK: { id: 10, name: "Jack" },
    QUEEN: { id: 11, name: "Queen" },
    KING: { id: 12, name: "King" }
}

class Card {
    constructor(suit, rank) {
        this.suit = suit
        this.rank = rank
    }

    toString() {
        return this.rank.name + " of " + this.suit.name
    }
}

class Deck {
    constructor() {
        this.cards = []
        for (var rank in Rank) {
            for (var suit in Suit) {
                var card = new Card(Suit[suit], Rank[rank])
                this.cards.push(card)
            }
        }
    }

    // Fisher-Yates shuffle
    shuffle() {
        var rand = Math.floor(Math.random() * this.cards.length)
        for (var i = this.cards.length - 1; i >= 0; i--) {
            var index = Math.floor(Math.random() * this.cards.length)
            var tmp = this.cards[index]
            this.cards[index] = this.cards[i]
            this.cards[i] = tmp
        }
    }

    selectTopCard() {
        return this.cards.pop()
    }
}

exports.Suit = Suit
exports.Rank = Rank
exports.Card = Card
exports.Deck = Deck
},{}],2:[function(require,module,exports){
PokerTable = require("./pokertable.js").PokerTable
card = require("./card.js")

exports.PokerTable = PokerTable
exports.Rank = card.Rank
exports.Suit = card.Suit
},{"./card.js":1,"./pokertable.js":4}],3:[function(require,module,exports){
class Player {
    constructor(money, name) {
        this.money = money
        this.name = name
        this.pot = {
            preFlop: 0,
            flop: 0,
            turn: 0,
            river: 0
        }
        this.onRound = true
        this.cards = []
    }

    addMoney(value) {
        this.money += value
    }

    transferMoneyToPot(value, phase) {
        this.money -= value
        this.pot[phase] += value
    }

    setName(name) {
        this.name += name
    }

    getCurrentValueFromPlayer(phase) {
        return this.pot[phase]
    }
}

exports.Player = Player
},{}],4:[function(require,module,exports){
card = require("./card.js")
player = require("./player.js")

var Rank = card.Rank
var Suit = card.Suit
var Deck = card.Deck
var Player = player.Player

class Exception {
    constructor(id, message) {
        this.message = message;
        this.id = id;
    }
}

class PokerTable {
    constructor(buyin, smallBlind, bigBlind) {
        this.players = []
        this.buyin = buyin
        this.deck = new Deck()
        this.gameStarted = false
        this.button = 0
        this.burned = []
        this.community = []
        this.currentPlayer = -1
        this.currentBet = 0
        this.smallBlind = smallBlind
        this.bigBlind = bigBlind
        this.currentPhase = "dealer"
        this.alreadyPlayed = 0
    }

    addPlayerToTable(name) {
        if (this.gameStarted) {
            throw new Exception("GameStartedException", "Can't add " + name + " to the table. Game already started.")
        }
        if (this.getNumberOfPlayers() == 10) {
            throw new Exception("FullTableException", "Can't add " + name + " to the table. 10 players already present.")
        }
        if (this.getPositionByName(name) > -1) {
            throw new Exception("SameNameException", "Can't add " + name + " to the table. Name already used.")
        }
        var player = new Player(this.buyin, name)
        this.players.push(player)
    }

    _removePlayerFromRound(pos) {
        this.players[pos].onRound = false
    }

    _isPlayerOnRound(pos) {
        return this.players[pos].onRound
    }

    _transferMoneyToPot(value) {
        this.players[this.currentPlayer].transferMoneyToPot(value, this.currentPhase)
    }

    getNumberOfPlayers() {
        return this.players.length
    }

    getNumberOfPlayersOnRound() {
        var cont = 0
        for (var player of this.players) {
            cont += player.onRound ? 1 : 0
        }
        return cont
    }

    getPlayersOnRound() {
        return this.players.filter((player) => { return player.onRound })
    }

    _nextPlayer() {
        this.currentPlayer = (this.currentPlayer + 1) % this.getNumberOfPlayers()
        while (!this._isPlayerOnRound(this.currentPlayer)) {
            this.currentPlayer = (this.currentPlayer + 1) % this.getNumberOfPlayers()
        }
    }

    _goToFirstPlayer() {
        this.currentPlayer = (this.button + 1) % this.getNumberOfPlayers()
    }

    getPositionByName(name) {
        var pos = -1
        for (var i = 0; i < this.getNumberOfPlayers(); i++) {
            if (this.players[i].name === name) {
                pos = i
            }
        }
        return pos
    }

    _distributeCards() {
        //Burn before flop card
        this.burned.push(this.deck.selectTopCard())

        //Distribute first card to each player
        for (var player of this.players) {
            var firstCard = this.deck.selectTopCard()
            player.cards.push(firstCard)
        }

        //Distribute second card to each player
        for (var player of this.players) {
            var secondCard = this.deck.selectTopCard()
            player.cards.push(secondCard)
        }

        //Set player as in the round
        for (var player of this.players) {
            player.onRound = true
        }

        //Give flop to community
        this.community.push(this.deck.selectTopCard())
        this.community.push(this.deck.selectTopCard())
        this.community.push(this.deck.selectTopCard())

        //Burn before turn card
        this.burned.push(this.deck.selectTopCard())

        //Give turn to community
        this.community.push(this.deck.selectTopCard())

        //Burn before river card
        this.burned.push(this.deck.selectTopCard())

        //Give river to community
        this.community.push(this.deck.selectTopCard())
    }

    _getBlinds() {
        //Small blind bet
        this._nextPlayer()
        this._transferMoneyToPot(this.smallBlind)

        //Big blind bet
        this._nextPlayer()
        this._transferMoneyToPot(this.bigBlind)

        this.currentBet = this.bigBlind
        this._nextPlayer()
    }


    _isAllBetsEqual(phase) {
        var playersOnRound = this.getPlayersOnRound()
        var equal = true
        for (var i = 1; i < playersOnRound.length; i++) {
            var p1 = playersOnRound[i - 1]
            var p2 = playersOnRound[i]
            if (p1.pot[phase] !== p2.pot[phase]) {
                equal = false
                break
            }
        }
        return equal
    }

    getTableSum() {
        var sum = 0
        for (var player of this.players) {
            sum += player.money
            for (var phase in player.pot) {
                sum += player.pot[phase]
            }
        }
        return sum
    }

    getButtonName() {
        return this.players[this.button].name
    }

    getCurrentPlayerName() {
        if (this.currentPlayer == -1)
            throw new Exception("GameNotStarted", "The game is not started.")
        return this.players[this.currentPlayer].name
    }

    startGame() {
        if (this.getNumberOfPlayers() < 2) {
            throw new Exception("NotEnoughPlayers", "There is not enough players to start game (minimum 2)")
        }
        if (this.gameStarted) {
            throw new Exception("GameAlreadyStarted", "A game is already started.")
        }
        this.currentPlayer = this.button
        this.currentPhase = "start"
        this.gameStarted = true

        // Do dealer round
        this._nextPhase()

        // Do preFlop round
        this._nextPhase()
    }

    _nextPhase() {
        switch (this.currentPhase) {
            case "start":
                this._startDealer()
                break
            case "dealer":
                this._startPreFlop()
                break
            case "preFlop":
                this._startFlop()
                break
            case "flop":
                this._startTurn()
                break
            case "turn":
                this._startRiver()
                break
            case "river":
                this._startEndRound()
                break
            default:
                throw new Exception("InexistentPhase", "There is no phase with such name.")
                break
        }
    }

    _changePhase(phase) {
        this.currentBet = 0
        this.alreadyPlayed = 0
        this.currentPhase = phase
    }

    _startDealer() {
        this._changePhase("dealer")
        this.deck.shuffle()
        this._distributeCards()
    }

    _startPreFlop() {
        this._changePhase("preFlop")
        this._getBlinds()
    }

    _startFlop() {
        this._changePhase("flop")
        this._goToFirstPlayer()
    }

    _startTurn() {
        this._changePhase("turn")
        this._goToFirstPlayer()
    }

    _startRiver() {
        this._changePhase("river")
        this._goToFirstPlayer()
    }

    _startEndRound() {
        this._changePhase("endround")
        this.currentPlayer = -1
        this._removeCards()
        this._resetOnRoundStatus()
    }

    _resetOnRoundStatus() {
        for (var player of this.players) {
            player.onRound = true
        }
    }

    _removeCards() {

    }

    getCurrentBet() {
        return this.currentBet
    }

    getCurrentPhase() {
        return this.currentPhase
    }

    getCommunity() {
        var size = 0
        switch (this.currentPhase) {
            case "flop":
                size = 3
                break
            case "turn":
                size = 4
                break
            case "river":
                size = 5
                break
            case "endround":
                size = 5
                break
        }

        return this.community.slice(0, size)
    }

    _nextStep() {
        if (this._isAllBetsEqual(this.currentPhase) && this.alreadyPlayed >= this.getNumberOfPlayersOnRound()) {
            this._nextPhase()
        } else {
            this._nextPlayer()
        }
    }

    _isNull(value) {
        return (value === 0 || value === null || typeof(value) === "undefined")
    }

    raise(name, actionCallback, value) {
        this._action(name, "raise", actionCallback, value)
    }

    bet(name, actionCallback, value) {
        this._action(name, "bet", actionCallback, value)
    }

    fold(name, actionCallback) {
        this._action(name, "fold", actionCallback)
    }

    _action(name, type, actionCallback, value) {
        var pos = this.getPositionByName(name)
        var actualType = type
        var actualValue = value
        if (this.currentPlayer == -1) {
            throw new Exception("GameNotStarted", "The game is not started.")
        }
        if (!this.players[pos].onRound) {
            throw new Exception("OutOfRound", "You are out of this round, " + name + ".")
        }
        if (pos !== this.currentPlayer) {
            throw new Exception("NotYourTurn", "It is not your turn, " + name + ".")
        }
        if (type === "raise") {
            if (value < (this.currentBet + this.bigBlind)) {
                throw new Exception("TooLowBet", "The minimum raise is " + (this.currentBet + this.bigBlind) + ".")
            }
            this.currentBet = this.players[pos].getCurrentValueFromPlayer(this.currentPhase) + value
        } else if (type === "bet") {
            actualType = "bet"
            if (this.currentBet == 0 && this._isNull(value)) {
                actualType = "check"
            } else if (this.currentBet == 0 && value > 0) {
                actualValue = value
            } else {
                actualValue = this.currentBet - this.players[pos].getCurrentValueFromPlayer(this.currentPhase)
            }
        } else if (type === "fold") {
            this._removePlayerFromRound(pos)
            actualType = "fold"
        } else if (type === "allin") {

        }
        this.alreadyPlayed += 1
        this._transferMoneyToPot(actualValue)
        this._nextStep()
        actionCallback(name, actualType, actualValue, this.currentPhase)
    }
}

module.exports.PokerTable = PokerTable
},{"./card.js":1,"./player.js":3}]},{},[2])