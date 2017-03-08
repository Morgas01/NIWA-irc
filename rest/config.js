
var NICK_PATTERN=/[a-zA-Z_\-\[\]\\^{}|`][a-zA-Z0-9_\-\[\]\\^{}|`]*/;
NICK_PATTERN.toJSON=RegExp.prototype.toString; // for serialization

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
			"connect commands":[
				{
					type:"map",
					model:"string"
				}
			],
			"DCC folder":"string",
			"channels":{
				type:"map",
				model:{
					"password":"string",
					"auto join":{
						type:"boolean",
						default:false
					},
					"join commands":{
						model:[{
							type:"map",
							model:"string"
						}]
					},
					"DCC folder":"string"
				}
			}
		}
	}
});
