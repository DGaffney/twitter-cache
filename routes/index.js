var express = require('express');
var router = express.Router();
var OAuth = require('oauth');
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
function result(response, e, data, res){
  console.log(response)
  console.log(e)
  console.log(data)
  console.log(res)
  if (e) console.error(e);
  response.json(data)
}
function get(service, req, response){
  return service.get(
    'https://api.twitter.com/1.1/'+req.params.endpoint_group+'/'+req.params.endpoint+'.json'+keysStringed(keys(service, req)),
    req.query.oauth_token,
    req.query.oauth_token_secret,
    result(response))
}
function post(service, req, response){
  return service.get(
    'https://api.twitter.com/1.1/'+req.params.endpoint_group+'/'+req.params.endpoint+'.json',
    req.query.oauth_token,
    req.query.oauth_token_secret,
    keys(service, req),
    result(response));
}
function routeGetRequest(req, response){
  get(service(req), req, response)
}
function routePostRequest(req, response){
  post(service(req), req, response)
}

router.get('/:service/:endpoint_group/:endpoint.json', function(req, res) {
  routeGetRequest(req, res)
});
router.post('/:service/:endpoint_group/:endpoint.json', function(req, res) {
  routePostRequest(req, res)
});

module.exports = router;
