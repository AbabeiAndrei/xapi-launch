"use strict";
var schemas = require("./schemas.js");
var requirejs = require('requirejs');
var session = require('express-session')
var async = require("async");
var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var ensureNotLoggedIn = require("./utils.js").ensureNotLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper;
var lockedKeys = {};
var config = require("./config.js").config;
var checkOwner = require("./users.js").checkOwner;
var URL = require("url");
exports.setup = function(app, DAL)
{
	app.get("/handler", ensureLoggedIn(function(req, res, next)
	{
		var contentURL = req.query.uri.replace("web+xapi://", "");
		//
		var content = URL.parse(contentURL, true);
		console.log(content);
		var launchData = content.query.launchData;
		var courseContext = content.query.courseContext;
		delete content.query.launchData;
		delete content.query.courseContext;
		delete content.search;
		contentURL = URL.format(content);
		DAL.getContent(contentURL, function(err, content)
		{
			if (content)
				return res.redirect("/launch/" + content._id + "?launchData=" + launchData + (courseContext ? ("&courseContext=" + courseContext) : ""))
			else // create new content
			{
				var request = {};
				request.url = contentURL;
				request.title = contentURL
				request.description = ""
				request.owner = config.admin_email;
				request.publicKey = null
				request.timeToConsume = 0;
				request.sessionLength = 0;
				request.mediaTypeKey = 0;
				request.launchType = "redirect";
				request.packageLink = null;
				request.iconURL = null;
				DAL.registerContent(request, function(err, newcontent)
				{
					if (err)
					{
						return res.status(500).send(err);
					}
					newcontent.save(function()
					{
						return  res.redirect("/launch/" + newcontent._id + "?launchData=" + launchData)	
					});
				});
				
			}
		})
	}));
}