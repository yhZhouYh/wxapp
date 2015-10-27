var crypto = require('crypto');

var JSSDK = function(appId,appSecret){
	this.appId = appId;
	this.appSecret = appSecret;
};
JSSDK.prototype = {
	addr_access_token:"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={0}&secret={1}",
	addr_ticket:"https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token={0}",
	addr_userToken:"https://api.weixin.qq.com/sns/oauth2/access_token?appid={0}&secret={1}&code={2}&grant_type=authorization_code",
	addr_userInfo:"https://api.weixin.qq.com/sns/userinfo?access_token={0}&openid={1}&lang=zh_CN",
	getSignPackage:function(url,callback){
		var _this = this;
		_this.getJsApiTicket(function(jsapiTicket){
			var timestamp = Math.round(new Date().getTime()/1000)
			var nonceStr = _this.createNonceStr();
			var string = "jsapi_ticket="+jsapiTicket+"&noncestr="+nonceStr+"&timestamp="+timestamp+"&url="+url;
			//var jsSHA = require('jssha');
			//var shaObj = new jsSHA(string, 'TEXT');
			//var signature = shaObj.getHash('SHA-1', 'HEX');

			var sha1 = crypto.createHash('sha1');
			sha1.update(string);
			var signature = sha1.digest('hex');
			console.log(signature);
			var signPackage = {
				"appId"     : _this.appId,
				"nonceStr"  : nonceStr,
				"timestamp" : timestamp,
				"url"       : url,
				"signature" : signature,
				"rawString" : string
			};
			callback(signPackage);
		});
	},
	createNonceStr:function(){
		return Math.random().toString(36).substr(2, 15);
	},
	getJsApiTicket:function(callback){
		var _this = this;
		var fs = require('fs');
		var data = JSON.parse(fs.readFileSync('./jsapi_ticket.json','utf8'));
		if(data.expire_time < Date.now()){
			_this.getAccessToken(function(accessToken){
				var url = _this.format(_this.addr_ticket,[accessToken]);
				_this.httpsGet(url,function(chunk){
					var ticket = JSON.parse(chunk).ticket;
					callback(ticket);
					if(ticket){
						data.expire_time = Date.now() + 7000000;
						data.jsapi_ticket = ticket;
						var options = {flag:'w'};
						fs.writeFileSync('./jsapi_ticket.json',JSON.stringify(data),options);
					}
				});
			});
		}else{
			callback(data.jsapi_ticket);
		}
	},
	getAccessToken:function(callback){
		var _this = this;
		var fs = require('fs');
		var data = JSON.parse(fs.readFileSync('./access_token.json','utf8'));
		if(data.expire_time < Date.now()){
			console.log(data.expire_time);
			var url = _this.format(_this.addr_access_token,[_this.appId,_this.appSecret]);
			_this.httpsGet(url,function(chunk){
				var access_token = JSON.parse(chunk).access_token;
					callback(access_token);
				if(access_token){
					data.expire_time = Date.now() + 7000000;
					data.access_token = access_token;
					var options = {flag:'w'};
					fs.writeFileSync('./access_token.json',JSON.stringify(data),options);
				}
			});
		}else{
			callback(data.access_token);
		}
	},
	httpsGet:function(url,callback){
		var https = require('https');
		https.get(url,function(res){
			res.on('data',function(chunk){
				callback(chunk);
			});
		});
	},
	getUserInfo:function(code,callback){
		var _this = this;
		var userObj = {};
		var token_url = _this.format(_this.addr_userToken,[_this.appId,_this.appSecret,code]);
		_this.httpsGet(token_url,function(obj){
			var obj = JSON.parse(obj.toString('utf8'));
			var access_token = obj.access_token;
			var openid = obj.openid;
			var userInfoUrl = _this.format(_this.addr_userInfo,[access_token,openid]);
			_this.httpsGet(userInfoUrl,function(userInfo){
				var userInfo = JSON.parse(userInfo.toString('utf8'));
				userObj.nickname = userInfo.nickname;
				userObj.access_token = access_token;
				userObj.uid = userInfo.unionid;
				userObj.headimgurl = userInfo.headimgurl
				callback(userObj);
			});
		});
	},
	format:function(url,arr){
		return url.replace(/\{(\d+)\}/g,function(){
			var p = arguments[0].replace(/[\{\}]/g,"");
			return arr[p];
		});
	}
};
module.exports = JSSDK;
