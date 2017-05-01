(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	var utils={
		SERVER:"<Server>",
		isChannel:function(target)
		{
			return /^[#\$]/.test(target);
		}
	};

	SMOD("messageUtils",utils);

	if(typeof module !== "undefined") module.exports=utils;

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);