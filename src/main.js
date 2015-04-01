//@program
var THEME = require('themes/sample/theme');
var BUTTONS = require("controls/buttons");
var DIALOG = require('mobile/dialog');
var MODEL = require('mobile/model');

deviceURL = "";
var whiteSkin = new Skin( { fill:"white" } );
var cameraSkin = new Skin({width: 48,
						   height: 48,
						   fill:"white",
						   texture: new Texture('camera.png')
						   });
var cameraPressSkin = new Skin({width: 48,
						   height: 48,
						   fill:"white",
						   texture: new Texture('camera-press.png')
						   });
var cameraLoadingSkin = new Skin({width: 48,
						   height: 48,
						   fill:"white",
						   texture: new Texture('camera-loading.png')
						   });
						   
var rabbitSkin = new Skin({width: 128,
						   height: 128,
						   fill:"white",
						   texture: new Texture('rabbit.png')
						   });
var lettuceSkin = new Skin({width: 48,
						   height: 48,
						   fill:"white",
						   texture: new Texture('lettuce.png')
						   });
var waterSkin = new Skin({width: 48,
						   height: 48,
						   fill:"white",
						   texture: new Texture('water.png')
						   });
var haySkin = new Skin({width: 48,
						   height: 48,
						   fill:"white",
						   texture: new Texture('hay.png')
						   });
var labelStyle = new Style( { font: "bold 40px", color:"black" } );
var buttonLabelStyle = new Style({font:"bold 20px", color:"black"});

Handler.bind("/discover", Behavior({
	onInvoke: function(handler, message){
		deviceURL = JSON.parse(message.requestText).url;
	}
}));

Handler.bind("/forget", Behavior({
	onInvoke: function(handler, message){
		deviceURL = "";
	}
}));
//taken from dialog project
Handler.bind("/busy", Object.create(MODEL.DialogBehavior.prototype, {
	onDescribe: { value: 
		function(query) {trace('inside onDescribe');
			return {
                    Dialog: DIALOG.Box,
                    title: "Fetching New Profile Picture!",
                    items: [
                        {
                            Item: DIALOG.Spinner, 
                        },
               
                    ],
                    cancel: "Cancel",
                };
		},
	},
}));

function hasFoundDevice(){
	return deviceURL != "";
}

var shutterSound = new Sound( mergeURI( application.url, "Shutter-02.wav" ) );
var titleLabel = new Label({left:0, height:40, string:"Rabbit Care", style: labelStyle});
var pictureButtonTemplate = BUTTONS.Button.template(function($){ return{
	left:20, right: 0, height:30, skin: cameraSkin,
	contents: [
		new Label({left:0, right:0, height:20, string:"", style: buttonLabelStyle})
	],
	behavior: Object.create(BUTTONS.ButtonBehavior.prototype, {
		onTap: { value: function(content){
		if(!hasFoundDevice())
			return;
		content.skin = cameraLoadingSkin;
		shutterSound.play();
		content.invoke(new Message("/busy"));
		content.invoke(new Message(deviceURL + "takePicture"), Message.JSON);
		}},
		onComplete: { value: function(content, message, json){
			content.skin = cameraSkin;
			if(message.error != 0){
				trace(json);
				profilePicture.url = json.url;
			}
		}}
	})
}});

var pictureButton = new pictureButtonTemplate();

var profilePicture = new Picture({url: 'rabbit.png', height:160});


var counterLabel = new Label({left:0, right:0, height:40, string:"0", style: labelStyle});
var ResetButton = BUTTONS.Button.template(function($){ return{
	left: 0, right: 0, height:50,
	contents: [
		new Label({left:0, right:0, height:40, string:"Reset", style: labelStyle})
	],
	behavior: Object.create(BUTTONS.ButtonBehavior.prototype, {
		onTap: { value: function(content){
			content.invoke(new Message(deviceURL + "reset"), Message.JSON);
		}},
		onComplete: { value: function(content, message, json){
			counterLabel.string = json.count;
		}}
	})
}});

var mainColumn = new Column({
	left: 0, right: 0, top: 0, bottom: 0, active: true, skin: whiteSkin,
	contents: [
		new Line({left:0, right:0,top:0,name: "headerLine",
			contents: [
				titleLabel, pictureButton
				
			]
		}),
		new Line({left:0, right:0,top:0,name: "contentLine",
			contents: [
				profilePicture
			]
		}),
		new Line({left:0, right:0,top:0,height:200,name: "resourceLine",
			contents: [
				new Content({left:0, right:0, top:0, bottom:0, skin: waterSkin}),
				new Content({left:0, right:0, top:0, bottom:0, skin: lettuceSkin}),
				new Content({left:0, right:0, top:0, bottom:0, skin: haySkin}),
			]
		}),
		new Label({left:0, right:0, height:40, string:"Counter:", style: labelStyle}),
		counterLabel,
		new ResetButton(),
		
	],
	behavior: Behavior({
		onTouchEnded: function(content){
			if (deviceURL != "") content.invoke(new Message(deviceURL + "getCount"), Message.JSON);
		},
		onComplete: function(content, message, json){
			counterLabel.string = json.count;
		}	
	})
});

var ApplicationBehavior = Behavior.template({
	_onScreenBegan: { value: "onScreenBegan", writable: false },
	_onScreenEnding: { value: "onScreenEnding", writable: false },
	_onScreenRotated: { value: "onScreenRotated", writable: false },
	onDisplayed: function(application) {
		application.discover("pet.feeder.device.app");
	},
	onQuit: function(application) {
		application.forget("pet.feeder.device.app");
	},
	openDialog: function(dialog) {
					if (this.dialog)
						this.closeDialog()
					this.dialog = dialog;
					application.run(new THEME.DialogOpenTransition, dialog);
			},
	closeDialog: function() {
			application.run(new THEME.DialogCloseTransition, this.dialog);
			this.dialog = null;
			pictureButton.skin = cameraSkin;
		}
})

application.behavior = new ApplicationBehavior();
application.add(mainColumn);