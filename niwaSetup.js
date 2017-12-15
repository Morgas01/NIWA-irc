require("niwa-download").register().registerLess();

let config=require("./rest/config");
config.ready.then(function(config)
{
	require("./lib/xdccManager")// load manager
	let ircManager=require("./lib/IrcManager")// load manager

	if(config.get("auto connect").get())
	{
		for (let entry of config.get("networks"))
		{
			let name=entry[0];
			let network=entry[1];

			if(network.get("auto connect").get())
			{
				return ircManager.connect(name);
			}
		}
	}
})
.catch(µ.logger.error);