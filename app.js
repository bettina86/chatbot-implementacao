var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var url = 'http://portal.uros.cloud/';

var FileCookieStore = require('tough-cookie-filestore');
// NOTE - currently the 'cookies.json' file must already exist!
var j = request.jar(new FileCookieStore('cookies.json'));
request = request.defaults({ jar : j })

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    /*appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD*/
    appId: '4bacbab9-c056-4979-b5e9-264423dbc522',
    appPassword: '7kLJwMTJ4VizNSTtPCe9C0o'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


bot.beginDialogAction('help', '/help', { matches: /^help/i });


//=========================================================
// Bots Dialogs
//=========================================================

function clearSession(session){
	session.userData.central = null;
    session.userData.username = null;
    session.userData.password = null;
}

bot.dialog('/', function (session) {

    session.send("Ola, eu sou o assistente pessoal do Uros, em que eu posso ajudar?");
    if(!session.userData.central){
    	session.beginDialog('rootMenu');
    } else {
    	session.beginDialog('DeviceFunctions');
    }
});

bot.dialog('/help', function (session) {

    session.send("Ola, eu sou o assistente pessoal do Uros, em que eu posso ajudar?");
    if(!session.userData.central){
    	session.beginDialog('rootMenu');
    } else {
    	session.beginDialog('DeviceFunctions');
    }
});

bot.dialog('rootMenu', [
    function (session) {
        builder.Prompts.choice(session, "Selecione uma opção:", 'Entrar|Mais Informações');
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('login');
                break;
            case 1:
            	session.beginDialog('about');
            default:
            	clearSession(session);
                session.endDialog();
                break;
        }
    },
    function (session) {
        // Reload menu
        session.replaceDialog('rootMenu');
    }
]).reloadAction('showMenu', null, { matches: /^(menu|back)/i });

bot.dialog('about', function(session){
		session.send('Uros é um sistema inteligente de controle de acesso! Além de contar com wifi e protocolo Uros de comunicação sem fio entre dispositivos, ele aprende com o uso e pode indicar ações de melhorias e segurança.');
		session.send('A solução oferecida é composta por:');
		        var msg = new builder.Message(session)
	            .attachmentLayout(builder.AttachmentLayout.carousel)
	            .attachments([
	                new builder.HeroCard(session)
	                    .title("Central")
	                    .subtitle("A central é o cérebro do sistema Uros, fazendo a integração entre os dispositivos, como sensores, fechaduras e leitoras de cartão, ela também se conecta a internet, permitindo controlar tudo isso online.")
	                    .images([
	                        builder.CardImage.create(session, "http://uros.cloud/images/blog/1.jpg")
	                            .tap(builder.CardAction.showImage(session, "http://uros.cloud/images/blog/1.jpg")),
	                    ])
	                    .buttons([
                        		builder.CardAction.openUrl(session, "http://uros.cloud", "Saiba Mais")
                    	]),
	                new builder.HeroCard(session)
	                    .title("Sensor de Presença")
	                    .subtitle("Sensor de presença sem fio do tipo infravermelho. Pode trabalhar em conjunto com outros sensores, para criar redundâncias ou perfil de eventos.")
	                    .images([
	                        builder.CardImage.create(session, "http://uros.cloud/images/blog/3.jpg")
	                            .tap(builder.CardAction.showImage(session, "http://uros.cloud/images/blog/3.jpg")),
	                    ])
	                    .buttons([
                        		builder.CardAction.openUrl(session, "http://uros.cloud", "Saiba Mais")
                    	]),
	                new builder.HeroCard(session)
	                    .title("Leitor de Cartão")
	                    .subtitle("Leitor de identificação de cartão ou Tags RFID sem fio, com instalação descomplicada, permitindo que o leitor seja posicionado em portas de vidro, colunas, sem uso de fios.")
	                    .images([
	                        builder.CardImage.create(session, "http://uros.cloud/images/blog/2.jpg")
	                            .tap(builder.CardAction.showImage(session, "http://uros.cloud/images/blog/2.jpg"))
	                    ])
	                    .buttons([
                        		builder.CardAction.openUrl(session, "http://uros.cloud", "Saiba Mais")
                    	]),
	                    new builder.HeroCard(session)
	                    .title("Fechadura Eletrônica")
	                    .subtitle("Atuador da fechadura. Trata-se de um relé sem fio, que aciona a fechadura da porta. Pode ser utilizada com uma vasta variedade de fechaduras encontradas no mercado.")
	                    .images([
	                        builder.CardImage.create(session, "http://uros.cloud/images/blog/4.jpg")
	                            .tap(builder.CardAction.showImage(session, "http://uros.cloud/images/blog/4.jpg"))
	                    ])
	                    .buttons([
                        		builder.CardAction.openUrl(session, "http://uros.cloud", "Saiba Mais")
                    	])
	    ]);
        session.send(msg);
       
});


bot.dialog('login',[

	function (session) {
    	 builder.Prompts.text(session,"Insira o nome de usuario");
	},

	function (session, results) {
       session.userData.username = results.response;
       builder.Prompts.text(session,"Agora insira a senha");

	},

	function(session, results) {
		 session.userData.password = results.response;

		request(url + 'api/auth/signin',{
			method: 'POST',
			form: {
				username: session.userData.username,
				password: session.userData.password
			},
		}, function(error, response, body) {

		 	if (!error && response.statusCode == 200) { 
		 		session.userData.central = JSON.parse(body).central;
				console.log(session.userData.central);
				session.send("Login realizado com sucesso");
				session.beginDialog('DeviceFunctions');
		 	}else{
		 		session.send("Erro ao efetuar login");
		 		session.beginDialog('rootMenu');
		 	} 

		});
	
	}

]);



bot.dialog('DeviceFunctions',[ 
 function (session) {
        builder.Prompts.choice(session, "Selecione uma das opções abaixo:", 'Ver histórico|Abrir Porta|Adicionar Acesso|Remover Acesso|Sair');
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('PirHistory');
                break;
            case 1:	
            	session.beginDialog('OpenDoor');
            	break;
            case 2:	
            	session.beginDialog('AddCard');
            	break;
            case 3:	
            	session.beginDialog('DelCard');
            	break;
            default:
            	clearSession(session);
                session.endDialog();
                break;
        }
    }
]);


bot.dialog('OpenDoor', [
	function(session) {
		builder.Prompts.text(session, 'Digite a senha para abertura da porta');

	},

	function(session, results){

			
		request(url + 'api/centrals/openDoor/'+session.userData.central,{
			method: 'POST',
			form:{
				password: results.response
			}
		}, function(error, response, body) {
		 	if (!error && response.statusCode == 200) { 
		 		console.log(body);
		 		session.send('Porta Aberta');
		 		session.beginDialog('DeviceFunctions');
		 	}else{
		 		console.log('deu pau');
		 		session.endDialog('Porta Não foi aberta');
		 	} 
		});

	}
]);

bot.dialog('PirHistory',[
 	function(session){

		request(url + 'api/dispositivos', function(error, response, body) {
				if (!error && response.statusCode == 200) { 
					var dispositivos = JSON.parse(body);
					var select ='{ ';

					for(var i in dispositivos){
						
						select += '"' + dispositivos[i].nome +'":{ "id": "' + dispositivos[i]._id +'"},';
					}
					select = select.substr(0, select.length -1);
					select +='}';
					select = JSON.parse(select);
					session.userData.dispositivos = select;



					builder.Prompts.choice(session, 'Selecione o Dispositivo para acessar o histórico', select);

				} else {
					session.send('Algo deu errado');
					session.beginDialog('DeviceFunctions');

				}

			});
	},

	function(session, results){
		console.log(results.response.entity);

		for(var i in session.userData.dispositivos){
			if(i == results.response.entity){
				console.log(session.userData.dispositivos[i]);

				request(url + 'api/dispositivos/' + session.userData.dispositivos[i].id + '/historico', function(error, response, body) {
					if (!error && response.statusCode == 200) { 
						var history = body.substr(1, body.length-2);
						console.log(history);
						history = history.split(',');
						var count = 0;

						for(var i = 0; i<history.length; i++){
							if(history[i]!= 'null'){
								session.send(history[i]);
								count++;
							}
						}

						if(!count){
							session.send('Nenhum histórico neste dispositivo');
						}
						session.beginDialog('DeviceFunctions');
					}
				});


			}
		}


	}
]);

bot.dialog('AddCard',[
	function(session){
		builder.Prompts.text(session, 'Digite o nome do dono do cartão');
	},
	function(session, results){
		session.userData.cardName = results.response;
		builder.Prompts.text(session, 'Digite o numero do cartão');
	},
	function(session, results){
		session.userData.cardId = results.response;

		request(url + 'api/centrals/AddCard/' + session.userData.central, {
			method:'POST',
			form:{
				name: session.userData.cardName,
				id_card: session.userData.cardId
			}
		}, function(error, response, body) {
			if (!error && response.statusCode == 200) { 
				session.userData.cardName = session.userData.cardId = null;
				session.send('Novo cartão adicionado');
				session.beginDialog('DeviceFunctions');
			} else {
				session.send('Algo deu errado');
				session.beginDialog('DeviceFunctions');
			}
		});

	}
]);


bot.dialog('DelCard',[
	function(session){
		request(url + 'api/centrals/cardlist/' + session.userData.central, function(error, response, body) {
			if (!error && response.statusCode == 200) { 
				var cards = JSON.parse(body);
				var select = '';
				for(var i in cards.validCards){
					select += cards.validCards[i].name + '|';
				}
				select += 'Sair';

				builder.Prompts.choice(session, 'Selecione qual usuário você deseja remover', select);


			} else {
				session.send('Algo deu errado');
				session.beginDialog('DeviceFunctions');
			}


		});

	}, 
	function(session, results){
		var response = results.response.entity;
		if(response == 'Sair'){
			session.beginDialog('DeviceFunctions');
		}else {
			request(url + 'api/centrals/delcard/' + session.userData.central, {
				method: 'POST',
				form:{
					name: response
				}
			}, function(error, response, body) {
				if (!error && response.statusCode == 200) { 
					console.log(body);
					session.send('Usuario Removido');
					session.beginDialog('DeviceFunctions');

				} else {
					console.log(body);
					session.send('Algo deu errado');
					session.beginDialog('DeviceFunctions');
				}
			});
		}
	}

]);


