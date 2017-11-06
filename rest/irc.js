(function(µ,SMOD,GMOD,HMOD,SC){

	let config=require("./config");
	let FS=require("fs");

	SC=SC({
		xdccManager:require.bind(null,"../lib/xdccManager"),
		ircManager:require.bind(null,"../lib/IrcManager"),
		Download:"NIWA-Download.Download"
	});


	module.exports={
		connect:function(param)
		{
			if(param.method!="POST"||!param.data.host)
			{
				return Promise.reject('POST Json like:{host:"myHost"[,nickname:"myNick"[,password:"myPassword"]}');
			}
			else
			{
				return SC.ircManager.connect(param.data.host,param.data.nickname,param.data.password,param.reconnect)
				.then(µ.constantFunctions.ndef);
			}
		},
		message:function(param)
		{
			if(param.method!="POST"||!param.data.network||!param.data.target||!param.data.text)
			{
				return Promise.reject('POST Json like:{network:"myNetwork",target:"myTarget",text:"myText"}');
			}
			else
			{
				return SC.ircManager.message(param.data.network,param.data.target,param.data.text);
			}
		},
		join:function(param)
		{
			if(param.method!="POST"||!param.data.network||!param.data.channel)
			{
				return Promise.reject('POST Json like:{network:"myNetwork",channel:"myChannel"}');
			}
			else
			{
				return SC.ircManager.join(param.data.network,param.data.channel);
			}
		},
		whois:function(param)
		{
			if(param.method!="POST"||!param.data.network||!param.data.user)
			{
				return Promise.reject('POST Json like:{network:"myNetwork",user:"myUser"}');
			}
			else
			{
				return SC.ircManager.whois(param.data.network,param.data.user);
			}
		},
		dcc:function(param)
		{
			if(param.method!="POST"||!param.data.network||!param.data.user||!param.data.ip||!param.data.port||!param.data.filename)
			{
				return Promise.reject('POST Json like:{network:"myNetwork",user:"myUser",ip:"ip",port:"port",filepath:"filepath",filename:"filename"}');
			}
			else
			{
				return config.ready
				.then(function(config)
				{
					let download=new SC.Download({
						state:SC.Download.states.RUNNING,
						dataSource:{
							network:param.data.network,
							user:param.data.user,
							ip:param.data.ip,
							port:param.data.port,
						},
						filename:param.data.filename,
						filepath:param.data.filepath||config.get(["DCC","download folder"]).get()
					});
					SC.xdccManager.startDownload(download);
				});
			}
		},
		xdcc:function(param)
		{
			if(param.method!="POST"||!param.data.network||!param.data.user||!param.data.packnumber)
			{
				return Promise.reject('POST Json like:{network:"myNetwork",user:"myUser",packnumber:1234}');
			}
			else
			{
				return config.ready
				.then(function(config)
				{
					let download=new SC.Download({
						state:SC.Download.states.RUNNING,
						dataSource:{
							network:param.data.network,
							user:param.data.user,
							packnumber:param.data.packnumber
						},
						filename:param.data.filename,
						filepath:param.data.filepath||config.get(["DCC","download folder"]).get()
					});
					SC.xdccManager.add(download)
					.then(()=>SC.xdccManager.startDownload(download));
				});
			}
		}
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
