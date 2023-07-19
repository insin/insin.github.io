var STORAGE_DATE_FORMAT = '%Y-%m-%d'
  , INPUT_DATE_FORMAT = '%d/%m/%Y'

// =================================================================== Utils ===

if (!Array.prototype.sum) {
  Object.defineProperty(Array.prototype, 'sum', {
    value: function() {
      return this.reduce(function(a, b) { return a + b}, 0)
    }
  })
}

// ================================================================ Entities ===

// ------------------------------------------------------------------ Player ---

function Player(name) {
  /**
   * Unique id, set by storage.
   */
  this.id = null
  /**
   * The player's name.
   */
  this.name = name
}

Player.prototype.toString = function() {
  return this.name
}

Player.prototype.toObject = function() {
  return {name: this.name}
}

Player.fromObject = function(obj, id) {
  var player = new Player(obj.name)
  player.id = id
  return player
}

// ------------------------------------------------------------------- Score ---

/**
 * Scoring for a Player in a sequence of games.
 */
function Score(player) {
  /**
   * The player this score is for.
   */
  this.player = player
  /**
   * Scores for each game the player has played in, by game index.
   */
  this.scores = []
  /**
   * Bounty points for each game the player has played in, by game index.
   */
  this.bountyPoints = []
  /**
   * Fish-chip points for each game the player has played in, by game index.
   */
  this.fishChipPoints = []
  /**
   * Number of games won by the player.
   */
  this.wins = 0
  /**
   * Ranking relative to other players in the same sequence of games.
   */
  this.ranking = null
}

/**
 * Gets a Score object for the given player, or creates and adds one.
 */
Score.getOrCreate = function(player, scores) {
  // Look for an existing Score
  for (var i = 0, l = scores.length; i < l; i++) {
    if (player === scores[i].player) {
      return scores[i]
    }
  }
  // Otherwise, create and add a new Score
  var score = new Score(player)
  scores.push(score)
  return score
}

Score.prototype.reset = function() {
  this.scores = []
  this.bonusPoints = []
  this.wins = 0
}

/**
 * Registers the score for the given game.
 */
Score.prototype.setScore = function(game, score) {
  this.scores[game.index] = score
}

/**
 * Registers bounty points earned for the given game.
 */
Score.prototype.setBountyPoints = function(game, bountyPoints) {
  this.bountyPoints[game.index] = bountyPoints
}

/**
 * Registers bounty points earned for the given game.
 */
Score.prototype.setFishChipPoints = function(game, fishChipPoints) {
  this.fishChipPoints[game.index] = fishChipPoints
}

/**
 * Registers that the player won a game.
 */
Score.prototype.win = function() {
  this.wins++
}

/**
 * Fiters undefined values out of the scores array, which is sparse.
 */
Score.prototype.getGameScores = function() {
  return this.scores.filter(function(s) { return typeof s != 'undefined'})
}

Score.prototype.getGamesPlayed = function() {
  return this.getGameScores().length
}

Score.prototype.getAveragePointsPerGame = function() {
  var scores = this.getGameScores()
  if (!scores.length) return 0
  return (scores.sum() / scores.length).toFixed(1)
}

Score.prototype.getBountyPoints = function() {
  return this.bountyPoints.sum()
}

Score.prototype.getFishChipPoints = function() {
  return this.fishChipPoints.sum()
}

Score.prototype.getBonusPoints = function() {
  return this.getBountyPoints() + this.getFishChipPoints()
}

Score.prototype.getLowestWeeklyPoints = function() {
  var scores = this.getGameScores()
  if (!scores.length) return 0
  return Math.min.apply(Math, scores)
}

Score.prototype.getOverallScore = function() {
  return this.getGameScores().slice(0)                              // Make a copy
                             .sort(function(a, b) { return b - a }) // Sort in descending order
                             .slice(0, 9)                           // Only take the top 9
                             .sum()                                 // Add 'em up
}

/**
 * Determines if this score ranks higher than another. Returns a negative number
 * if this score ranks higher, zero if the scores rank equally or a positive
 * number if the other score ranks higher, so this can be used with an array
 * sort to sort scores in winner-first fashion.
 */
Score.prototype.compareTo = function(score) {
  // Overall score, descending
  if (score.getOverallScore() != this.getOverallScore()) {
    return score.getOverallScore() - this.getOverallScore()
  }
  // Wins, descending
  else if (score.wins != this.wins) {
    return score.wins - this.wins
  }
  // Games played, ascending (higher average score is better)
  else if (this.getGamesPlayed() != score.getGamesPlayed()) {
    return this.getGamesPlayed() - score.getGamesPlayed()
  }
  // Fish-chip points, descending
  else if (score.getFishChipPoints() != this.getFishChipPoints()) {
    return score.getFishChipPoints() - this.getFishChipPoints()
  }
  // Name, ascending (blame your parents if you lose based on this!)
  else {
    return this.name == score.name ? 0 : (this.name < score.name ? -1 : 1)
  }
}

// ------------------------------------------------------------------ Season ---

/**
 * A 12 week season of poker games.
 */
function Season(name) {
  /**
   * Unique id, set by storage.
   */
  this.id = null
  /**
   * Whimsy, the obvious, whatever you like.
   */
  this.name = name
  /**
   * Games played in this season.
   */
  this.games = []
  /**
   * Scores for players who've played in this season.
   */
  this.scores = []
}

Season.prototype.toObject = function() {
  return {
    name: this.name
  , games: this.games.map(function(g) { return g.toObject() })
  }
}

Season.fromObject = function(obj, id) {
  var season = new Season(obj.name)
  season.id = id
  obj.games.forEach(function(gameObj) {
    season.addGame(Game.fromObject(gameObj), false)
  })
  season.sortScores
  return season
}

/**
 * Adds a game and calculates its scores.
 */
Season.prototype.addGame = function(game, sortScores) {
  // If this is not the first game, let it know about the previous game
  if (this.games.length) {
    game.setPreviousGameInfo(this.games[this.games.length - 1])
  }
  // Let the game know which index it's going to live at
  game.index = this.games.length
  // Link back to this season
  game.season = this
  this.games.push(game)
  game.calculateScores(this.scores)
  if (!sortScores) {
    this.sortScores()
  }
}

Season.prototype.lastGame = function() {
  return this.games.length ? this.games[this.games.length - 1] : null
}

/**
 * Sorts scores based on overall score and updates their rankings.
 */
Season.prototype.sortScores = function() {
  this.scores.sort(function(a, b) {
    return a.compareTo(b)
  })

  /**
   * Assigns a rank to a list of scores - if more than one score is gettig the
   * same rank, it will be suffixed with '='.
   */
  function assignRank(rank, scores) {
    var assignedRank = rank + (scores.length > 1 ? '=' : '')
    scores.forEach(function(score) {
      score.ranking = assignedRank
    })
  }

  // Update rankings
  var rank = 1
    , rankScores
    , comparisonScore
  for (var i = 0, l = this.scores.length; i < l; i++) {
    var score = this.scores[i]
    // Set up the first score check with the first score
    if (i == 0) {
      comparisonScore = score.getOverallScore()
      rankScores = [score]
    }
    // If subsequent scores are the same, we buffer them until we find the next
    // score which is lower.
    else if (score.getOverallScore() == comparisonScore) {
      rankScores.push(score)
    }
    // Scores are sorted by overallScore descending, so this one must be lower
    else {
      // Assign ranks to the buffered scores
      assignRank(rank, rankScores)
      // Increase the next rank to be given by the number of scores we just
      // assigned the same rank to.
      rank += rankScores.length
      // Reset score check and buffer to the current score
      comparisonScore = score.getOverallScore()
      rankScores = [score]
    }
    // Assign ranks to whatever's left in the buffer after the last score
    if (i == l - 1) {
      assignRank(rank, rankScores)
    }
  }
}

// -------------------------------------------------------------------- Game ---

function Game(date, results, knockouts) {
  /**
   * The season this game belongs to.
   */
  this.season = null
  /**
   * Index of this game in its Season's games.
   */
  this.index = null
  /**
   * Date the game was played on.
   */
  this.date = date
  /**
   * Players in the order they finished in, winner first.
   */
  this.results = results
  /**
   * Record who knocked out who, [perp, victim], for distribution of bonus
   * points.
   */
  this.knockouts = knockouts || []
  /**
   * Top 3 players from last game who are playing this game.
   */
  this.bountyPlayers = null
  /**
   * Lowest-placed player from last game who is playing this game.
   */
  this.fishChipper = null
  /**
   * The story of the game, as told by scoring log messages.
   */
  this.story = []
}

Game.prototype.toObject = function() {
  return {
    date: isomorph.time.strftime(this.date, STORAGE_DATE_FORMAT)
  , results: this.results.map(function(p) { return p.id })
  , knockouts: this.knockouts.map(function(ko) { return [ko[0].id, ko[1].id] })
  }
}

Game.fromObject = function(obj) {
  var dateParts = obj.date.split('-').map(Number)
  return new Game(
    isomorph.time.strpdate(obj.date, STORAGE_DATE_FORMAT)
  , obj.results.map(function(id) { return Players.get(id) })
  , obj.knockouts.map(function(ko) {
      return [Players.get(ko[0]), Players.get(ko[1])]
    })
  )
}

/**
 * Sets up information based on the previous game played, for bonus calculation.
 */
Game.prototype.setPreviousGameInfo = function(previousGame) {
  // Determine who has a bounty on their head
  this.bountyPlayers = []
  for (var i = 0, l = previousGame.results.length;
       i < l && this.bountyPlayers.length < 3;
       i++) {
    var player = previousGame.results[i]
    if (this.results.indexOf(player) != -1) {
      this.bountyPlayers.push(player)
    }
  }

  // Determine who has the fish-chip
  for (var i = previousGame.results.length - 1; i >= 0; i--) {
    var player = previousGame.results[i]
    if (this.results.indexOf(player) != -1) {
      this.fishChipper = player
      break
    }
  }
}

/**
 * Default distribution of points based on finishing position, winner first.
 */
Game.DEFAULT_POINTS = [15, 13, 11, 9, 7, 5, 4, 3, 2, 1]

/**
 * Bonus points awarded for having the fish-chip and being in the money.
 */
Game.FISH_CHIP_BONUS = 1

/**
 * Bonus points awarded for knocking out a top 3 player from the previous game.
 */
Game.BOUNTY_BONUS = 1

Game.prototype.getGameNumber = function() {
  return this.index + 1
}

Game.prototype.getWinner = function() {
  return this.results[0]
}

Game.prototype.getPaidPlayers = function() {
  // Determine how many players should get paid
  var playerCount = this.results.length
  var paid = (playerCount - (playerCount % 3)) / 3
  return this.results.slice(0, paid)
}

Game.prototype.calculateScores = function(scores) {
  this.story = []

  // Adjust points to cope with number of players if necessary
  var points = Game.DEFAULT_POINTS.slice(0)
  if (this.results.length > points.length) {
    var extraPoints = this.results.length - points.length
    // Add extra points to the defaults
    points = points.map(function(score) { return score + extraPoints})
    // Add new points, descending, so the player in last place gets 1 point
    while (extraPoints > 0) {
      points.push(extraPoints)
      extraPoints--
    }
  }

  if (this.bountyPlayers !== null) {
    this.log('Bounties issued for: ' + this.bountyPlayers.join(', ') + '.')
  }
  if (this.fishChipper !== null) {
    this.log(this.fishChipper.name + ' has the fish-chip.')
  }

  for (var i = 0, l = this.results.length; i < l; i++) {
    var player = this.results[i]
      , score = Score.getOrCreate(player, scores)
      , placeScore = points[i]
      , fishChipBonus = this.calculateFishChipBonus(player)
      , bountyBonus = this.calculateBountyBonus(player)
    if (i == 0) {
      score.win()
      if (this.bountyPlayers !== null && this.bountyPlayers.indexOf(player) != -1) {
        this.log(player + ' escaped with his own bounty!')
        bountyBonus++
      }
    }
    score.setScore(this, placeScore + fishChipBonus + bountyBonus)
    score.setFishChipPoints(this, fishChipBonus)
    score.setBountyPoints(this, bountyBonus)
  }

  for (var i = 0, l = this.knockouts.length; i < l; i++) {
    var ko = this.knockouts[i]
    this.log(ko[0].name + ' knocked out ' + ko[1].name)
  }

  this.log(this.getWinner() + ' wins!')
  this.log('In the money: ' + this.getPaidPlayers().join(', '))
}

/**
 * Calculates bonus points based on the given player ending up in the money
 * after losing the previous game.
 */
Game.prototype.calculateFishChipBonus = function(player) {
  var fishChipBonus = 0
  if (player === this.fishChipper) {
    var paidPlayers = this.getPaidPlayers()
    if (paidPlayers.indexOf(player) != -1) {
      this.log(player + ' gets a bonus point for cashing in with the fish-chip!')
      fishChipBonus += Game.FISH_CHIP_BONUS
    }
  }
  return fishChipBonus
}

/**
 * Calculates bonus points based on the given player having knocked out a
 * bounty player.
 */
Game.prototype.calculateBountyBonus = function(player) {
  var bountyBonus = 0
  if (this.bountyPlayers !== null) {
    for (var i = 0, l = this.knockouts.length; i < l; i++) {
      var knockout = this.knockouts[i]
      if (knockout[0] === player && this.bountyPlayers.indexOf(knockout[1]) != -1) {
        this.log(player + ' cashes in the bounty on ' + knockout[1] + '!')
        bountyBonus += Game.BOUNTY_BONUS
      }
    }
  }
  return bountyBonus
}

Game.prototype.log = function(message) {
  this.story.push(message)
}

// ----------------------------------------------------------------- Storage ---

/**
 * Wrapper around localStorage which stores instances in an array, using its
 * indices as ids.
 */
var LocalStorage = Concur.extend({
  constructor: function(entity, storageKey) {
    if (typeof entity.fromObject != 'function') {
      throw new Error(storageKey + ': LocalStorage entities must define a static fromObject() function.')
    }
    if (typeof entity.prototype.toObject != 'function') {
      throw new Error(storageKey + ': LocalStorage entities must define a toObject() instance method.')
    }
    this._entity = entity
    this._storageKey = storageKey
    /**
     * Working copy of stored data, null indicates that it hasn't been
     * initialised from localStorage yet.
     */
    this._store = null
  }

  /**
   * Loads JSON from localStorage and uses the entity's fromObject() to
   * initialise the storage array.
   */
, _load: function() {
    var json = localStorage.getItem(this._storageKey)
    // If this is the first load, there won't be any data
    this._store = json ? JSON.parse(json).map(this._entity.fromObject) : []
  }

  /**
   * Saves the current working copy to localStorage using the entity's
   * toObject() method to create plain data representations to be stringified.
   */
, _save: function() {
    var json = JSON.stringify(this._store.map(
      function(instance) { return instance.toObject() }
    ))
    localStorage.setItem(this._storageKey, json)
  }

  /**
   * Gets the storage array for the entity, initialising it first if necessary.
   */
, _getStore: function() {
    if (this._store === null) {
      this._load()
    }
    return this._store
  }

  /**
   * Gets all instances of the entity - altering the array won't affect the
   * working copy, but altering an instance will.
   */
, all: function() {
    return this._getStore().slice(0)
  }

  /**
   * Gets the instances with the given id.
   */
, get: function(id) {
    return this._getStore()[id]
  }

  /**
   * Determines the next available id (working copy array index).
   */
, nextId: function() {
    return this._getStore().length
  }

  /**
   * Generates an id for the given instance and stores it.
   */
, add: function(instance) {
    instance.id = this.nextId()
    this._getStore().push(instance)
    this._save()
    return instance
  }

  /**
   * Saves an existing instance - in practice this means writing the job lot to
   * localStorage, but that's just this crappy implmentation.
   */
, save: function(instance) {
    this._save()
  }
})

var Players = new LocalStorage(Player, 'players')
var Seasons = new LocalStorage(Season, 'seasons')

// =============================================================== Templates ===

// ---------------------------------------------------------- Template Nodes ---

var templateAPI = DOMBuilder.modes.template.api

/**
 * Provides an event-handling function and optionally partially applies
 * arguments to it. The function can be provided directly or as a template
 * variable and any arguments are expected to come from template variables.
 */
var EventHandlerNode = templateAPI.TemplateNode.extend({
  constructor: function(func, args) {
    args = args || []
    this.func = (typeof func == 'function' ? func : new templateAPI.Variable(func))
    this.args = args.map(function(arg) {
      return (arg instanceof templateAPI.Variable ? arg : new templateAPI.Variable(arg))
    })
  }

, render: function(context) {
    var func = (typeof this.func == 'function' ? this.func : this.func.resolve(context))
      , args = this.args.map(function(arg) { return arg.resolve(context) })
    return function() {
      func.apply(this, args.concat(Array.prototype.slice.call(arguments)))
    }
  }
})

/**
 * Provides access to construct an EventHandlerNode in templates.
 */
DOMBuilder.template.$handler = function(func) {
  return new EventHandlerNode(func, Array.prototype.slice.call(arguments, 1))
}

// --------------------------------------------------------------- Templates ---

void function() { with (DOMBuilder.template) {

var template = DOMBuilder.template

function toggleAddButton(text) {
  return template.DIV({'class': 'form-actions'}
  , template.BUTTON({'class': 'btn btn-primary', type: 'button', click: function(e) {
      this.parentNode.nextSibling.classList.toggle('hide')
      this.parentNode.classList.toggle('hide')
    }}, text)
  )
}

function toggleCancelButton() {
  return template.BUTTON({'class': 'btn', type: 'button', click: function(e) {
    this.form.classList.toggle('hide')
    this.form.previousSibling.classList.toggle('hide')
    this.form.reset()
  }}, 'Cancel')
}

$template('league_table'
, TABLE({'class': 'table table-striped table-bordered table-condensed'}
  , THEAD(TR(
      TH('Player')
    , TH('Games Played')
    , TH('Wins')
    , TH('Average Points Per Game')
    , TH('Bonus Points')
    , TH('Lowest Weekly Points')
    , TH('Overall Points')
    , TH('Ranking')
    ))
  , TBODY($for('score in scores'
    , TR(
        TD(
          A({href: '#', click: $handler(displayPlayer, 'score.player')}
          , '{{ score.player.name }}'
          )
        )
      , TD('{{ score.getGamesPlayed }}')
      , TD('{{ score.wins }}')
      , TD('{{ score.getAveragePointsPerGame }}')
      , TD('{{ score.getBonusPoints }}')
      , TD('{{ score.getLowestWeeklyPoints }}')
      , TD('{{ score.getOverallScore }}')
      , TD('{{ score.ranking }}')
      )
    ))
  )
)

$template('index'
, $if('season'
  , DIV({'class': 'page-header'}
    , H1(
        A({href: '#', click: $handler(displaySeason, 'season')}, '{{ season.name }}')
      , ' League Table'
      )
    )
  , $if('season.games.length'
    , $include('league_table', {scores: $var('season.scores')})
    , $else(DIV({'class': 'alert alert-info'}
      ,'The League Table will begin as soon as some games have been played.'
      ))
    )
  , $else(
      DIV({'class': 'alert alert-info'}, 'There are no Seasons set up yet.')
    )
  )
)

$template('player_list'
, DIV({'class': 'page-header'}
  , H1('Players')
  )
, $if('players.length'
  , UL($for('player in players'
    , LI(A({href: '#', click: $handler(displayPlayer, 'player')}, '{{ player.name }}'))
    ))
  , $else(DIV({'class': 'alert alert-info'}, 'None yet - add one below.'))
  )
, toggleAddButton('Add Player')
, FORM({id: 'addPlayerForm', 'class': 'form-horizontal hide', submit: addPlayer}
  , FIELDSET(
      LEGEND('Add Player')
    , DIV({'class': 'control-group'}
      , LABEL({'class': 'control-label', 'for': 'name'}, 'Name')
      , DIV({'class': 'controls'}
        , INPUT({'class:': 'input-large', type: 'text', name: 'name', id: 'name'})
        , P({'class': 'help-block hide'})
        )
      )
    , DIV({'class': 'form-actions'}
      , BUTTON({'class': 'btn btn-primary', type: 'submit'}, 'Add Player')
      , ' '
      , toggleCancelButton()
      )
    )
  )
)

// TODO
$template('player_details'
, DIV({'class': 'page-header'}
  , H1('Player: {{ player.name }}')
  )
, H2('All-Time Rankings')
, $for('season, score in seasonScores'
  , H3(
      'Season: '
    , A({href: '#', click: $handler(displaySeason, 'season')}, '{{ season.name }}')
    )
  , TABLE({'class': 'table table-striped table-bordered table-condensed'}
    , THEAD(TR(
        TH('Games Played')
      , TH('Wins')
      , TH('Average Points Per Game')
      , TH('Bonus Points')
      , TH('Lowest Weekly Points')
      , TH('Overall Points')
      , TH('Ranking')
      ))
    , TBODY(
        TR(
          TD('{{ score.getGamesPlayed }}')
        , TD('{{ score.wins }}')
        , TD('{{ score.getAveragePointsPerGame }}')
        , TD('{{ score.getBonusPoints }}')
        , TD('{{ score.getLowestWeeklyPoints }}')
        , TD('{{ score.getOverallScore }}')
        , TD('{{ score.ranking }}')
        )
      )
    )
  , $empty("This player hasn't played any games yet.")
  )
)

$template('season_list'
, DIV({'class': 'page-header'}
  , H1('Seasons')
  )
, $if('seasons.length'
  ,TABLE({'class': 'table table-striped table-bordered table-condensed'}
    , THEAD(TR(
        TH('Name')
      , TH('Games Played')
      ))
    , TBODY($for('season in seasons'
      , TR(
          TD(
            A({href: '#', click: $handler(displaySeason, 'season')}
            , '{{ season.name }}'
            )
          )
        , TD('{{ season.games.length }}')
        )
      ))
    )
  , $else(DIV({'class': 'alert alert-info'}, 'None yet - add one below.'))
  )
, toggleAddButton('Add Season')
, FORM({id: 'addSeasonForm', 'class': 'form-horizontal hide', submit: addSeason}
  , FIELDSET(
      LEGEND('Add Season')
    , DIV({'class': 'control-group'}
      , LABEL({'class': 'control-label', 'for': 'name'}, 'Name')
      , DIV({'class': 'controls'}
        , INPUT({'class:': 'input-large', type: 'text', name: 'name', id: 'name'})
        , P({'class': 'help-block hide'})
        )
      )
    , DIV({'class': 'form-actions'}
      , BUTTON({'class': 'btn btn-primary', type: 'submit'}, 'Add Season')
      , ' '
      , toggleCancelButton()
      )
    )
  )
)

$template('season_details'
, DIV({'class': 'page-header'}
  , H1('Season: {{ season.name }}')
  )
, H2('Games')
, $if('season.games.length'
  , TABLE({'class': 'table table-striped table-bordered table-condensed'}
    , THEAD(TR(
        TH()
      , TH('Players')
      , TH('Played On')
      , TH('Winner')
      ))
    , TBODY($for('game in season.games'
      , TR(
          TD(A({href: '#', click: $handler(displayGame, 'game')}, 'Game {{ game.getGameNumber }}'))
        , TD('{{ game.results.length }}')
        , TD('{{ game.date.toDateString }}')
        , TD(A({href: '#', click: $handler(displayPlayer, 'game.getWinner')}, '{{ game.getWinner.name }}'))
        )
      ))
    )
  , $else(DIV({'class': 'alert alert-info'}, 'None yet - add one below.'))
  )
, toggleAddButton('Add Game')
, FORM({id: 'addGameForm', 'class': 'form-horizontal hide', submit: $handler(addGame, 'season')}
  , FIELDSET(
      LEGEND('Add Game')
    , DIV({'class': 'control-group'}
      , LABEL({'class': 'control-label', 'for': 'date'}, 'Date')
      , DIV({'class': 'controls'}
        , INPUT({type: 'text', name: 'date', id: 'date', placeholder: 'DD/MM/YYYY'})
        , P({'class': 'help-block hide'})
        )
      )
    , DIV({'class': 'control-group'}
      , LABEL({'class': 'control-label'}, 'Results')
      , DIV({'class': 'controls'}
        , $if('players.length'
          , TABLE({'class': 'table table-condensed table-controls', style: 'width: auto'}
            , THEAD(TR(
                TH({style: 'width: 150px'}, 'Player')
              , TH({style: 'width: 350px'}, 'Position')
              ))
            , TBODY($for('player in players'
              , TR(
                  TD(LABEL({'for': 'position{{ forloop.counter }}'}, '{{ player.name }}'))
                , TD(
                    INPUT({type: 'hidden', name: 'player', value: '{{ player.id }}'})
                  , INPUT({type: 'text', name: 'position', id: 'position{{ forloop.counter }}', 'class': 'input-mini'})
                  , SPAN({'class': 'help-inline hide'})
                  )
                )
              ))
            )
          , $else(
              DIV({'class': 'alert alert-info'}
              , 'There are no Players registered yet - add some on the '
              , A({href: '#', click: playersList}, 'Players')
              , ' page.'
              )
            )
          )
        , P({'class': 'help-block hide', id: 'results-help'})
        )
      )
    , DIV({'class': 'control-group'}
      , LABEL({'class': 'control-label'}, 'Knockouts')
      , DIV({'class': 'controls'}
        , DIV({'class': 'control-knockout'}
          , SELECT({'name': 'perp'}
            , OPTION({value: ''}, '----')
            , $for('player in players'
              , OPTION({value: '{{ player.id }}'}, '{{ player.name }}')
              )
            )
          , ' knocked out '
          , SELECT({'name': 'victim'}
            , OPTION({value: ''}, '----')
            , $for('player in players'
              , OPTION({value: '{{ player.id }}'}, '{{ player.name }}')
              )
            )
          , P({'class': 'help-block hide'})
          )
        , P(BUTTON({'class': 'btn btn-success', type: 'button', click: cloneKnockout}
          , I({'class': 'icon-plus icon-white'})
          , ' Add'
          ))
        )
      )
    , DIV({'class': 'form-actions'}
      , BUTTON({'class': 'btn btn-primary', type: 'submit', name: 'submitBtn'}, 'Add Game')
      , ' '
      , toggleCancelButton()
      , P({'class': 'help-block hide'})
      )
    )
  )
, H2('League Table')
, $if('season.games.length'
  , $include('league_table', {scores: $var('season.scores')})
  , $else(DIV({'class': 'alert alert-info'}
    ,'The League Table will begin as soon as some games have been played.'
    ))
  )
)

$template('game_details'
, DIV({'class': 'page-header'}
  , H1(
      'Game {{ game.getGameNumber }} in '
    , A({href: '#', click: $handler(displaySeason, 'game.season')}, '{{ game.season.name }}')
    , ', played on {{ game.date.toDateString }}'
    )
  )
, H2('Story of the Game')
, $for('line in game.story'
  , P('{{ line }}')
  )
, UL({'class': 'pager'}
  , $if('previousGame'
    , LI({'class': 'previous'}
      , A({href: '#', click: $handler(displayGame, 'previousGame')}, '\u2190 Previous Game')
      )
    )
  , $if('nextGame'
    , LI({'class': 'next'}
      , A({href: '#', click: $handler(displayGame, 'nextGame')}, 'Next Game \u2192')
      )
    )
  )
)

}}()

// =================================================================== Views ===

// ------------------------------------------------------------------- Utils ---

function stop(e) {
  e.preventDefault()
  e.stopPropagation()
}

function displayContent(templateName, contextVariables) {
  var el = document.getElementById('contents')
  el.innerHTML = ''
  el.appendChild(DOMBuilder.template.renderTemplate(templateName, contextVariables))
}

/**
 * Shows a error message in a help element if it is not null, otherwise hide
 * and clears the element. If a container is given, an error class will be added
 * or removed, as appropriate.
 */
function toggleError(errorMessage, help, container) {
  if (errorMessage !== null) {
    if (container) {
      container.classList.add('error')
    }
    help.classList.remove('hide')
    help.textContent = errorMessage
  }
  else {
    if (container) {
      container.classList.remove('error')
    }
    help.classList.add('hide')
    help.textContent = ''
  }
}

function cloneKnockout(e) {
  // "+ Add" button -> first KO node
  var ko = this.parentNode.parentNode.firstChild.cloneNode(true)
  var el = DOMBuilder.dom
  // Create and insert a "- Remove" button
  ko.insertBefore(
    el.SPAN({'class': 'help-inline'}
    , el.BUTTON({'class': 'btn btn-danger', type: 'button', click: function(e) {
        this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode)
      }}, el.I({'class': 'icon-minus icon-white'}), ' Remove')
    )
  , ko.lastChild
  )
  // Reset any error display the first KO node may have before inserting
  toggleError(null, ko.lastChild, ko)
  this.parentNode.insertBefore(ko, this)
}

function activateNav(linkId) {
  var navLinks = document.getElementById('navLinks')
    , link = linkId !== null ? document.getElementById(linkId) : null
    , item = link !== null ? link.parentNode : null
  for (var el = navLinks.firstElementChild; el; el = el.nextElementSibling) {
    if (el === item) {
      el.classList.add('active')
    }
    else {
      el.classList.remove('active')
    }
  }
}

// ---------------------------------------------------------- View Functions ---

function index(e) {
  if (e) stop(e)
  activateNav(null)
  displayContent('index', {
    season: Seasons.all().pop()
  })
}

function playersList(e) {
  if (e) stop(e)
  activateNav('navPlayers')
  displayContent('player_list', {
    players: Players.all()
  })
}

function addPlayer(e) {
  if (e) stop(e)
  var form = document.getElementById('addPlayerForm')
    , name = form.elements.name.value
    , help = form.elements.name.nextSibling
    , container = help.parentNode.parentNode
    , errorMessage = name ? null : 'Name is required to add a new Player.'
  toggleError(errorMessage, help, container)
  if (!name) {
    return
  }

  var player = Players.add(new Player(name))
  playersList()
}

function displayPlayer(player, e) {
  if (e) stop(e)
  activateNav('navPlayers')
  var seasonScores = []
  Seasons.all().forEach(function(season) {
    for (var i = 0, l = season.scores.length; i < l; i++) {
      var score = season.scores[i]
      if (score.player === player) {
        seasonScores.push([season, score])
        break
      }
    }
  })
  displayContent('player_details', {
    player: player
  , seasonScores: seasonScores
  })
}

function seasonsList(e) {
  if (e) stop(e)
  activateNav('navSeasons')
  displayContent('season_list', {
    seasons: Seasons.all()
  })
}

function addSeason(e) {
  if (e) stop(e)
  var form = document.getElementById('addSeasonForm')
    , name = form.elements.name.value
    , help = form.elements.name.nextSibling
    , container = help.parentNode.parentNode
    , errorMessage = name ? null : 'Name is required to add a new Season.'
  toggleError(errorMessage, help, container)
  if (!name) {
    return
  }

  var season = Seasons.add(new Season(name))
  displaySeason(season)
}

function displaySeason(season, e) {
  if (e) stop(e)
  activateNav('navSeasons')
  displayContent('season_details', {
    season: season
  , players: Players.all()
  })
}

function addGame(season, e) {
  if (e) stop(e)
  var form = document.getElementById('addGameForm')
    , valid = true

  // Game date input and validation
  var date = (function() {
    var date = null
      , el = form.elements.date
      , container = el.parentNode.parentNode
      , help = el.nextSibling
      , errorMessage = null
    try {
      date = isomorph.time.strpdate(form.elements.date.value, INPUT_DATE_FORMAT)
    }
    catch (e) {
      errorMessage = 'Enter a valid date in DD/MM/YYYY format.'
      valid = false
    }
    toggleError(errorMessage, help, container)
    return date
  })()

  // Player position result input and validation
  var playerPositions = (function() {
    var playerPositionsValid = true
      , positions = Array.prototype.slice.call(form.elements.position || [])
      , resultsHelp = document.getElementById('results-help')
      , resultsContainer = resultsHelp.parentNode.parentNode
      , resultsErrorMessage = null
    // All blank is invalid
    if (positions.filter(function(el) { return el.value != '' }).length == 0) {
      resultsErrorMessage = 'For each player who played, enter the position they finished in.'
    }
    if (resultsErrorMessage !== null) playerPositionsValid = valid = false
    toggleError(resultsErrorMessage, resultsHelp, resultsContainer)

    // Check that position inputs are valid - keep going even if we detected
    // that all inputs are blank in order to clear individual error messages.
    positions.forEach(function(el) {
      var container = el.parentNode.parentNode
        , help = el.nextSibling
        , errorMessage = null
      // Blank is valid, as we've verified that they're not all blank and not
      // all players have to play in each game.
      if (el.value != '') {
        if (!/^\d+$/.test(el.value)) {
          errorMessage = 'Positions must be numeric.'
        }
        else if (parseInt(el.value, 10) > Players.all().length) {
          errorMessage = 'Position greater than number of players.'
        }
      }
      if (errorMessage !== null) playerPositionsValid = valid = false
      toggleError(errorMessage, help, container)
    })

    if (!playerPositionsValid) return null

    // If we're still good, check for gaps
    var expected = 1
      , sorted = positions.slice()
                          .filter(function(el) { return el.value != '' })
                          .sort(function(a, b) {
                             return parseInt(a.value, 10) - parseInt(b.value, 10)
                           })
    for (var i = 0, l = sorted.length ; i < l; i++) {
      var el = sorted[i]
        , position = parseInt(el.value, 10)
        , container = el.parentNode.parentNode
        , help = el.nextSibling
        , errorMessage = null
      // Stop checking after the first invalid position, but keep looping to
      // clear any previous validation errors which may have been displayed.
      if (playerPositionsValid && position != expected) {
        errorMessage = 'Expected position ' + expected + ' to be assigned first.'
      }
      if (errorMessage !== null) playerPositionsValid = valid = false
      toggleError(errorMessage, help, container)
      expected++
    }

    if (!playerPositionsValid) return null

    // Input looks good, so create player position array
    var playerPositions = []
      , players = Array.prototype.slice.call(form.elements.player)
    positions.forEach(function(el, i) {
      if (el.value != '') {
        var position = parseInt(el.value, 10)
          , playerId = parseInt(players[i].value, 10)
        playerPositions[position - 1] = Players.get(playerId)
      }
    })
    return playerPositions
  })()

  // Knockouts input and validation
  var knockouts = (function() {
    var knockouts = []
      , knockoutsValid = true
      , perpEls = form.elements.perp
      , victimEls = form.elements.victim
      , victims = []
    if (typeof perpEls.nodeType != 'undefined') {
      perpEls = [perpEls]
      victimEls = [victimEls]
    }
    for (var i = 0, l = perpEls.length; i < l; i++) {
      var perpId = perpEls[i].value
        , victimId = victimEls[i].value
        , container = victimEls[i].parentNode
        , help = container.lastChild
        , errorMessage = null
      if (perpId == '' || victimId == '') {
        errorMessage = 'Select a player from each dropdown.'
      }
      else if (perpId == victimId) {
        errorMessage ='A player cannot knock themselves out.'
      }
      else {
        var perp = Players.get(parseInt(perpId, 10))
          , victim = Players.get(parseInt(victimId, 10))
        // Validate that selected players were actually playing in this game
        if (playerPositions && playerPositions.indexOf(perp) == -1) {
          errorMessage = perp.name + " didn't play in this game (no position entered)."
        }
        else if (playerPositions && playerPositions.indexOf(victim) == -1) {
          errorMessage = victim.name + " didn't play in this game (no position entered)."
        }
        else if (playerPositions && playerPositions.indexOf(victim) == 0) {
          errorMessage = "You can't knock the winner out."
        }
        // Validate that selected players haven't already been knocked out
        else if (victims.indexOf(perp) != -1) {
          errorMessage = perp.name + ' has already been knocked out.'
        }
        else if (victims.indexOf(victim) != -1) {
          errorMessage = victim.name + ' has already been knocked out.'
        }
        else {
          knockouts.push([perp, victim])
        }
      }
      if (errorMessage !== null) knockoutsValid = valid = false
      toggleError(errorMessage, help, container)
    }
    return knockouts
  })()

  // If the form is invalid, display an extra message below the submit button
  var btn = form.elements.submitBtn
    , help = btn.parentNode.lastChild
    , errorMessage = valid ? null : 'Please correct input errors.'
  toggleError(errorMessage, help)
  if (!valid) {
    return
  }

  // Add the game to its season
  season.addGame(new Game(date, playerPositions, knockouts))
  Seasons.save(season)
  displaySeason(season)
}

function displayGame(game, e) {
  if (e) stop(e)
  var season = game.season
  displayContent('game_details', {
    game: game
  , previousGame: game.index > 0 ? season.games[game.index - 1] : null
  , nextGame: (game.index < season.games.length - 1
               ? season.games[game.index + 1]
               : null)
  })
}

// ==================================================================== Init ===

document.getElementById('navIndex').onclick = index
document.getElementById('navSeasons').onclick = seasonsList
document.getElementById('navPlayers').onclick = playersList

index()
