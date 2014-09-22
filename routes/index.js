var express = require('express');
var router = express.Router();
var OAuth = require('oauth');
var md5 = require('MD5');

function getTwitterClient(req){
  var oauth = new OAuth.OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      req.query.consumer_key,
      req.query.consumer_secret,
      '1.0A',
      null,
      'HMAC-SHA1'
    );
    return oauth
}

function service(req){
  if (req.params.service == "twitter"){
    return getTwitterClient(req)
  } else {
    return null
  }
}
function keysStringed(usefulKeys){
  var path=  ""
  if (usefulKeys != {}){
    path = "?"
  }
  var first = true
  Object.keys(usefulKeys).forEach(function(key){
    if (first){
      path = path+key+'='+usefulKeys[key]
      first = false
    } else {
      path = path+'&'+key+'='+usefulKeys[key]
    }
  })
  return path
}
function keys(service, req){
  var usefulKeys = {}
  Object.keys(req.query).forEach(function(key) {
    if (["consumer_key", "consumer_secret", "oauth_token", "oauth_token_secret"].indexOf(key) == -1) usefulKeys[key] = req.query[key]
  });
  return usefulKeys
}
function store(req, doc, data){
  doc.content = JSON.parse(data)
  doc.created_at = new Date()
  doc.updated_at = doc.created_at
  req.db.get('cache').insert([doc], {w:1}, function(err, result) {console.log(err);console.log("Wrote to db.")})
}

function update(req, doc, existing, data){
  existing.content = JSON.parse(data)
  existing.updated_at = new Date()
  req.db.get('cache').update({lookup: doc.lookup}, existing, {w:1}, function(err, result) {console.log(err);console.log("Updated Document")});
}

router.get('/:service/*:path\.json', function(req, res) {
  var db = req.db;
  var collection = db.get('cache');
  var apiParams = keys(req.params.service, req)
  var docMeta = {query: apiParams, service: req.params.service, endpoint: req.params.path+req.params['0']}
  docMeta.lookup = md5(docMeta)
  console.log(md5(docMeta))
  collection.find({lookup: docMeta.lookup}, function(e,doc){
    console.log(doc[0] && doc[0].updated_at <= new Date(new Date()-1000*60*60*24*7))
    if (doc[0] && doc[0].updated_at > new Date(new Date()-1000*60*60*24*7)){
      console.log("Responded with Stored.")
      res.send(doc[0].content)
    } else if (doc[0] && doc[0].updated_at <= new Date(new Date()-1000*60*60*24*7)){
      getTwitterClient(req).get(
        'https://api.twitter.com/1.1/'+req.params.path+req.params['0']+'.json'+keysStringed(apiParams),
        req.query.oauth_token,
        req.query.oauth_token_secret,
        function (e, data, resp){
          if (e) console.error(e);
          update(req, docMeta, doc[0], data)
          res.send(data)
        }
      )
    } else if (doc[0] == null) {
      console.log(doc)
      getTwitterClient(req).get(
        'https://api.twitter.com/1.1/'+req.params.path+req.params['0']+'.json'+keysStringed(apiParams),
        req.query.oauth_token,
        req.query.oauth_token_secret,
        function (e, data, resp){
          if (e) console.error(e);
          store(req, docMeta, data)
          res.send(data)
        }
      )
    }
  });
});
router.post('/:service/*:path\.json', function(req, res) {
return res.json(getTwitterClient(req).get(
  'https://api.twitter.com/1.1/'+req.params.path+'.json',
  req.query.oauth_token,
  req.query.oauth_token_secret,
  keys(service, req),
  result(response)));
});

module.exports = router;
