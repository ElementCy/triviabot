
'use strict'

const slack = require('slack')
const _ = require('lodash')
const config = require('./config')
const request = require('request')

let bot = slack.rtm.client()

bot.started((payload) => {
  this.self = payload.self
  this.askedQuestion = false
  this.currQuestion = 'Nothing Yet'
  this.currAnswer = 'What is love?'
  this.currCategory = 'Hodgepodge'
  this.userHash = {}
  this._clearTrivia = function() {
    this.askedQuestion = false
    this.currAnswer = ''
    this.currQuestion = ''
    this.currCategory = ''
    clearTimeout(this.timerId)
    this.timeLeft = 30
  }
  this._sendMessage = function(chan, msg) {
    slack.chat.postMessage({
            token: config('SLACK_TOKEN'),
            icon_emoji: config('ICON_EMOJI'),
            channel: chan,
            username: 'triviabot',
            text: msg
          }, (err, data) => {
            if (err) throw err

            let txt = _.truncate(data.message.text)
          })
  }
  this.timerId = null
  this.timeLeft = 30
  this._doCountdown = function(chan) {
    if(this.timeLeft == 0) {
      var timesUp = 'Times up! The correct response was: ' + this.currAnswer
      this._sendMessage(chan, timesUp)
      console.log('times up!')
      this._clearTrivia()
    }
    else
    {
      this.timeLeft--;
      console.log(this.timeLeft)
    }
  }
})


bot.message((msg) => {
  if (!msg.user) return

  var self = this
  
  if(this.askedQuestion === true)
  {
    // check for answer
    console.log(msg.text)
    if(msg.text.toUpperCase() === self.currAnswer.toUpperCase())
    {
      var userName = ''
      if(self.userHash.hasOwnProperty(msg.user)) {
        userName = self.userHash[msg.user]
        var correct = 'Way to go, @' + userName + '. That is correct!'
        self._sendMessage(msg.channel, correct)
      }
      else {
        request({
          url:'https://slack.com/api/users.info',
          qs: {'token': config('SLACK_TOKEN'), 'user':msg.user}
        }, function(err, response, body){
          var userInfo = JSON.parse(body)
          self.userHash[msg.user] = userInfo.user.name
          userName = userInfo.user.name
          var correct = 'Way to go, @' + userName + '. That is correct!'
          self._sendMessage(msg.channel, correct)
        })
      }

      self._clearTrivia()
    }
  }else
  {
    if (!_.includes(msg.text.match(/<@([A-Z0-9])+>/igm), `<@${this.self.id}>`)) return
    
    var triviaType = ''

    if(msg.text.toUpperCase().indexOf('RANDOM') === -1) return

    request("http://jservice.io/api/random?count=1", function(err, response, body) {
      if(!err && response.statusCode === 200) {

        var trivia = JSON.parse(body)

        console.log(trivia[0])

        self.askedQuestion = true
        self.currQuestion = trivia[0].question
        self.currAnswer = trivia[0].answer
        self.currCategory = trivia[0].category.title

        var triviaPost = 'From the category: *' + trivia[0].category.title + '*, ' + trivia[0].question

        self._sendMessage(msg.channel, triviaPost)

        self.timerId = setInterval(self._doCountdown.bind(self, msg.channel), 1000)
      }
    })
  }
})

module.exports = bot
