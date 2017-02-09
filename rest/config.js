module.exports=µ.getModule("configManager")({

	"nickname":{
		type:"string",
		pattern:/[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*/i
	},
	"auto connect":{
		type:"boolean",
		default:false
	},
	"DCC folder":"string",
	"networks":{
		type:"map",
		model:{
			"password":"string",
			"auto connect":{
				type:"boolean",
				default:false
			},
			"join commands":{
				model:[{
					type:"map",
					model:"string"
				}]
			},
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
