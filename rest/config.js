
var FS=require("fs");

var NICK_PATTERN=/^[a-zA-Z_\-\[\]\\^{}|`][a-zA-Z0-9_\-\[\]\\^{}|`]*$/;
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
			target:"string",
			parameter:"string"
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
	"DCC":{
		"download folder":{
			type:"string",
			validate:function(path)
			{
				if (FS.existsSync(path)) return true;
				return "path does not exist";
			}
		},
		"suffix":{
			type:"string",
			default:".part"
		},
		"resume":{
			type:"boolean",
			default:true
		},
		"resume timeout":{
			type:"number",
			default:10000,
			min:500
		}
	},
	"networks":{
		type:"map",
		model:{
			"nickname":{
				type:"string",
				pattern:NICK_PATTERN
			},
			//"password":"string",
			"auto connect":{
				type:"boolean",
				default:false
			},
			"connect commands":commandDescription,
			"channels":{
				type:"map",
				model:{
					//"password":"string",
					"auto join":{
						type:"boolean",
						default:false
					},
					"join commands":commandDescription
				}
			}
		}
	}
});
