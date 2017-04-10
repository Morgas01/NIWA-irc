
var NICK_PATTERN=/[a-zA-Z_\-\[\]\\^{}|`][a-zA-Z0-9_\-\[\]\\^{}|`]*/;
NICK_PATTERN.toJSON=RegExp.prototype.toString; // for serialization

var commandDescription={
	type:"array",
	model:{
		type:"object",
		model:{
			command:{
				type:"select",
				values:["message","whois"]
			},
			param:"string"
		}
	}
};

module.exports=µ.getModule("configManager")({
	"nickname":{
		type:"string",
		pattern:NICK_PATTERN
	},
	"auto connect":{
		type:"boolean",
		default:false
	},
	"DCC folder":"string",
	"networks":{
		type:"map",
		model:{
			"nickname":{
				type:"string",
				pattern:NICK_PATTERN
			},
			"password":"string",
			"auto connect":{
				type:"boolean",
				default:false
			},
			"connect commands":commandDescription,
			"DCC folder":"string",
			"channels":{
				type:"map",
				model:{
					"password":"string",
					"auto join":{
						type:"boolean",
						default:false
					},
					"join commands":commandDescription,
					"DCC folder":"string"
				}
			}
		}
	}
});
